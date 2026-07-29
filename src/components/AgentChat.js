"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Tailwind styling for markdown elements the assistant might use - mainly
// tables (multi-item results) and lists/paragraphs, kept visually close to
// the existing plain-text bubble.
const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto rounded-lg border border-oak/60 last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-oak/40">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-oak/60 px-2 py-1 text-left font-medium whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-oak/30 px-2 py-1 align-top">{children}</td>,
};

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
  const [history, setHistory] = useState([]); // raw chat messages (for the API)
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
        { role: "assistant", text: data.reply || "(no response)", products: data.products ?? [] },
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
              {message.role === "user" ? (
                <span className="inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-grape px-4 py-2 text-sm text-white">
                  {message.text}
                </span>
              ) : (
                <div className="inline-block max-w-[85%] rounded-2xl bg-oak/25 px-4 py-2 text-left text-sm text-plum">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                    {message.text}
                  </ReactMarkdown>
                </div>
              )}
              {message.products?.length > 0 && (
                <div className="mt-2 flex max-w-[85%] gap-3 overflow-x-auto pb-1">
                  {message.products.map((product) => (
                    <div
                      key={product.itemId}
                      className="flex w-28 flex-shrink-0 flex-col items-center gap-1 rounded-xl border border-oak/60 bg-white p-2 text-center"
                    >
                      <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-oak/25">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <p className="w-full truncate text-xs text-plum" title={product.name}>
                        {product.name}
                      </p>
                      <p className="text-xs font-medium text-plum/70">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
