"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Loader2,
  Brain,
  Plus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMood } from "@/app/context/MoodContext";
import { useEntry, useChat, useChats } from "@/hooks/use-api";
import {
  sendMessage as apiSendMessage,
  startContextualChat as apiStartContextualChat,
  deleteChat as apiDeleteChat,
} from "@/lib/api/mutations";

interface Message {
  id: string;
  role: "USER" | "AI" | "SYSTEM";
  content: string;
  createdAt: string;
}

interface RagContext {
  entriesUsed: number;
  entries: Array<{
    title: string;
    date: string;
    relevance: number;
  }>;
}

interface ChatPreview {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{ content: string; role: string }>;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contextEntryId = searchParams.get("contextEntryId");
  const chatIdParam = searchParams.get("chatId");
  const initialMessageParam = searchParams.get("initialMessage");

  const { currentMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState(initialMessageParam || "");
  const [chatId, setChatId] = useState<string | null>(chatIdParam);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [ragContext, setRagContext] = useState<RagContext | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch entry context if present
  const { data: entryData } = useEntry(contextEntryId);

  // Fetch existing chat if chatId provided (from URL param or selected)
  const { data: chatData } = useChat(chatId);

  // Fetch all chats for sidebar
  const { data: allChats, mutate: mutateChats } = useChats();

  const hasInitialized = useRef(false);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      if (hasInitialized.current) return;

      if (chatIdParam && chatData) {
        // Use existing chat from URL param
        hasInitialized.current = true;
        setMessages(chatData.messages);
        setChatId(chatIdParam);
        setIsInitializing(false);
      } else if (contextEntryId) {
        // Start new contextual chat
        hasInitialized.current = true;
        try {
          const data = await apiStartContextualChat(contextEntryId);
          if (data) {
            setChatId(data.id);
            setMessages(data.messages);
          }
        } catch (error) {
          console.error("Error starting contextual chat:", error);
          setMessages([
            {
              id: "welcome",
              role: "AI",
              content: `I see you were writing about "${entryData?.title || "something important"}". I'm here to listen and help you work through your thoughts. What's on your mind?`,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setIsInitializing(false);
      } else if (!contextEntryId && !chatIdParam) {
        // No context — check if there's a recent chat to restore, otherwise show welcome
        hasInitialized.current = true;

        // Try to restore last active chat from sessionStorage
        const lastChatId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("mindful-active-chat")
            : null;

        if (lastChatId) {
          setChatId(lastChatId);
          // chatData will populate messages via the useChat hook
        } else {
          setMessages([
            {
              id: "welcome",
              role: "AI",
              content:
                "Hello! I'm your AI wellness companion. I'm here to listen and support you. What would you like to talk about today?",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [contextEntryId, chatIdParam, chatData, entryData]);

  // Persist active chat ID to sessionStorage so it survives page navigation
  useEffect(() => {
    if (chatId && typeof window !== "undefined") {
      sessionStorage.setItem("mindful-active-chat", chatId);
    }
  }, [chatId]);

  // Load messages from chatData when chatId changes (e.g. sidebar selection or restore)
  useEffect(() => {
    if (chatData && chatData.id === chatId && chatData.messages) {
      setMessages(chatData.messages);
      setIsInitializing(false);
    }
  }, [chatData, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      const data = await apiSendMessage(chatId, inputMessage);

      if (data) {
        setChatId(data.id);
        setMessages(data.messages);
        if (data.ragContext) {
          setRagContext(data.ragContext);
        }
        // Refresh sidebar chat list
        mutateChats();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "AI",
          content: "I'm sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Switch to a past conversation
  const handleSelectChat = useCallback(
    (selectedChatId: string) => {
      if (selectedChatId === chatId) {
        setSidebarOpen(false);
        return;
      }
      hasInitialized.current = false;
      setChatId(selectedChatId);
      setMessages([]);
      setIsInitializing(true);
      setRagContext(null);
      setSidebarOpen(false);

      // Update URL without full page reload
      router.replace(`/dashboard/chat?chatId=${selectedChatId}`, {
        scroll: false,
      });

      // Re-allow initialization
      setTimeout(() => {
        hasInitialized.current = true;
      }, 100);
    },
    [chatId, router]
  );

  // Start a brand new chat
  const handleNewChat = useCallback(() => {
    hasInitialized.current = true;
    setChatId(null);
    setMessages([
      {
        id: "welcome",
        role: "AI",
        content:
          "Hello! I'm your AI wellness companion. I'm here to listen and support you. What would you like to talk about today?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setRagContext(null);
    setIsInitializing(false);
    setSidebarOpen(false);

    // Clear sessionStorage and URL
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("mindful-active-chat");
    }
    router.replace("/dashboard/chat", { scroll: false });
  }, [router]);

  // Delete a chat
  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, deleteChatId: string) => {
      e.stopPropagation();
      setDeletingChatId(deleteChatId);
      try {
        await apiDeleteChat(deleteChatId);
        mutateChats();
        // If we deleted the active chat, start a new one
        if (deleteChatId === chatId) {
          handleNewChat();
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      } finally {
        setDeletingChatId(null);
      }
    },
    [chatId, handleNewChat, mutateChats]
  );

  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIndex) => {
      const listMatch = line.match(/^(\d+\.\s+)(.*)$/);

      const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return (
              <strong
                key={partIndex}
                className="font-bold text-[15px] text-purple-200 bg-purple-500/10 px-1.5 py-0.5 rounded shadow-sm"
              >
                {boldText}
              </strong>
            );
          }
          return part;
        });
      };

      if (listMatch) {
        const [, number, rest] = listMatch;
        return (
          <div
            key={lineIndex}
            className="flex gap-2 my-2 pl-1 leading-relaxed"
          >
            <span className="font-semibold text-purple-400 min-w-[20px]">
              {number}
            </span>
            <span className="flex-1 text-sm">{parseInline(rest)}</span>
          </div>
        );
      }

      return (
        <div
          key={lineIndex}
          className={`text-sm leading-relaxed ${line.trim() === "" ? "h-3" : "my-1"}`}
        >
          {parseInline(line)}
        </div>
      );
    });
  };

  // Format relative time for sidebar
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chatList = (allChats as ChatPreview[]) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Sidebar Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-[#13091B] border-r border-white/10 z-40 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Chat History</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-xl text-white font-medium transition-all group"
              >
                <Plus className="w-5 h-5 text-purple-400 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm">New Conversation</span>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-1">
              {chatList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No past conversations</p>
                </div>
              ) : (
                chatList.map((chat) => {
                  const isActive = chat.id === chatId;
                  const lastMessage = chat.messages?.[0];
                  const preview = lastMessage
                    ? lastMessage.content.slice(0, 60) +
                      (lastMessage.content.length > 60 ? "..." : "")
                    : "No messages yet";

                  return (
                    <motion.button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-3 rounded-xl transition-all group relative ${
                        isActive
                          ? "bg-purple-500/20 border border-purple-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isActive ? "text-purple-300" : "text-white"}`}
                          >
                            {chat.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {preview}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-600">
                            {formatRelativeTime(chat.updatedAt)}
                          </span>
                          <button
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                          >
                            {deletingChatId === chat.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle / History Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all relative"
              title="Chat History"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  {chatList.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {chatList.length > 9 ? "9+" : chatList.length}
                    </span>
                  )}
                </>
              )}
            </button>

            <div>
              <h1
                className={`text-xl font-bold transition-colors duration-500 ${currentMood.accent}`}
              >
                AI Wellness Coach
              </h1>
              {contextEntryId && entryData && (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Discussing: {entryData.title}
                </p>
              )}
              {ragContext && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5"
                >
                  <Brain className="w-3 h-3" />
                  🧠 RAG Memory Active —{" "}
                  {ragContext.entriesUsed}{" "}
                  {ragContext.entriesUsed === 1 ? "entry" : "entries"} retrieved
                </motion.p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Chat Button in Header */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {isInitializing ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === "USER"
                        ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                        : "bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    {message.role === "AI" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-purple-400 font-medium">
                          AI Coach
                        </span>
                        {ragContext && ragContext.entriesUsed > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                            🧠 RAG
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      {renderFormattedContent(message.content)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          {isSending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 border border-white/10 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share what's on your mind..."
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
