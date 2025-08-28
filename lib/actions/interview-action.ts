"use server";

import { db } from "@/firebase/admin";

export async function createInterview(params: {
  userId: string;
  role: string;
  type: string;
  techstack: string[];
}) {
  const { userId, role, type, techstack } = params;

  try {
    const interviewRef = db.collection("interviews").doc();

    const interview = {
      userId: userId,
      role: role,
      type: type,
      techstack: techstack,
      finalized: false,
      createdAt: new Date().toISOString(),
    };

    await interviewRef.set(interview);

    return { success: true, interviewId: interviewRef.id };
  } catch (error) {
    console.error("Error creating interview:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
