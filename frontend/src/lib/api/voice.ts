/**
 * AI voice-call API — the "call" runs in the banker's browser.
 * STT = Web Speech API, TTS = ElevenLabs (optional) or speechSynthesis, LLM = backend Groq.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
      headers: { "Content-Type": "application/json" },
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

/** Local heuristic opening / turn / analysis for when the backend is slow or down. */
export function localOpening(ctx: Pick<CallContext, "name" | "loan_type" | "loan_amount">): string {
  const amt = ctx.loan_amount ? `₹${Math.round(ctx.loan_amount).toLocaleString("en-IN")}` : "your loan";
  return `Hi ${ctx.name}, this is Alex from Cognis Bank, following up on the ${ctx.loan_type} of ${amt} you looked at on our website. Do you have a minute to talk through the next steps?`;
}

export function localTurn(userText: string): { speech_reply: string; intent: string; requires_human: boolean } {
  const t = userText.toLowerCase();
  if (/(evening|morning|later|busy|tomorrow|call me)/.test(t))
    return { speech_reply: "Of course — what time works best for you?", intent: "NEEDS_TIME", requires_human: false };
  if (/(manager|human|officer|person)/.test(t))
    return { speech_reply: "Understood. I'll have a senior loan officer call you back shortly.", intent: "CALLBACK_REQUESTED", requires_human: true };
  if (/(where|how|upload|link|portal|send)/.test(t))
    return { speech_reply: "You can upload it via the secure link on your phone, or on our website under Document Uploads. Shall I resend it?", intent: "INTERESTED", requires_human: false };
  if (/(not interested|cancel|no thanks)/.test(t))
    return { speech_reply: "No problem, thank you for your time. I'll close this follow-up for now.", intent: "NOT_INTERESTED", requires_human: false };
  return { speech_reply: "Got it. To move things forward we just need your latest bank statement — would you like me to send the upload link now?", intent: "INTERESTED", requires_human: false };
}

export function localAnalysis(transcript: TranscriptTurn[]): CallAnalysis {
  const text = transcript.map((t) => t.text).join(" ").toLowerCase();
  let intent = "INTERESTED", sentiment: CallAnalysis["sentiment"] = "POSITIVE", human = false;
  let next = "Send the document upload link and check back in 2 days.";
  if (/not interested|cancel/.test(text)) { intent = "NOT_INTERESTED"; sentiment = "NEGATIVE"; next = "Pause automated follow-ups; mark not interested."; }
  else if (/manager|human|officer/.test(text)) { intent = "CALLBACK_REQUESTED"; sentiment = "NEUTRAL"; human = true; next = "Assign a loan officer for a manual call-back."; }
  else if (/evening|later|busy|tomorrow/.test(text)) { intent = "NEEDS_TIME"; sentiment = "NEUTRAL"; next = "Re-attempt the call at the customer's preferred time."; }
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
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${BASE_URL}/api/v1/voice/calls`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.calls || []) as VoiceCallRecord[];
  } catch {
    return [];
  }
}
