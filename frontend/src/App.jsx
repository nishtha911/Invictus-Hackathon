import { useState, useEffect } from 'react'
import UploadPage from './UploadPage'
import QueryPage from './QueryPage'
import DocsPage from './DocsPage'
import './index.css'

const TABS = ['Upload Documents', 'Knowledge Base', 'Query Policies']

export default function App() {
  const [tab, setTab] = useState(0)
  const [docsKey, setDocsKey] = useState(0)
  const [llmInfo, setLlmInfo] = useState(null)

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setLlmInfo).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Loan Policy Knowledge Base</h1>
            <p className="text-sm text-gray-500">Bank Admin · RAG Pipeline</p>
          </div>
          {llmInfo && (
            <div className="text-right">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${ llmInfo.provider === 'openrouter'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-orange-100 text-orange-700' }`}>
                {llmInfo.provider === 'openrouter' ? 'OpenRouter' : 'Groq'}
              </span>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{llmInfo.model}</p>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 flex gap-0">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === i
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {tab === 0 && <UploadPage onUploaded={() => setDocsKey(k => k + 1)} />}
        {tab === 1 && <DocsPage key={docsKey} />}
        {tab === 2 && <QueryPage />}
      </main>
    </div>
  )
}
