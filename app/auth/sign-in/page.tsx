"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import dynamic from 'next/dynamic';

const SplineRobotServer = dynamic(
  async () => {
    const mod = await import('@/components/auth/spline-robot-server');
    return { default: mod.default };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
);

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder") || supabaseKey.includes("placeholder")) {
            setError("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.");
            setLoading(false);
            return;
        }

        try {
            // Create client only when needed (lazy initialization)
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            // Check if it's a network/configuration error
            if (error?.message?.includes("fetch") || error?.message?.includes("network") || error?.message?.includes("placeholder")) {
                setError("Unable to connect to Supabase. Please check your configuration.");
            } else {
                setError(error.message || "Failed to sign in. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - 3D Robot */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-100 to-blue-100 items-center justify-center p-12">
                <div className="w-full h-full rounded-lg overflow-hidden" style={{ minHeight: 'calc(100vh - 6rem)' }}>
                    <SplineRobotServer />
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-sm"></div>
                            </div>
                            <span className="text-2xl font-bold text-black">Productive Me</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-black mb-2">Log in to your account</h1>
                        <p className="text-gray-600">Welcome back! Please enter your details.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignIn} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-black"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                                Password
                            </label>
                            <div className="relative">
                            <Input
                                id="password"
                                    type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                    className="border-0 border-b border-gray-300 rounded-none px-0 pr-10 focus-visible:ring-0 focus-visible:border-black"
                                required
                            />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <IoEyeOffOutline className="h-5 w-5" />
                                    ) : (
                                        <IoEyeOutline className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                />
                                <span className="text-sm text-gray-700">Remember for 30 days</span>
                            </label>
                            <Link href="#" className="text-sm text-black hover:underline">
                                Forgot Password
                            </Link>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                        )}

                        {/* Login Button */}
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-md font-medium"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Log In"}
                        </Button>

                        {/* Google Sign In Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-gray-100 text-black hover:bg-gray-200 h-12 rounded-md font-medium border-gray-300"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        {/* Sign Up Link */}
                        <div className="text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/auth/sign-up" className="text-black font-medium hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

