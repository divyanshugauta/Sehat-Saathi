import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon, Mic, Send, ShieldAlert, Sparkles } from 'lucide-react';
import type { ChatMessage, UserProfile } from '../types/health';
import { detectEmergencySymptoms } from '../utils/healthEngine';

interface AiAssistantViewProps {
  profile: UserProfile;
  messages: ChatMessage[];
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
  onSendMessage: (message: string) => Promise<void>;
}

const STARTER_PROMPTS = [
  'Why was my energy low this week?',
  'Is my blood pressure improving over the last 30 days?',
  'What connects my brain fog, sleep, and hydration?',
  'Summarize my week across all four health modules.',
];

export function AiAssistantView({
  profile,
  messages,
  initialPrompt,
  onConsumeInitialPrompt,
  onSendMessage,
}: AiAssistantViewProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [emergencyBanner, setEmergencyBanner] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const submitText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const check = detectEmergencySymptoms(trimmed);
    if (check.isEmergency) {
      setEmergencyBanner(check.guidance);
    }

    setSending(true);
    setInput('');
    try {
      await onSendMessage(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitText(input);
  };

  const handleVoice = () => {
    interface SpeechRecognitionInstance {
      lang: string;
      onresult: ((evt: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    setListening(true);
    rec.onresult = (evt) => {
      setInput(evt.results[0]?.[0]?.transcript || '');
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const liveEmergencyCheck = detectEmergencySymptoms(input);
  const activeEmergency = emergencyBanner || (liveEmergencyCheck.isEmergency ? liveEmergencyCheck.guidance : null);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Safety Disclaimer Header */}
      <div className="flex items-start gap-3 rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-5 text-xs text-[#6B6156] dark:border-[#262B36] dark:bg-[#171A21] dark:text-slate-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#6D5CAE] dark:text-violet-300" />
        <div>
          <span className="font-display-serif text-sm font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
            Sehat Saathi Care Guide · Non-Diagnostic Assistant
          </span>
          <p className="mt-1 leading-relaxed">
            Reads {profile.name}&apos;s last 30 days of connected daily summaries across Hydration, Cardiovascular, Dental, Brain Fog, Sleep, and Nutrition. Does not diagnose conditions; consult a licensed doctor for clinical decisions.
          </p>
        </div>
      </div>

      {/* Emergency Detection Guidance */}
      {activeEmergency && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-3xl border border-rose-400 bg-rose-50 p-4 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100"
        >
          <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Urgent Symptom Safety Guidance</p>
            <p className="text-xs leading-relaxed">{activeEmergency}</p>
          </div>
        </div>
      )}

      {/* Conversation Card */}
      <div className="flex flex-col rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] dark:border-[#262B36] dark:bg-[#171A21]">
        <div className="flex flex-wrap gap-2 border-b border-[#EFE7DA] p-4 dark:border-slate-800">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => submitText(p)}
              disabled={sending}
              className="min-h-[38px] rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-3 py-1.5 text-xs font-medium text-[#1E1A16] hover:bg-[#FCE7D8]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="h-[420px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#E05A2B] text-white'
                    : msg.isEmergency
                    ? 'border border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100'
                    : 'border border-[#E8DFD1] bg-[#FAF6EF] text-[#1E1A16] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#6D5CAE] dark:text-violet-300">
                    <Sparkles className="h-3 w-3" /> Sehat Saathi Care Guide
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] px-4 py-3 text-xs text-[#6B6156] dark:border-slate-800 dark:bg-slate-900">
                Reviewing 30-day health summaries...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-[#EFE7DA] p-4 dark:border-slate-800"
        >
          <input
            type="text"
            placeholder="Ask about your BP trends, sleep, brain fog, water, or nutrition..."
            aria-label="Ask Sehat Saathi Care Guide"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[44px] flex-1 rounded-xl border border-[#E8DFD1] bg-white px-3.5 py-2.5 text-sm text-[#1E1A16] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={handleVoice}
            aria-label="Voice input"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border p-2.5 ${
              listening
                ? 'border-rose-400 bg-rose-50 text-rose-700'
                : 'border-[#E8DFD1] text-[#6B6156] hover:bg-[#FAF6EF] dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#E05A2B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#C84A1E] disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
