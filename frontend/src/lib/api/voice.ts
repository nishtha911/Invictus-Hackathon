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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Voice API ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchOpeningLine(lead: Record<string, unknown>) {
  return post<{ opening_line: string; context: CallContext }>("/api/v1/voice/opening", { lead });
}

export function fetchTurn(context: CallContext, history: TranscriptTurn[], user_speech: string) {
  return post<{ speech_reply: string; intent: string; requires_human: boolean }>(
    "/api/v1/voice/turn",
    { context, history, user_speech }
  );
}

export function completeCall(context: CallContext, transcript: TranscriptTurn[], duration: number) {
  return post<{ call: VoiceCallRecord; analysis: CallAnalysis }>("/api/v1/voice/complete", {
    context,
    transcript,
    duration,
  });
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
