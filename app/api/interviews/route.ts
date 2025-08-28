import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    // Add request timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 10000)
    );

    const bodyPromise = request.json();
    const body = await Promise.race([bodyPromise, timeoutPromise]);

    const { role, techStack, userId, userName } = body;

    // Early validation to fail fast
    if (!role || !techStack || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Optimize database write with batch operations for better performance
    const batch = db.batch();
    const interviewRef = db.collection("interviews").doc();

    batch.set(interviewRef, {
      role,
      techstack: techStack, // Note: using 'techstack' to match your existing schema
      userId,
      userName: userName || "User",
      questions: [], // Will be populated based on role and tech stack
      type: "Technical",
      createdAt: new Date(),
      status: "pending",
    });

    // Execute batch write (faster than individual writes)
    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        interviewId: interviewRef.id,
      },
      {
        // Add response headers for better caching
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating interview:", error);

    // Return more specific error messages
    if (error instanceof Error && error.message === "Request timeout") {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
