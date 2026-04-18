"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function LoginSection() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="w-full py-10 px-6 flex justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
      </section>
    );
  }

  if (user) {
    return (
      <section className="w-full py-10 px-6 text-center">
        <p className="text-lg text-white font-semibold mb-5">
          Welcome back, {user.username}!
        </p>
        <Link
          href="/station/rock-haven"
          className="inline-block rounded-full bg-brand-pink px-8 py-3 text-sm font-bold text-white hover:bg-brand-pink-light transition-colors"
        >
          Go to stations
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full py-10 px-6 text-center">
      <h2 className="text-xl font-bold text-white mb-2">Join the crowd</h2>
      <p className="text-sm text-white/50 mb-7">
        Listen live. React. Chat. No setup needed.
      </p>

      {/* Google OAuth button */}
      <button
        type="button"
        onClick={() => alert("Google OAuth coming soon")}
        className="w-full flex items-center justify-center gap-3 rounded-full py-3 px-6 font-semibold text-sm text-white mb-3"
        style={{
          background: "linear-gradient(135deg, #ff2d78 0%, #ff6b9d 100%)",
        }}
      >
        {/* Google icon placeholder */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-white"
          aria-hidden="true"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      {/* Email button */}
      <Link
        href="/login"
        className="w-full flex items-center justify-center gap-2 rounded-full border border-brand-dark-border py-3 px-6 text-sm font-semibold text-white/80 hover:border-brand-pink hover:text-white transition-colors mb-5"
      >
        Continue with Email
      </Link>

      {/* Guest link */}
      <Link
        href="/station/rock-haven"
        className="text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        Continue as guest
      </Link>
    </section>
  );
}
