import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Thread,
  ChatMessage,
  subscribeToThreads,
  subscribeToMessages,
  sendMessage,
  markThreadRead,
} from "../../lib/firestore";

interface MessagesProps {
  initialThreadId?: string | null;
}

export function Messages({ initialThreadId }: MessagesProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to user's threads
  useEffect(() => {
    if (!user) return;
    return subscribeToThreads(user.uid, setThreads);
  }, [user]);

  // Subscribe to messages in the selected thread, and mark it read
  useEffect(() => {
    if (!selectedThreadId || !user) return;

    const unsub = subscribeToMessages(selectedThreadId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    // Mark this thread as read for the current user
    markThreadRead(selectedThreadId, user.uid).catch(console.error);

    return unsub;
  }, [selectedThreadId, user]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const otherName = selectedThread
    ? selectedThread.modelUid === user?.uid
      ? selectedThread.photographerName
      : selectedThread.modelName
    : "";

  const otherInitials = selectedThread
    ? selectedThread.modelUid === user?.uid
      ? selectedThread.photographerInitials
      : selectedThread.modelInitials
    : "";

  const handleSend = async () => {
    if (!messageText.trim() || !selectedThreadId || !user || !selectedThread) return;
    const text = messageText.trim();
    setMessageText("");
    setSending(true);
    try {
      const otherUid =
        selectedThread.modelUid === user.uid
          ? selectedThread.photographerUid
          : selectedThread.modelUid;
      await sendMessage(selectedThreadId, user.uid, text, otherUid);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Chat view ──────────────────────────────────────────────────────────────
  if (selectedThreadId) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#E8E4DC] flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setSelectedThreadId(null);
              setMessages([]);
            }}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
              {otherInitials}
            </div>
            <div>
              <p className="text-[#1A1A1A]">{otherName}</p>
              <p className="text-xs text-[#6B6860] truncate max-w-[200px]">
                {selectedThread?.shootTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-[#6B6860] pt-8">
              Start the conversation.
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.fromUid === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    isMe ? "bg-[#F2A900] text-[#1A1A1A]" : "bg-[#E8E4DC] text-[#1A1A1A]"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 pb-[24px] border-t border-[#E8E4DC] flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-full text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900] min-h-[44px]"
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="w-[44px] h-[44px] bg-[#F2A900] rounded-full flex items-center justify-center active:bg-[#D99500] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-5 h-5 text-[#1A1A1A]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Thread list ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <h1 className="text-[#1A1A1A]">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-[#1A1A1A] mb-2">No messages yet.</p>
            <p className="text-sm text-[#6B6860]">
              Tap "I'm interested" on a shoot to start a conversation.
            </p>
          </div>
        )}

        {threads.map((thread) => {
          const isUnread = thread.unreadFor?.includes(user?.uid ?? "");
          const otherN =
            thread.modelUid === user?.uid ? thread.photographerName : thread.modelName;
          const otherI =
            thread.modelUid === user?.uid ? thread.photographerInitials : thread.modelInitials;

          const ts = thread.lastMessageAt
            ? new Date(thread.lastMessageAt.toMillis()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "";

          return (
            <button
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className="w-full px-4 py-4 border-b border-[#E8E4DC] flex items-center gap-3 min-h-[80px] active:bg-[#FAF8F5] transition-colors relative"
            >
              {isUnread && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#F2A900] rounded-full" />
              )}
              <div className="w-12 h-12 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
                {otherI}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`truncate ${isUnread ? "text-[#1A1A1A] font-medium" : "text-[#1A1A1A]"}`}>
                  {otherN}
                </p>
                <p className="text-xs text-[#6B6860] truncate">{thread.shootTitle}</p>
                <p className="text-sm text-[#6B6860] truncate mt-1">{thread.lastMessage}</p>
              </div>
              <span className="text-xs text-[#6B6860] flex-shrink-0">{ts}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
