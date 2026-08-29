"use client";

import { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const CATEGORIES = ['Education Loan', 'Home Loan', 'Personal Loan', 'Vehicle Loan', 'Business Loan', 'Other']

export default function UploadPage() {
  const [files, setFiles] = useState<any[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const entries = Array.from(newFiles).map(f => {
      const name = f.name.toLowerCase();
      let detectedCategory = CATEGORIES[0];
      if (name.includes('education')) detectedCategory = 'Education Loan';
      else if (name.includes('home')) detectedCategory = 'Home Loan';
      else if (name.includes('personal')) detectedCategory = 'Personal Loan';
      else if (name.includes('vehicle') || name.includes('car') || name.includes('auto')) detectedCategory = 'Vehicle Loan';
      else if (name.includes('business') || name.includes('sme') || name.includes('corporate')) detectedCategory = 'Business Loan';
      
      return { file: f, category: detectedCategory, status: 'pending', result: null, error: null };
    });
    setFiles(prev => [...prev, ...entries])
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function setCategory(idx: number, cat: string) {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, category: cat } : f))
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function uploadAll() {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'uploading' } : f))
      try {
        const fd = new FormData()
        fd.append('file', files[i].file)
        fd.append('loan_category', files[i].category)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/upload`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Upload failed')
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'done', result: data } : f))
      } catch (err: any) {
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'error', error: err.message } : f))
      }
    }
  }

  const hasPending = files.some(f => f.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Upload Policy Documents</h1>
      
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <UploadCloud className="mx-auto mb-3 text-blue-400" size={40} />
        <p className="font-medium text-gray-700">Drag & drop policy documents here</p>
        <p className="text-sm text-gray-400 mt-1">PDF, TXT, MD — multiple files supported</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.txt,.md" className="hidden"
          onChange={e => addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3 shadow-sm">
              <FileText size={20} className="text-gray-400 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">{entry.file.name}</span>

              {entry.status === 'pending' && (
                <select
                  value={entry.category}
                  onChange={e => setCategory(i, e.target.value)}
                  className="text-sm border rounded px-2 py-1 text-gray-600"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              )}

              {entry.status === 'uploading' && <Loader2 size={18} className="animate-spin text-blue-500" />}

              {entry.status === 'done' && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle size={16} /> {entry.result?.chunks_stored} chunks
                </span>
              )}

              {entry.status === 'error' && (
                <span className="flex items-center gap-1 text-red-500 text-sm">
                  <XCircle size={16} /> {entry.error}
                </span>
              )}

              {entry.status === 'pending' && (
                <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 ml-1">✕</button>
              )}
            </div>
          ))}

          {hasPending && (
            <button
              onClick={uploadAll}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Process & Add to Knowledge Base
            </button>
          )}
        </div>
      )}
    </div>
  )
}
