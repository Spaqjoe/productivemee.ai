import Link from "next/link";
import { HeroSpline } from "@/components/home/hero-spline";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="px-6 py-6">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Productive Me</div>
          <Link
            href="/auth/sign-in"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-6 md:flex-row md:items-center">
        <section className="flex flex-1 flex-col gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1 text-xs font-medium uppercase tracking-widest text-indigo-300">
            Productive Me
          </span>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Focus on what matters. Let Productive Me handle the rest.
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Plan your day, stay ahead of deadlines, and keep every metric at your fingertips. Productive Me brings tasks,
            calendar, finances, and insights together in one AI-guided workspace.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-full bg-indigo-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 hover:shadow-indigo-400/30"
            >
              Get Started
            </Link>
          </div>


        </section>

        <aside className="flex flex-1 items-center justify-center">
          <div className="grid grid-cols-1 gap-4 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Unified planning</h3>
              <p className="mt-1 text-slate-400">Capture tasks, notes, and focus sessions with one flexible workspace.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-slate-200">AI copilots</h3>
              <p className="mt-1 text-slate-400">Automate workflows, summarize progress, and unblock your team instantly.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Insightful dashboards</h3>
              <p className="mt-1 text-slate-400">Monitor habits, finances, and team health with live dashboards.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
