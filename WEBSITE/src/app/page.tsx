export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-4xl text-center space-y-6">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <span className="bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full">
            For modern learners & creators
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900 leading-tight">
          Organize your learning,
          <br className="hidden md:block" />
          content, and progress in one place
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Studzee helps you learn faster with structured content, smart
          summaries, and interactive quizzes — across web, mobile, and desktop.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <button className="px-6 py-3 rounded-lg bg-gray-900 text-white font-base hover:bg-gray-700 transition">
            Try Studzee for free
          </button>
        </div>
      </div>
    </main>
  );
}
