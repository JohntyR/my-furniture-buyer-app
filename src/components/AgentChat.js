"use client";

import { useState } from "react";

function textFromMessage(message) {
  if (typeof message.content === "string") return message.content;
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export default function AgentChat() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]); // raw Anthropic messages (for the API)
  const [displayMessages, setDisplayMessages] = useState([]); // [{role, text}] for rendering

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || status === "sending") return;

    setInput("");
    setError("");
    setStatus("sending");
    setDisplayMessages((prev) => [...prev, { role: "user", text: message }]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messages: history }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setHistory(data.messages ?? []);
      setDisplayMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "(no response)" },
      ]);
    } catch {
      setError("Couldn't reach the assistant. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="text-xl font-semibold text-plum">Shopping Assistant</h1>
        <p className="text-sm text-plum/50">
          Ask in plain English - e.g. &quot;what&apos;s the cheapest chair you have?&quot; or
          &quot;show me sofas&quot;.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-oak/60 bg-white p-4 shadow-sm">
        {displayMessages.length === 0 ? (
          <p className="text-sm text-plum/40">No messages yet - say hello.</p>
        ) : (
          displayMessages.map((message, index) => (
            <div
              key={index}
              className={message.role === "user" ? "text-right" : "text-left"}
            >
              <span
                className={
                  "inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm " +
                  (message.role === "user"
                    ? "bg-grape text-white"
                    : "bg-oak/25 text-plum")
                }
              >
                {message.text}
              </span>
            </div>
          ))
        )}
        {status === "sending" && (
          <p className="text-sm text-plum/40">
            <span className="animate-pulse">Thinking…</span>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a request..."
          className="flex-1 rounded-full border border-oak/60 bg-white px-4 py-2 text-sm text-plum placeholder:text-plum/40 focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
        />
        <button
          type="submit"
          disabled={status === "sending" || !input.trim()}
          className="rounded-full bg-tomato px-5 py-2 text-sm font-medium text-white transition hover:bg-tomato/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
