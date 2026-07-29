"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-oak/60 bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-2xl font-semibold text-plum">Welcome back</h1>
          <p className="mt-1 text-sm text-plum/50">Log in to your buyer account</p>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-plum/80">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-md border border-oak/60 px-3 py-2 text-sm focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-plum/80">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-oak/60 px-3 py-2 text-sm focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-tomato px-4 py-2 text-sm font-medium text-white transition hover:bg-tomato/90 disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-xs text-plum/40">
          Demo account: username <code className="text-plum/60">demo</code>, password{" "}
          <code className="text-plum/60">password123</code>
        </p>
      </form>
    </div>
  );
}
