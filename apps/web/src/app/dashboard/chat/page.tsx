"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Why did my emissions increase?",
  "How can I save 100 kg this month?",
  "Is chicken better than beef?",
  "What's the impact of one flight?",
];

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const token = line.slice(6);
          if (token === "[DONE]") break;
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + token };
            return copy;
          });
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Carbon Assistant</h1>
        <p className="text-gray-500 mt-1">Ask anything about your footprint</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-4xl">🌿</p>
            <p className="text-gray-500">Ask your carbon coach anything</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {m.content || <span className="animate-pulse">▋</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={e => { e.preventDefault(); send(input); }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your carbon footprint…"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="bg-brand-600 text-white font-semibold px-5 rounded-xl hover:bg-brand-700 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
