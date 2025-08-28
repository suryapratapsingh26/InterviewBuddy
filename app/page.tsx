"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { roles } from "@/constants";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleSelection = (roleId: string) => {
    // Navigate to interview page with pre-selected role
    router.push(`/interview?role=${roleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, show guest homepage
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              Master Your Interview Skills with{" "}
              <span className="bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12">
              Practice real-time mock interviews with our AI-powered
              interviewer. Get detailed feedback and improve your performance.
            </p>
            <div className="flex items-center justify-center space-x-6">
              <Link href="/sign-up">
                <button className="btn-primary px-8 py-4 text-lg">
                  Get Started
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="btn-secondary px-8 py-4 text-lg">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show full homepage with role cards
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Welcome back, {user.displayName || user.email?.split("@")[0]}!
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12">
            Ready to practice? Choose your role and start your AI-powered mock
            interview.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelection(role.id)}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-buddy-orange-500 transition-colors">
                {role.title}
              </h3>
              <p className="text-white/70 mb-4">{role.description}</p>
              <div className="flex flex-wrap gap-2">
                {role.techStack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
                  >
                    {tech}
                  </span>
                ))}
                {role.techStack.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                    +{role.techStack.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
