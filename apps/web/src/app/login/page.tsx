"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute -top-12 left-0 text-white/70 hover:text-white flex items-center gap-1 text-sm transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>

        {/* Card */}
        <div className="bg-brand-dark-card border border-brand-dark-border rounded-2xl p-8">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-pink">OwnRadio</h1>
            <p className="mt-2 text-white/60">Welcome back</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-brand-dark border border-brand-dark-border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-pink transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-brand-dark border border-brand-dark-border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-pink transition-colors"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-brand-pink to-brand-pink-light disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign up prompt */}
          <p className="mt-6 text-center text-white/50 text-sm">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-brand-pink hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
