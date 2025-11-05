import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-6xl font-bold">Productive Me</h1>
        <p className="text-xl text-muted-foreground">
          Your personal productivity dashboard
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg space-y-2">
            <h2 className="text-2xl font-semibold">Track Tasks</h2>
            <p className="text-muted-foreground">
              Organize your tasks with a Kanban board
            </p>
          </div>

          <div className="p-6 border rounded-lg space-y-2">
            <h2 className="text-2xl font-semibold">Manage Time</h2>
            <p className="text-muted-foreground">
              Monitor your screen time and schedule
            </p>
          </div>

          <div className="p-6 border rounded-lg space-y-2">
            <h2 className="text-2xl font-semibold">Track Finances</h2>
            <p className="text-muted-foreground">
              Keep tabs on your income and expenses
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/sign-in" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8">
            Sign In
          </Link>
          <Link href="/auth/sign-up" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8">
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
