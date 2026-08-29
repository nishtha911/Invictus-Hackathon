import { useEffect, useState } from 'react'
import { FileText, Trash2, RefreshCw } from 'lucide-react'

export default function DocsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents')
      setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function remove(id) {
    if (!confirm('Remove this document from the knowledge base?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  if (!docs.length) return <p className="text-sm text-gray-400">No documents in the knowledge base yet.</p>

  return (
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
  )
}
