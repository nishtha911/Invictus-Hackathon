"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, ArrowRight, ShieldCheck } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { extractProfile } from "@/lib/api/advisor";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: () => void }[];
}

export function FloatingAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, updateProfile, setExtractedData } = useJourneyStore();

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
      text: "Hello! Welcome to DhanSetu. I can assist you in finding suitable home, car, or business loan options tailored to your eligibility.",
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
          label: "Check Loan Options",
          action: () => handleNavigateAdvisor(),
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
        text: `Great choice. We offer competitive rates for ${category}. Would you like to explore structured pre-eligibility in our interactive advisor?`,
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

  const handleNavigateAdvisor = () => {
    setIsOpen(false);
    router.push("/advisor");
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

    // Contextual response based on user input
    setTimeout(() => {
      setIsTyping(false);
      const lower = userText.toLowerCase();
      let replyText =
        "Thank you for sharing. DhanSetu evaluates verified banking policies and exact debt-service ratios for transparent lending decisions.";
      const options: { label: string; action: () => void }[] = [
        {
          label: "Launch Advisor",
          action: () => {
            setIsOpen(false);
            router.push("/advisor");
          },
        },
        {
          label: "View Loan Types",
          action: () => {
            setIsOpen(false);
            router.push("/#solutions");
          },
        },
      ];

      if (lower.includes("home") || lower.includes("house") || lower.includes("flat")) {
        replyText =
          "We offer Prime Home Loans with tenures up to 30 years and competitive benchmark interest rates. Let's calculate your exact EMI in the advisor.";
      } else if (lower.includes("car") || lower.includes("vehicle") || lower.includes("auto")) {
        replyText =
          "Our Vehicle Loans cover new cars, pre-owned cars, and EV financing with flexible repayment tenures up to 7 years.";
      } else if (lower.includes("business") || lower.includes("msme") || lower.includes("firm")) {
        replyText =
          "We provide collateral-free working capital and MSME term loans designed for rapid growth and minimal documentation.";
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: replyText,
        options,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open DhanSetu Assistant"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F7A63] text-white shadow-lg hover:bg-[#186350] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F7A63] focus:ring-offset-2"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Dialog Panel */}
      {isOpen && (
        <div className="flex flex-col w-[calc(100vw-2rem)] sm:w-[370px] h-[500px] max-h-[85vh] rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-[#081C2D] px-5 py-4 text-white flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1F7A63]" />
                <h3 className="text-sm font-bold tracking-tight">DhanSetu Assistant</h3>
              </div>
              <p className="text-[11px] text-slate-300">How can we help with your loan journey?</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
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
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#1F7A63] text-white rounded-br-none"
                      : "bg-white text-[#081C2D] border border-[#E2E8F0] shadow-2xs rounded-bl-none"
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
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#081C2D] hover:border-[#1F7A63] hover:bg-emerald-50/50 hover:text-[#1F7A63] transition-colors shadow-2xs"
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
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F7A63] text-white hover:bg-[#186350] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Trust Caption */}
          <div className="bg-[#F5F7FA] px-3 py-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#1F7A63]" />
              Bank Policy-Grounded Advisory
            </span>
            <span>DhanSetu v2.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
