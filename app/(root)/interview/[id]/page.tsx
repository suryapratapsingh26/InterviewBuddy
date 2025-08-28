import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  // ✅ Await params before accessing properties
  const { id } = await params;

  if (!id || typeof id !== "string") {
    console.error("Invalid interview ID:", id);
    redirect("/");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Modern Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            {/* Left Section - Interview Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Interview Avatar & Title */}
              <div className="flex flex-row gap-4 items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <Image
                    src={getRandomInterviewCover()}
                    alt="cover-image"
                    width={60}
                    height={60}
                    className="relative rounded-full object-cover size-[60px] border-2 border-white/20 shadow-lg"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white capitalize bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 bg-clip-text text-transparent">
                    {interview.role} Interview
                  </h1>
                  <p className="text-white/60 text-sm mt-1">
                    AI-Powered Mock Interview Session
                  </p>
                </div>
              </div>

              {/* Tech Stack Display */}
              <div className="flex flex-col gap-2">
                <p className="text-white/80 text-sm font-medium">
                  Technologies:
                </p>
                <DisplayTechIcons techStack={interview.techstack} />
              </div>
            </div>

            {/* Right Section - Interview Type Badge */}
            <div className="flex flex-col gap-2 items-end">
              <div className="bg-gradient-to-r from-buddy-orange-500/20 to-buddy-purple-500/20 backdrop-blur-sm border border-buddy-orange-500/30 px-6 py-3 rounded-full shadow-lg">
                <p className="text-buddy-orange-400 font-semibold text-sm uppercase tracking-wide">
                  {interview.type}
                </p>
              </div>
              <p className="text-white/50 text-xs">Interview Mode</p>
            </div>
          </div>

          {/* Interview Status Indicator */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-white/80 text-sm font-medium">
                  Interview Room Active
                </span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <span className="text-white/60 text-sm">
                Welcome, {user.name || "User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Agent Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Agent Header - WORKING FIX */}
          <div className="bg-gradient-to-r from-buddy-orange-500/10 to-buddy-purple-500/10 border-b border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12">
                <Image
                  src="/ai-avatar.png"
                  alt="AI Interviewer"
                  width={48}
                  height={48}
                  className="w-full h-full rounded-full object-cover border-2 border-white/20 shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  AI Interviewer
                </h2>
                <p className="text-white/60 text-sm">
                  Ready to conduct your interview
                </p>
              </div>
            </div>
          </div>

          {/* Agent Component */}
          <div className="p-6">
            <Agent
              userName={user.name || "User"}
              userId={user.id}
              interviewId={id}
              type="interview"
              questions={interview.questions}
              feedbackId={feedback?.id}
              role={interview.role}
              techStack={interview.techstack}
            />
          </div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-buddy-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-buddy-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default InterviewDetails;
