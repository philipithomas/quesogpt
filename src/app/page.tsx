"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "dog";
  id: string; // for dog messages, this is image id; for user messages uuid
  content: string; // text for user, caption for dog
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDogTyping, setIsDogTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages change or typing indicator appears
  useEffect(() => {
    scrollToBottom();
  }, [messages, isDogTyping]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    // optimistic UI
    setMessages((prev) => [...prev, { role: "user", id: `${Date.now()}`, content: text }]);
    setInput("");
    setIsDogTyping(true);

    const usedIds = messages.filter((m) => m.role === "dog").map((m) => m.id);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, usedIds }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "dog",
            id: data.id as string,
            content: data.caption as string,
          },
        ]);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("chat error", err);
    } finally {
      setIsDogTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-screen-sm mx-auto p-4 h-svh">
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto border rounded p-4 bg-gray-50 dark:bg-gray-900"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className="my-2 flex flex-col items-start">
            {msg.role === "user" ? (
              <div className="self-end bg-blue-500 text-white rounded px-3 py-2 max-w-[80%]">
                {msg.content}
              </div>
            ) : (
              <div className="self-start">
                <img
                  src={`/queso/${msg.id}.jpeg`}
                  alt={msg.content}
                  className="max-w-[250px] rounded shadow"
                  onLoad={scrollToBottom}
                />
              </div>
            )}
          </div>
        ))}
        {isDogTyping && (
          <div className="my-2 flex flex-col items-start">
            <div className="self-start text-2xl animate-spin">
              🐶
            </div>
          </div>
        )}
      </div>

      <div className="w-full mt-4 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask Queso something 🐶"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={send}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
