/**
 * AI voice-call API — the "call" runs in the banker's browser.
 * STT = Web Speech API, TTS = ElevenLabs (optional) or speechSynthesis, LLM = backend Groq.
 * All endpoints are employee-only (X-Role header, same convention as KB upload/delete).
 */
import { useJourneyStore } from "../../store/journey-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const roleHeader = () => ({ "X-Role": useJourneyStore.getState().role || "" });

export interface CallContext {
  lead_id?: string;
  name: string;
  phone?: string;
  loan_type: string;
  loan_amount: number;
  emi?: number;
  status?: string;
  briefing?: string;
  pending?: string[];
}

export interface TranscriptTurn {
  role: "assistant" | "user";
  text: string;
}

export interface CallAnalysis {
  summary: string;
  intent: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  outcome: string;
  next_action: string;
  follow_up_required: boolean;
  requires_human: boolean;
}

export interface VoiceCallRecord {
  call_id: string;
  lead_id: string | null;
  customer_name: string;
  phone: string;
  loan_type: string;
  loan_amount: number;
  duration_seconds: number;
  transcript: TranscriptTurn[];
  summary: string;
  intent: string;
  sentiment: string;
  outcome: string;
  next_action: string;
  requires_human: boolean;
  follow_up_at: string | null;
  created_at: string;
}

async function post<T>(path: string, body: unknown, timeoutMs = 9000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeader() },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Voice API ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchOpeningLine(lead: Record<string, unknown>) {
  return post<{ opening_line: string; context: CallContext }>("/api/v1/voice/opening", { lead }, 6000);
}

export function fetchTurn(context: CallContext, history: TranscriptTurn[], user_speech: string) {
  return post<{ speech_reply: string; intent: string; requires_human: boolean }>(
    "/api/v1/voice/turn",
    { context, history, user_speech },
    6000
  );
}

export function completeCall(context: CallContext, transcript: TranscriptTurn[], duration: number) {
  return post<{ call: VoiceCallRecord; analysis: CallAnalysis }>(
    "/api/v1/voice/complete",
    { context, transcript, duration },
    12000
  );
}

/** Local heuristic opening / turn / analysis for when the backend is slow or down.
 *  Friendly "checking in on your interest" script — never mentions documents/links. */
export function localOpening(ctx: Pick<CallContext, "name" | "loan_type" | "loan_amount">): string {
  const amt = ctx.loan_amount ? `₹${Math.round(ctx.loan_amount).toLocaleString("en-IN")}` : "your loan";
  return `Hi ${ctx.name}, this is Alex from Cognis Bank. I'm calling about your interest in a ${ctx.loan_type} of ${amt} — is now a good time for a quick chat?`;
}

export function localTurn(
  userText: string,
  ctx: Pick<CallContext, "loan_type" | "loan_amount">,
  prevAssistant = "",
): { speech_reply: string; intent: string; requires_human: boolean } {
  const t = userText.toLowerCase();
  const amt = ctx.loan_amount ? `₹${Math.round(ctx.loan_amount).toLocaleString("en-IN")}` : "your loan";
  const loan = ctx.loan_type || "loan";
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

  const pick = (speech_reply: string, intent = "INTERESTED", requires_human = false) => {
    if (prevAssistant && norm(speech_reply) === norm(prevAssistant))
      return { speech_reply: `Understood. Would you like me to have a loan officer call you to take your ${loan} forward?`, intent: "INTERESTED", requires_human: false };
    return { speech_reply, intent, requires_human };
  };

  if (/(evening|morning|later|busy|tomorrow|call me back|not now)/.test(t))
    return pick("Of course — what time would suit you best?", "NEEDS_TIME");
  if (/(manager|human|officer|real person|speak to a person)/.test(t))
    return pick("Of course, I'll have a senior loan officer call you back shortly.", "CALLBACK_REQUESTED", true);
  if (/(not interested|cancel|no thanks|stop calling)/.test(t))
    return pick("No problem at all, thanks for your time. We won't follow up unless you reach out to us.", "NOT_INTERESTED");
  if (/(rate|interest|emi|how much|cost)/.test(t))
    return pick(`For a ${loan} of ${amt}, our rates currently start around 8.4% per annum, and your officer will confirm the exact figure for your profile.`);
  if (/(when|how long|timeline|disburse|get the money|funds)/.test(t))
    return pick("Once your application is in, funds are usually disbursed within a few working days.");
  if (/(yes|sure|go ahead|proceed|interested|sounds good|what next|next step)/.test(t))
    return pick(`That's great to hear. I'll flag your file as a priority and one of our loan officers will call you within a business day to walk you through the next steps.`, "READY_TO_APPLY");
  if (/(document|statement|link|upload|paperwork)/.test(t))
    return pick("No need to worry about any of that now — your dedicated loan officer will guide you through everything when they call.");
  return pick(`Thanks for taking the call. Are you looking to move ahead with the ${loan} soon, or still weighing your options?`);
}

export function localAnalysis(transcript: TranscriptTurn[]): CallAnalysis {
  const text = transcript.map((t) => t.text).join(" ").toLowerCase();
  let intent = "INTERESTED", sentiment: CallAnalysis["sentiment"] = "POSITIVE", human = false;
  let next = "Have a loan officer call the customer to take the application forward.";
  if (/not interested|cancel|no thanks/.test(text)) { intent = "NOT_INTERESTED"; sentiment = "NEGATIVE"; next = "Mark not interested; pause follow-ups."; }
  else if (/manager|human|officer/.test(text)) { intent = "CALLBACK_REQUESTED"; sentiment = "NEUTRAL"; human = true; next = "Assign a senior loan officer for a manual call-back."; }
  else if (/evening|later|busy|tomorrow/.test(text)) { intent = "NEEDS_TIME"; sentiment = "NEUTRAL"; next = "Re-attempt the call at the customer's preferred time."; }
  else if (/go ahead|proceed|yes|what next/.test(text)) { intent = "READY_TO_APPLY"; next = "Priority follow-up: officer to call within a business day to finalise."; }
  return {
    summary: "Call completed. " + (transcript.length > 2 ? "Customer engaged in the conversation." : "Short call."),
    intent, sentiment, outcome: human ? "ESCALATED_TO_HUMAN" : "FOLLOW_UP_REQUIRED",
    next_action: next, follow_up_required: intent !== "NOT_INTERESTED", requires_human: human,
  };
}

/** Returns an object URL for ElevenLabs audio, or null when the browser should use speechSynthesis. */
export async function fetchSpeechAudio(text: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeader() },
      body: JSON.stringify({ text }),
    });
    if (res.status === 200) {
      return URL.createObjectURL(await res.blob());
    }
  } catch {
    /* fall through to speechSynthesis */
  }
  return null;
}

export async function fetchVoiceCalls(): Promise<VoiceCallRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/voice/calls`, { headers: roleHeader() });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.calls || []) as VoiceCallRecord[];
  } catch {
    return [];
  }
}
