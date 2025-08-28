"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { cacheGet, cacheSet, cacheDelete } from "@/lib/cache";

// TypeScript interface for type safety
interface FeedbackResponse {
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  console.log("=== createFeedback START ===");
  console.log("Params received:", {
    interviewId,
    userId,
    transcriptLength: transcript?.length || 0,
    feedbackId,
  });

  try {
    // Check if transcript exists and has content
    if (!transcript || transcript.length === 0) {
      console.error("No transcript data provided");
      return { success: false, error: "No transcript data" };
    }

    // Check if interviewId is provided
    if (!interviewId) {
      console.error("No interviewId provided");
      return { success: false, error: "No interviewId provided" };
    }

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    console.log(
      "Formatted transcript preview:",
      formattedTranscript.substring(0, 200) + "..."
    );

    console.log("Calling AI to generate feedback...");

    // Use generateObject with no-schema and STRICT prompt engineering
    const result = await generateObject({
      model: google("gemini-2.0-flash-001"),
      output: "no-schema",
      prompt: `
        You are a STRICT professional interviewer analyzing this transcript:

        ${formattedTranscript}

        BE EXTREMELY HARSH and REALISTIC in your scoring. Most poor performers should score 15-40 total.

        SCORING CRITERIA (be ruthless):
        - 0-20: Completely inadequate/no meaningful response
        - 21-40: Poor performance, major issues
        - 41-60: Below average, needs significant improvement  
        - 61-75: Average performance
        - 76-85: Good performance
        - 86-95: Excellent performance
        - 96-100: Outstanding, exceptional

        Generate feedback as a JSON object with this EXACT structure:
        
        {
          "totalScore": <number 0-100 - BE HARSH, most poor interviews should be 15-40>,
          "categoryScores": [
            {
              "name": "Communication Skills",
              "score": <0-100 - SEVERELY punish unclear, brief, incomplete responses>,
              "comment": "<brutally honest assessment - point out specific failures>"
            },
            {
              "name": "Technical Knowledge", 
              "score": <0-100 - if no technical discussion shown, score 0-25>,
              "comment": "<be harsh about lack of technical demonstration>"
            },
            {
              "name": "Problem Solving",
              "score": <0-100 - if no problem solving shown, score 0-25>, 
              "comment": "<highlight complete absence of problem solving>"
            },
            {
              "name": "Cultural Fit",
              "score": <0-100 - brief responses show poor engagement, score very low>,
              "comment": "<criticize lack of personality/engagement>"
            },
            {
              "name": "Confidence and Clarity",
              "score": <0-100 - incomplete sentences = massive penalty>,
              "comment": "<be extremely harsh about unclear communication>"
            }
          ],
          "strengths": [<list ONLY actual strengths truly demonstrated - often should be empty for poor interviews>],
          "areasForImprovement": [<be comprehensive about all failures and weaknesses>],
          "finalAssessment": "<Give a brutally honest assessment - don't sugarcoat poor performance>"
        }

        CRITICAL SCORING RULES:
        - Brief/incomplete responses: score 5-25 in Communication
        - No technical content shown: score 0-20 in Technical Knowledge  
        - No problem solving demonstrated: score 0-20 in Problem Solving
        - Incomplete sentences: major score reduction across all categories
        - Vague/unclear responses: major penalties
        - Single word answers: score under 20 in relevant categories

        Be RUTHLESS. Poor interviews with brief, unclear responses should get 15-35 total scores.
      `,
      system:
        "Generate only valid JSON matching the exact structure requested. Be extremely strict in scoring - poor interviews should score 15-40 total. No markdown, no explanation, just the JSON object.",
    });

    // Safe casting with proper type conversion
    const object = result.object as unknown as FeedbackResponse;
    console.log("AI response received:", object);

    // ✅ Validate the AI response structure
    if (
      !object ||
      typeof object.totalScore !== "number" ||
      !Array.isArray(object.categoryScores)
    ) {
      throw new Error("Invalid feedback object structure received from AI");
    }

    // ✅ Ensure we have exactly 5 categories
    if (object.categoryScores.length !== 5) {
      console.warn(
        `Expected 5 categories, received ${object.categoryScores.length}`
      );
    }

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths || [],
      areasForImprovement: object.areasForImprovement || [],
      finalAssessment: object.finalAssessment || "Assessment completed",
      createdAt: new Date().toISOString(),
    };

    console.log("Preparing to save feedback to Firestore...");

    // Optimize database write with batch operation
    const batch = db.batch();
    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
      console.log("Using existing feedback ID:", feedbackId);
      batch.update(feedbackRef, feedback);

      // Clear cache for updated feedback
      const cacheKey = `feedback_${interviewId}_${userId}`;
      cacheDelete(cacheKey);
      console.log(`Cleared cache for updated feedback: ${cacheKey}`);
    } else {
      feedbackRef = db.collection("feedback").doc();
      console.log("Creating new feedback document with ID:", feedbackRef.id);
      batch.set(feedbackRef, feedback);
    }

    await batch.commit();
    console.log("Feedback saved successfully!");

    console.log("=== createFeedback SUCCESS ===");
    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("=== createFeedback ERROR ===");
    console.error("Error details:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);

    // ✅ Create fallback feedback if AI generation fails
    try {
      console.log("Creating fallback feedback due to AI generation failure...");

      const fallbackFeedback = {
        interviewId: interviewId,
        userId: userId,
        totalScore: 0,
        categoryScores: [
          {
            name: "Communication Skills",
            score: 0,
            comment:
              "Unable to assess due to technical error during AI processing",
          },
          {
            name: "Technical Knowledge",
            score: 0,
            comment:
              "Unable to assess due to technical error during AI processing",
          },
          {
            name: "Problem-Solving",
            score: 0,
            comment:
              "Unable to assess due to technical error during AI processing",
          },
          {
            name: "Cultural & Role Fit",
            score: 0,
            comment:
              "Unable to assess due to technical error during AI processing",
          },
          {
            name: "Confidence & Clarity",
            score: 0,
            comment:
              "Unable to assess due to technical error during AI processing",
          },
        ],
        strengths: [],
        areasForImprovement: [
          "Technical assessment could not be completed due to system error",
          "Please retry the feedback generation process",
        ],
        finalAssessment:
          "Assessment could not be completed due to technical issues. Please contact support if this persists.",
        createdAt: new Date().toISOString(),
      };

      const batch = db.batch();
      let feedbackRef;

      if (feedbackId) {
        feedbackRef = db.collection("feedback").doc(feedbackId);
        batch.update(feedbackRef, fallbackFeedback);
      } else {
        feedbackRef = db.collection("feedback").doc();
        batch.set(feedbackRef, fallbackFeedback);
      }

      await batch.commit();
      console.log("Fallback feedback saved successfully");

      return {
        success: true,
        feedbackId: feedbackRef.id,
        warning: "Feedback generated with fallback due to AI processing error",
      };
    } catch (fallbackError) {
      console.error("Failed to save even fallback feedback:", fallbackError);
      return {
        success: false,
        error: errorMessage || "Complete feedback generation failure",
      };
    }
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const cacheKey = `interview_${id}`;

  // Check persistent cache first
  const cachedInterview = cacheGet<Interview>(cacheKey);
  if (cachedInterview) {
    console.log(`✅ Cache HIT for interview ${id}`);
    return cachedInterview;
  }

  console.log(`❌ Cache MISS for interview ${id}, fetching from database`);
  const interview = await db.collection("interviews").doc(id).get();
  const data = interview.data() as Interview | null;

  // Cache the result if data exists (30 second TTL)
  if (data) {
    cacheSet(cacheKey, data, 30000);
    console.log(`💾 Cached interview ${id} for 30 seconds`);
  }

  return data;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;
  const cacheKey = `feedback_${interviewId}_${userId}`;

  // Check persistent cache first
  const cachedFeedback = cacheGet<Feedback>(cacheKey);
  if (cachedFeedback) {
    console.log(`✅ Cache HIT for feedback ${interviewId}`);
    return cachedFeedback;
  }

  console.log(
    `❌ Cache MISS for feedback ${interviewId}, fetching from database`
  );
  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  const data = { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;

  // Cache the result (30 second TTL)
  cacheSet(cacheKey, data, 30000);
  console.log(`💾 Cached feedback ${interviewId} for 30 seconds`);

  return data;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;
  const cacheKey = `latest_interviews_${userId}_${limit}`;

  // Check persistent cache first
  const cachedInterviews = cacheGet<Interview[]>(cacheKey);
  if (cachedInterviews) {
    console.log(`✅ Cache HIT for latest interviews ${userId}`);
    return cachedInterviews;
  }

  console.log(
    `❌ Cache MISS for latest interviews ${userId}, fetching from database`
  );
  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  const data = interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];

  // Cache the result (30 second TTL)
  cacheSet(cacheKey, data, 30000);
  console.log(`💾 Cached latest interviews for user ${userId}`);

  return data;
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const cacheKey = `user_interviews_${userId}`;

  // Check persistent cache first
  const cachedInterviews = cacheGet<Interview[]>(cacheKey);
  if (cachedInterviews) {
    console.log(`✅ Cache HIT for user interviews ${userId}`);
    return cachedInterviews;
  }

  console.log(
    `❌ Cache MISS for user interviews ${userId}, fetching from database`
  );
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  const data = interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];

  // Cache the result (30 second TTL)
  cacheSet(cacheKey, data, 30000);
  console.log(`💾 Cached user interviews for ${userId}`);

  return data;
}
