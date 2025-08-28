/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

/* ────────────── local enums & types ────────────── */
enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions: string[];
  role?: string;
  techStack?: string[];
}

/* ───────────────── component ───────────────────── */
const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  role,
  techStack,
}: AgentProps) => {
  const router = useRouter();

  /* ---------- UI state ---------- */
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [lastMessage, setLastMessage] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ─────────── VAPI event bridge ─────────── */
  useEffect(() => {
    const toString = (e: unknown) =>
      typeof e === "object" && e && "message" in e
        ? (e as any).message
        : JSON.stringify(e);

    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setErrorMessage("");
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
    };

    const onMessage = (m: any) => {
      if (m.type !== "transcript") return;

      if (m.transcriptType === "partial") {
        setIsAISpeaking(m.role === "assistant");
        setIsUserSpeaking(m.role === "user");
        return;
      }

      /* final transcript */
      setMessages((prev) => [...prev, { role: m.role, content: m.transcript }]);
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
    };

    const onSpeechStart = () => {
      setIsAISpeaking(true);
      setIsUserSpeaking(false);
    };

    const onSpeechEnd = () => {
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
    };

    const onError = (e: unknown) => {
      const msg = toString(e);
      console.error("VAPI Error:", msg);

      /* normal hang-up already handled by call-end */
      if (msg.includes("Meeting has ended")) return;

      setErrorMessage(msg || "Call error");
      setCallStatus(CallStatus.ERROR);
      setIsAISpeaking(false);
      setIsUserSpeaking(false);

      /* auto-reset */
      setTimeout(() => {
        setCallStatus(CallStatus.INACTIVE);
        setErrorMessage("");
      }, 2_000);
    };

    /* register */
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    /* cleanup */
    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);

      /* avoid Krisp race */
      (vapi as any).ready?.then(() => vapi.stop()).catch(() => {});
    };
  }, []);

  /* block tab close while call is active */
  useEffect(() => {
    const beforeUnload = (ev: BeforeUnloadEvent) => {
      if (callStatus === CallStatus.ACTIVE) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [callStatus]);

  /* transcript → feedback / navigation */
  useEffect(() => {
    if (messages.length) setLastMessage(messages.at(-1)!.content);

    if (callStatus !== CallStatus.FINISHED) return;

    const proceed = async () => {
      if (type === "generate") {
        router.push("/");
        return;
      }
      const valid = messages.filter((m) => m.content.trim().length);
      if (!valid.length) {
        router.push("/");
        return;
      }
      const res = await createFeedback({
        interviewId,
        userId,
        transcript: valid,
        feedbackId,
      });
      router.push(
        res?.success && res.feedbackId
          ? `/interview/${interviewId}/feedback`
          : `/interview/${interviewId}`
      );
    };
    proceed();
  }, [callStatus, messages]);

  /* ──────────── handlers ──────────── */
  const startCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);
      setErrorMessage("");

      if (type === "generate") {
        const id = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        if (!id) throw new Error("Missing VAPI_WORKFLOW_ID env var");

        await vapi.start(id, {
          variableValues: { username: userName, userid: userId },
        });
        return;
      }

      /* interview mode */
      const formattedQuestions = questions.map((q) => `- ${q}`).join("\n");

      const roleQuestions = `Role: ${role ?? "Developer"}
Technologies: ${techStack?.join(", ") ?? "General Programming"}

Interview Questions:
${formattedQuestions || "- Please introduce yourself."}

IMPORTANT: tailor everything to the role above.`;

      await vapi.start(interviewer, {
        variableValues: { questions: roleQuestions },
      });
    } catch (e) {
      console.error("start error:", e);
      setErrorMessage("Failed to start call");
      setCallStatus(CallStatus.ERROR);
    }
  };

  const endCall = () => {
    try {
      vapi.stop(); // UI updates on "call-end"
    } catch (e) {
      console.error("disconnect error:", e);
    }
  };

  const retry = () => {
    setCallStatus(CallStatus.INACTIVE);
    setErrorMessage("");
    setMessages([]);
    setLastMessage("");
    setIsAISpeaking(false);
    setIsUserSpeaking(false);
  };

  /* ────────────────── UI ────────────────── */
  return (
    <>
      {/* cards ----------------------------------------------------- */}
      <div className="call-view">
        {/* interviewer */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isAISpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {role && (
            <p className="text-xs text-buddy-orange-500 mt-1">
              {role} Specialist
            </p>
          )}
          {callStatus === CallStatus.ACTIVE && (
            <p className="text-sm text-white/60 mt-2">
              {isAISpeaking ? "Speaking…" : "Listening…"}
            </p>
          )}
        </div>

        {/* user */}
        <div className="card-border">
          <div className="card-content">
            <div className="avatar relative">
              <Image
                src="/user-avatar.png"
                alt="User"
                width={120}
                height={120}
                className="rounded-full object-cover size-[120px]"
              />
              {isUserSpeaking && <span className="animate-speak" />}
            </div>
            <h3>{userName}</h3>
            {role && (
              <p className="text-xs text-white/60 mt-1">{role} Candidate</p>
            )}
            {callStatus === CallStatus.CONNECTING && (
              <p className="text-sm text-white/60 mt-2">Connecting…</p>
            )}
            {callStatus === CallStatus.FINISHED && (
              <p className="text-sm text-white/60 mt-2">Interview complete</p>
            )}
            {callStatus === CallStatus.ACTIVE && (
              <p className="text-sm text-white/60 mt-2">
                {isUserSpeaking ? "You’re speaking…" : "Ready to speak"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* tech-stack badge (guarded) -------------------------------- */}
      {role && techStack && techStack.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/10">
          <div className="text-center">
            <h4 className="text-white font-semibold mb-2">Interview Focus</h4>
            <p className="text-buddy-orange-500 font-medium">{role}</p>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {techStack.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 bg-buddy-orange-500/20 text-buddy-orange-300 rounded-full text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* errors ---------------------------------------------------- */}
      {errorMessage && (
        <div className="transcript-border mb-4">
          <div className="transcript">
            <p className="text-red-400 text-center">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* transcript ------------------------------------------------ */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* controls -------------------------------------------------- */}
      <div className="w-full flex justify-center gap-4">
        {callStatus === CallStatus.ERROR ? (
          <button className="btn-primary" onClick={retry}>
            Try again
          </button>
        ) : callStatus !== CallStatus.ACTIVE ? (
          <button
            className="relative btn-call"
            onClick={startCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? `Start ${role ?? "Technical"} Interview`
                : callStatus === CallStatus.CONNECTING
                ? "Connecting…"
                : "Call"}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={endCall}>
            End Interview
          </button>
        )}
      </div>

      {/* tiny status line ----------------------------------------- */}
      {callStatus === CallStatus.ACTIVE && (
        <div className="text-center mt-4 text-sm text-white/60">
          AI: {isAISpeaking ? "🔊" : "👂"} | User:{" "}
          {isUserSpeaking ? "🔊" : "👂"}
        </div>
      )}
    </>
  );
};

export default Agent;
