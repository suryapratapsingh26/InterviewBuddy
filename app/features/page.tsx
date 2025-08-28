export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Features</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Discover what makes InterviewBuddy the perfect platform for
            mastering your interview skills
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              AI-Powered Interviews
            </h3>
            <p className="text-white/70">
              Real-time voice conversations with AI interviewer using advanced
              VAPI integration for authentic practice sessions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Performance Analytics
            </h3>
            <p className="text-white/70">
              Comprehensive 5-category scoring system analyzing communication,
              technical knowledge, problem-solving, and more.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">🎨</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Role-Specific Practice
            </h3>
            <p className="text-white/70">
              Tailored interview scenarios for Frontend, Backend, Full Stack,
              DevOps, Mobile, and Data Science roles.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">🔊</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Voice Integration
            </h3>
            <p className="text-white/70">
              Real-time speech recognition with AI voice responses and visual
              speaking indicators for natural conversations.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Secure Authentication
            </h3>
            <p className="text-white/70">
              Firebase Authentication with session management, protected routes,
              and automatic redirect handling.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Responsive Design
            </h3>
            <p className="text-white/70">
              Mobile-friendly interface with dark theme, gradient backgrounds,
              and interactive animations throughout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
