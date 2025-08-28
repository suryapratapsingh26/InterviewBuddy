"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import { roles as AVAILABLE_ROLES } from "@/constants";

/* ──────────────────────────────────────────
   Types
────────────────────────────────────────── */
interface Role {
  id: string;
  title: string;
  description: string;
  icon: string;
  techStack: string[];
}

/* ──────────────────────────────────────────
   Search Params Component (Wrapped in Suspense)
────────────────────────────────────────── */
function InterviewSetupContent() {
  /* ––––– auth / user ––––– */
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ––––– role & tech-stack selection ––––– */
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  /* ––––– router helpers ––––– */
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ––––– all roles (typed) ––––– */
  const roles: Role[] = useMemo(() => AVAILABLE_ROLES as Role[], []);

  /* ─────────── auth guard ─────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (!usr) {
        router.push("/sign-in");
        return;
      }
      setUser(usr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  /* ───── pre-select role from URL params ───── */
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const techStackParam = searchParams.get("techstack");

    if (roleParam && roles.find((r) => r.id === roleParam)) {
      setSelectedRole(roleParam);

      if (techStackParam) {
        setSelectedTechStack(techStackParam.split(","));
      }
    } else if (roleParam) {
      console.error("Invalid role parameter:", roleParam);
      router.push("/");
    }
  }, [searchParams, roles, router]);

  /* ––––– derived helpers ––––– */
  const selectedRoleData: Role | undefined = useMemo(
    () => roles.find((r: Role) => r.id === selectedRole),
    [roles, selectedRole]
  );

  /* ───────── create interview ───────── */
  const handleStartInterview = async () => {
    if (!selectedRoleData || selectedTechStack.length === 0 || !user) return;

    setCreating(true);

    /* toast feedback (unchanged) */
    const loadingToast = document.createElement("div");
    loadingToast.textContent = "🚀 Creating your interview session...";
    loadingToast.className =
      "fixed top-4 right-4 bg-buddy-orange-500 text-white px-6 py-3 rounded-lg z-50 shadow-lg animate-pulse";
    loadingToast.id = "loading-toast";
    document.body.appendChild(loadingToast);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRoleData.id,
          techStack: selectedTechStack,
          userId: user.uid,
          userName: user.displayName || user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        loadingToast.textContent = "✅ Interview ready! Redirecting...";
        loadingToast.className =
          "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg z-50 shadow-lg";

        router.push(`/interview/${data.interviewId}`);

        setTimeout(() => {
          const toast = document.getElementById("loading-toast");
          toast && document.body.removeChild(toast);
        }, 2000);
      } else {
        throw new Error("Failed to create interview");
      }
    } catch (err) {
      console.error("Error creating interview:", err);
      loadingToast.textContent =
        "❌ Failed to create interview. Please try again.";
      loadingToast.className =
        "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg z-50 shadow-lg";

      setTimeout(() => {
        const toast = document.getElementById("loading-toast");
        toast && document.body.removeChild(toast);
      }, 3000);
      setCreating(false);
    }
  };

  /* ───────── render branches ───────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buddy-orange-500"></div>
          Loading interview setup...
        </div>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            No Role Selected
          </h1>
          <p className="text-white/70 mb-6">
            Please select a role from the homepage to start your interview.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary px-6 py-3"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!selectedRoleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Role not found</h1>
          <button
            onClick={() => router.push("/")}
            className="btn-primary px-6 py-3"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ───────── main UI ───────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            {selectedRoleData.title} Interview Setup
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            You're preparing for a {selectedRoleData.title} role. Select your
            tech stack to customize your interview.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="space-y-8">
            {/* Selected Role */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Selected Role
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 border-transparent text-white shadow-lg">
                <div className="text-2xl mb-2">{selectedRoleData.icon}</div>
                <h4 className="font-semibold mb-1">{selectedRoleData.title}</h4>
                <p className="text-sm opacity-80">
                  {selectedRoleData.description}
                </p>
              </div>
            </div>

            {/* Tech-stack buttons */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Select Technologies for {selectedRoleData.title}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedRoleData.techStack.map((tech: string) => (
                  <button
                    key={tech}
                    onClick={() =>
                      setSelectedTechStack((prev) =>
                        prev.includes(tech)
                          ? prev.filter((t) => t !== tech)
                          : [...prev, tech]
                      )
                    }
                    disabled={creating}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedTechStack.includes(tech)
                        ? "bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 text-white shadow-lg"
                        : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                    } ${
                      creating
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            {selectedTechStack.length > 0 && (
              <div className="flex justify-center pt-8">
                <button
                  className={`px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 transform ${
                    creating
                      ? "bg-gray-500 cursor-not-allowed opacity-50"
                      : "btn-primary hover:scale-105 shadow-lg hover:shadow-xl"
                  }`}
                  onClick={handleStartInterview}
                  disabled={creating}
                >
                  {creating ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Interview...
                    </div>
                  ) : (
                    `Start ${selectedRoleData.title} Interview`
                  )}
                </button>
              </div>
            )}

            {/* Summary */}
            {selectedTechStack.length > 0 && (
              <div className="bg-buddy-orange-500/10 border border-buddy-orange-500/20 rounded-lg p-4 mt-4">
                <h4 className="text-white font-semibold mb-2">
                  Interview Summary:
                </h4>
                <p className="text-white/80 text-sm">
                  <strong>Role:</strong> {selectedRoleData.title}
                </p>
                <p className="text-white/80 text-sm">
                  <strong>Technologies:</strong> {selectedTechStack.join(", ")}
                </p>
                <p className="text-white/80 text-sm">
                  <strong>Interview Type:</strong> Role-Specific Technical
                  Interview
                </p>
              </div>
            )}

            {/* Back link */}
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200"
                disabled={creating}
              >
                ← Back to Role Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Component with Suspense Wrapper
────────────────────────────────────────── */
export default function InterviewSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-white text-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buddy-orange-500"></div>
            Loading interview setup...
          </div>
        </div>
      }
    >
      <InterviewSetupContent />
    </Suspense>
  );
}
