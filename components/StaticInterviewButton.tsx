"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { Button } from "./ui/button";
import { createInterview } from "@/lib/actions/interview-action";

interface StaticInterviewButtonProps {
  role: string;
  techstack: string[];
}

const StaticInterviewButton = ({
  role,
  techstack,
}: StaticInterviewButtonProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleStartInterview = async () => {
    setIsCreating(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/sign-in");
        return;
      }

      // Create interview record first
      const result = await createInterview({
        userId: currentUser.uid,
        role: role,
        type: "technical",
        techstack: techstack,
      });

      if (result.success && result.interviewId) {
        // Navigate to interview page with the created interviewId
        router.push(`/interview/${result.interviewId}`);
      } else {
        console.error("Failed to create interview:", result.error);
        // Fallback to old method if creation fails
        router.push(
          `/interview?role=${encodeURIComponent(
            role
          )}&techstack=${encodeURIComponent(techstack.join(","))}`
        );
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      // Fallback to old method if there's an error
      router.push(
        `/interview?role=${encodeURIComponent(
          role
        )}&techstack=${encodeURIComponent(techstack.join(","))}`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleStartInterview}
      disabled={isCreating}
      className="btn-primary"
    >
      {isCreating ? "Starting..." : "Start Interview"}
    </Button>
  );
};

export default StaticInterviewButton;
