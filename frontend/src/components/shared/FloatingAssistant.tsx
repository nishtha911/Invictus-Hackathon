"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, ArrowRight, ShieldCheck } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { extractProfile } from "@/lib/api/advisor";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: () => void }[];
}

export function FloatingAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionId, profile, userType, selectedCustomer, selectedLoan, updateProfile, setExtractedData } = useJourneyStore();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Do NOT show chatbot on sales dashboard
  const isDashboard = pathname.startsWith("/dashboard");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! Welcome to Cognis Bank. I can assist you in exploring verified home, car, business, gold, personal, or education loan options tailored to your profile.",
      options: [
        {
          label: "Home Loan",
          action: () => handleSelectCategory("Home Loan", "home_loan"),
        },
        {
          label: "Car Loan",
          action: () => handleSelectCategory("Vehicle Loan", "vehicle_loan"),
        },
        {
          label: "Business Loan",
          action: () => handleSelectCategory("Business Loan", "business_loan"),
        },
        {
          label: "Gold Loan",
          action: () => handleSelectCategory("Gold Loan", "gold_loan"),
        },
        {
          label: "How does Cognis Bank work?",
          action: () => handleHowItWorks(),
        },
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (isDashboard) {
    return null;
  }

  const handleHowItWorks = () => {
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: "How does Cognis Bank work?",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "Cognis Bank follows a simple 4-step process: 1) Choose your loan goal, 2) Complete a dynamic 2-minute profile intake, 3) Receive verified EMI calculations & matched products, and 4) Connect directly with a retail lending officer.",
        options: [
          {
            label: "Explore Process on Page",
            action: () => {
              setIsOpen(false);
              router.push("/#how-it-works");
            },
          },
          {
            label: "Start Advisory Now",
            action: () => {
              setIsOpen(false);
              router.push("/advisor");
            },
          },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const handleSelectCategory = async (category: string, intentKey: string) => {
    updateProfile({ intent: category });

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: `I am interested in a ${category}.`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await extractProfile({
        ...profile,
        intent: category,
      });
      setExtractedData(res.data);
    } catch {
      // Graceful fallback
    }

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: `Great choice. We offer competitive rates and policy-grounded terms for ${category}. Would you like to explore structured pre-eligibility in our interactive advisor?`,
        options: [
          {
            label: `Launch ${category} Advisor`,
            action: () => {
              setIsOpen(false);
              router.push(`/advisor?intent=${intentKey}`);
            },
          },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue("");

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const fullContext = {
        user_type: userType || profile.user_type,
        profile,
        selected_loan: selectedLoan || null,
        customer_context: selectedCustomer || null,
      };
      const res = await fetch(`${apiBase}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          top_k: 4,
          session_id: sessionId || null,
          profile: fullContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      const options: { label: string; action: () => void }[] = [
        {
          label: "Launch Advisor",
          action: () => {
            setIsOpen(false);
            router.push("/advisor");
          },
        },
        {
          label: "View All Loan Types",
          action: () => {
            setIsOpen(false);
            router.push("/#loans");
          },
        },
      ];

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: data.answer || "I couldn't generate an answer for that.",
        options,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "I am having trouble connecting to my knowledge base right now. Please try again later.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
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
            <div className="flex items-center justify-between border-b border-[#0f3448] bg-gradient-to-r from-[#031c18] via-[#052136] to-[#041a2e] px-4 py-3 text-white rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/20 p-1">
                  <img src="/images/logo.png" alt="Cognis Bank" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Cognis Bank Assistant</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">Online · Live Lending Guidance</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-[360px] overflow-y-auto p-4 space-y-3 bg-[#F5F7FA]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#1F7A63] text-white rounded-tr-none shadow-xs"
                        : "bg-white text-[#081C2D] border border-[#E2E8F0] rounded-tl-none shadow-2xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Quick Action Options */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={opt.action}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#081C2D] hover:border-[#1F7A63] hover:bg-emerald-50/50 hover:text-[#1F7A63] transition-colors shadow-2xs cursor-pointer"
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
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] animate-pulse delay-100" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] animate-pulse delay-200" />
                  <span>Cognis Bank Assistant is typing...</span>
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
            <div className="bg-slate-50 px-3 py-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-slate-400">
              <span>Cognis Bank AI Policy Assistant</span>
              <span>256-Bit Encrypted</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
