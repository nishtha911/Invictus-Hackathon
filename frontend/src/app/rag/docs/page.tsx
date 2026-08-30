"use client";

import { useEffect, useState, useCallback } from 'react'
import { FileText, Trash2, RefreshCw } from 'lucide-react'

interface DocumentItem {
  id: number;
  name: string;
  loan_category: string;
  chunk_count: number;
  uploaded_at: string;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    try {
      const res = await fetch(`${apiBase}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocs(Array.isArray(data) ? data : [])
      }
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = async (id: number) => {
    if (!confirm('Remove this document from the knowledge base?')) return
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    await fetch(`${apiBase}/documents/${id}`, { method: 'DELETE' })
    load()
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0);
    return () => clearTimeout(timer);
  }, [load])

  if (loading) return <div className="max-w-4xl mx-auto p-6"><p className="text-sm text-gray-400">Loading…</p></div>
  if (!docs.length) return <div className="max-w-4xl mx-auto p-6"><p className="text-sm text-gray-400">No documents in the knowledge base yet.</p></div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Knowledge Base Documents</h1>
      <div className="space-y-3">
        <div className="flex justify-end">
          <button onClick={load} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3 shadow-sm">
            <FileText size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
              <p className="text-xs text-gray-400">{d.loan_category} · {d.chunk_count} chunks · {new Date(d.uploaded_at).toLocaleString()}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
