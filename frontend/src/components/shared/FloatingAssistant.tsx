"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, ArrowRight, ShieldCheck } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { extractProfile } from "@/lib/api/advisor";
import {
  ChatMessage,
  SuggestedAction,
  getInitialBotState,
  sendChatMessage,
} from "@/lib/api/chatbot";
import { motion, AnimatePresence } from "motion/react";

export function FloatingAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionId, profile, updateProfile, setExtractedData } = useJourneyStore();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(1);

  // Do NOT show chatbot on sales dashboard
  const isDashboard = pathname.startsWith("/dashboard");

  // Load dynamic initial state from chatbot service
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial = getInitialBotState();
    return [
      {
        id: "initial-msg-1",
        sender: "bot",
        text: initial.text,
        suggestedActions: initial.suggestedActions,
      },
    ];
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  if (isDashboard) {
    return null;
  }

  const handleActionClick = async (action: SuggestedAction) => {
    idCounter.current += 1;
    const userMsgId = `usr-${idCounter.current}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: action.label,
    };
    setMessages((prev) => [...prev, userMsg]);

    if (action.actionType === "navigate" && action.payload) {
      setIsOpen(false);
      router.push(action.payload);
      return;
    }

    if (action.actionType === "advisor" && action.payload) {
      updateProfile({ intent: action.payload });
      setIsOpen(false);
      router.push(`/advisor?intent=${action.payload}`);
      return;
    }

    if (action.actionType === "intent" && action.payload) {
      updateProfile({ intent: action.label });
      startTransition(async () => {
        try {
          const ext = await extractProfile({ ...profile, intent: action.label });
          if (ext && ext.data) setExtractedData(ext.data);
        } catch {
          // Graceful fallback
        }
      });
    }

    // Query service for dynamic followup
    setIsTyping(true);
    try {
      const res = await sendChatMessage(action.label, sessionId, { profile, selectedAction: action });
      idCounter.current += 1;
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: res.message_id || `bot-${idCounter.current}`,
        sender: "bot",
        text: res.reply,
        suggestedActions: res.suggested_actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      idCounter.current += 1;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${idCounter.current}`,
          sender: "bot",
          text: "I am ready to help you explore our structured loan options. Would you like to check pre-eligibility in our advisor?",
          suggestedActions: [
            { id: "act_adv", label: "Launch Personalised Advisor", actionType: "navigate", payload: "/advisor" },
          ],
        },
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue("");

    idCounter.current += 1;
    const userMsg: ChatMessage = {
      id: `usr-${idCounter.current}`,
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await sendChatMessage(userText, sessionId, { profile });
      idCounter.current += 1;
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: res.message_id || `bot-${idCounter.current}`,
        sender: "bot",
        text: res.reply,
        suggestedActions: res.suggested_actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      idCounter.current += 1;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${idCounter.current}`,
          sender: "bot",
          text: "Thank you. DhanSetu evaluates deterministic banking policies for all loan categories. Would you like to explore suitable options?",
          suggestedActions: [
            { id: "act_adv", label: "Explore Personalised Loans", actionType: "navigate", payload: "/#loan-information" },
          ],
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button with Gentle Idle Animation */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          aria-label="Open DhanSetu Assistant"
          animate={{ scale: [1, 1.04, 1], y: [0, -2.5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F7A63] text-white shadow-xl hover:bg-[#186350] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F7A63] focus:ring-offset-2"
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}

      {/* Chat Dialog Panel with Spring Transition */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[85vh] rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#081C2D] px-5 py-4 text-white flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1F7A63]" />
                  <h3 className="text-sm font-bold tracking-tight">DhanSetu Assistant</h3>
                </div>
                <p className="text-[11px] text-slate-300">How can we help with your loan journey?</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F5F7FA] text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed text-left ${
                      msg.sender === "user"
                        ? "bg-[#1F7A63] text-white rounded-br-none"
                        : "bg-white text-[#081C2D] border border-[#E2E8F0] shadow-2xs rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Quick Action Options (Dynamically rendered from service response) */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {msg.suggestedActions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleActionClick(opt)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#081C2D] hover:border-[#1F7A63] hover:bg-emerald-50/50 hover:text-[#1F7A63] transition-colors shadow-2xs cursor-pointer text-left"
                        >
                          <span>{opt.label}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pl-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse delay-100" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse delay-200" />
                  <span>DhanSetu Assistant is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-[#E2E8F0] bg-white p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about loans, rates, or eligibility..."
                className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#081C2D] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                aria-label="Send message"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F7A63] text-white hover:bg-[#186350] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Trust Caption */}
            <div className="bg-[#F5F7FA] px-3 py-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#1F7A63]" />
                Policy-Grounded Advisory
              </span>
              <span>DhanSetu v2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
