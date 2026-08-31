import React from 'react';
import { CallStatusBadge, SentimentBadge } from '../common/StatusBadge';
import { X, FileText, User, Bot, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TranscriptModal({ call, onClose }) {
  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Call Summary & Transcript</h2>
            <p className="text-xs text-slate-300">
              Provider Call ID: <span className="font-mono text-blue-300">{call.providerCallId || call._id}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Customer:</span>
              <span className="font-bold text-slate-900">{call.customerId?.name || 'Customer'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Phone:</span>
              <span className="font-medium text-slate-800">{call.phoneNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status:</span>
              <CallStatusBadge status={call.status} />
            </div>
            <div>
              <span className="text-slate-500 block">Customer Intent:</span>
              <span className="font-semibold text-blue-700">{call.customerIntent || 'UNKNOWN'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Sentiment:</span>
              <SentimentBadge sentiment={call.sentiment} />
            </div>
            <div>
              <span className="text-slate-500 block">Duration:</span>
              <span className="font-medium text-slate-800">{call.duration || 0} seconds</span>
            </div>
          </div>

          {/* AI Extracted Summary */}
          {call.summary && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-xs font-bold uppercase text-blue-900 tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" /> AI Generated Summary
              </h3>
              <p className="text-sm text-blue-950">{call.summary}</p>
              {call.nextAction && (
                <p className="text-xs font-semibold text-blue-800 mt-2">
                  Next Action: <span className="font-normal">{call.nextAction}</span>
                </p>
              )}
            </div>
          )}

          {call.requiresHuman && (
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Human Officer Escalation Required for this customer.</span>
            </div>
          )}

          {/* Transcript Dialogue */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" /> Conversation Transcript
            </h3>

            {(!call.transcript || call.transcript.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-2">No transcript turns recorded for this call.</p>
            ) : (
              <div className="space-y-2.5">
                {call.transcript.map((t, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 text-xs p-3 rounded-xl ${
                      t.role === 'assistant'
                        ? 'bg-blue-50/70 border border-blue-100 text-blue-950 ml-4'
                        : 'bg-slate-100 text-slate-900 mr-4'
                    }`}
                  >
                    {t.role === 'assistant' ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div>
                      <span className="font-bold capitalize block text-slate-700">{t.role === 'assistant' ? 'AI Voice Assistant' : 'Customer'}</span>
                      <p className="mt-0.5 text-sm">{t.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
