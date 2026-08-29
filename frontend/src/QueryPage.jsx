import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, BookOpen, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'

const CATEGORIES = ['All', 'Education Loan', 'Home Loan', 'Personal Loan', 'Vehicle Loan', 'Business Loan', 'Other']

// Helper functions for lightweight Markdown parsing
function renderHTMLTable(rows) {
  if (rows.length === 0) return '';
  
  let html = '<div class="overflow-x-auto my-3"><table class="min-w-full divide-y divide-gray-200 border border-gray-150 rounded-lg text-xs overflow-hidden shadow-sm">';
  
  // Header row
  const headers = rows[0];
  html += '<thead class="bg-gray-50"><tr>';
  for (let h of headers) {
    html += `<th class="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">${parseInlineMarkdown(h)}</th>`;
  }
  html += '</tr></thead>';
  
  // Body rows
  html += '<tbody class="bg-white divide-y divide-gray-100">';
  // Skip the divider row (index 1) if it contains only dashed separators
  const startIdx = (rows.length > 1 && rows[1].every(cell => cell.match(/^:?-+:?$/))) ? 2 : 1;
  
  for (let r = startIdx; r < rows.length; r++) {
    html += '<tr class="hover:bg-gray-50/50 transition-colors">';
    for (let cell of rows[r]) {
      html += `<td class="px-3 py-2 text-gray-600 border-b border-gray-100">${parseInlineMarkdown(cell)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function parseMarkdown(text) {
  if (!text) return '';
  
  const lines = text.split('\n');
  const rendered = [];
  let inList = false;
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line is a table row (starts and ends with |)
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    
    if (isTableRow) {
      if (inList) {
        rendered.push('</ul>');
        inList = false;
      }
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Parse cells between pipes, removing empty elements at starts/ends
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    }
    
    // If we were in a table and this line is not a table row
    if (inTable && !isTableRow) {
      rendered.push(renderHTMLTable(tableRows));
      inTable = false;
      tableRows = [];
    }

    // Blockquote (> text)
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      if (inList) {
        rendered.push('</ul>');
        inList = false;
      }
      const content = parseInlineMarkdown(quoteMatch[1]);
      rendered.push(`<blockquote class="border-l-4 border-gray-300 pl-4 py-1.5 my-2.5 italic text-gray-500 bg-gray-50/50 rounded-r-lg">${content}</blockquote>`);
      continue;
    }

    // Headers (### Header or ## Header)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      if (inList) {
        rendered.push('</ul>');
        inList = false;
      }
      const level = headerMatch[1].length;
      const content = parseInlineMarkdown(headerMatch[2]);
      rendered.push(`<h${level} class="font-bold text-gray-900 mt-4 mb-2 text-sm">${content}</h${level}>`);
      continue;
    }

    // Bullet lists (- item or * item)
    const listMatch = line.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        rendered.push('<ul class="list-disc pl-5 space-y-1.5 my-2.5">');
        inList = true;
      }
      const content = parseInlineMarkdown(listMatch[1]);
      rendered.push(`<li class="text-gray-800">${content}</li>`);
      continue;
    }

    // Blank line closes list
    if (inList && line.trim() === '') {
      rendered.push('</ul>');
      inList = false;
      rendered.push('<div class="h-2"></div>');
      continue;
    }

    // Non-list line closes list
    if (inList && !listMatch) {
      rendered.push('</ul>');
      inList = false;
    }

    // Standard paragraph or spacing
    if (line.trim() === '') {
      rendered.push('<div class="h-2"></div>');
    } else {
      const content = parseInlineMarkdown(line);
      rendered.push(`<p class="my-1.5 text-gray-800 leading-relaxed">${content}</p>`);
    }
  }

  // Close open constructs at end of text
  if (inTable) {
    rendered.push(renderHTMLTable(tableRows));
  }
  if (inList) {
    rendered.push('</ul>');
  }

  return rendered.join('\n');
}

function parseInlineMarkdown(text) {
  // Bold: **text**
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');
  // Italic: *text*
  parsed = parsed.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');
  // Inline code: `code`
  parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-gray-150 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-600">$1</code>');
  return parsed;
}

export default function QueryPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your Invictus Bank Loan Policy Assistant. Feel free to ask me any questions about our loan guidelines, interest rates, tenures, or eligibility rules.',
      sources: []
    }
  ])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  
  // Track which sources are expanded: messageId-sourceIndex
  const [expandedSources, setExpandedSources] = useState({})
  // Track messages with sources accordion open
  const [openSourceAccordions, setOpenSourceAccordions] = useState({})

  const chatEndRef = useRef(null)

  // Scroll to bottom of chat automatically when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function toggleSourceExpansion(msgId, idx) {
    const key = `${msgId}-${idx}`
    setExpandedSources(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  function toggleAccordion(msgId) {
    setOpenSourceAccordions(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }))
  }

  async function ask(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userQuestion = input.trim()
    const userMsgId = Date.now().toString()
    
    // Add user question to history
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userQuestion
      }
    ])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          loan_category: category === 'All' ? null : category,
          top_k: 8,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Query failed')

      const newBotMsgId = (Date.now() + 1).toString()
      setMessages(prev => [
        ...prev,
        {
          id: newBotMsgId,
          sender: 'bot',
          text: data.answer,
          sources: data.sources || [],
        }
      ])
      
      // Auto-open accordion for new bot answers so the user can easily see sources
      setOpenSourceAccordions(prev => ({
        ...prev,
        [newBotMsgId]: true
      }))
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Sorry, I encountered an error while processing your request: ${err.message}`,
          isError: true,
          sources: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
      {/* Category selector panel */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600 animate-pulse" size={18} />
          <span className="text-sm font-semibold text-gray-700">Filter Search Domain</span>
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
        {messages.map((m) => {
          const isUser = m.sender === 'user'
          const isBot = m.sender === 'bot'
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm
                  ${isUser 
                    ? 'bg-blue-600 text-white' 
                    : m.isError 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}
              >
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble Box */}
              <div className="space-y-3">
                <div
                  className={`px-5 py-3.5 rounded-2xl leading-relaxed shadow-sm transition-all
                    ${isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : m.isError
                        ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                        : 'bg-white border border-gray-100 rounded-tl-none'}`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium text-sm">{m.text}</p>
                  ) : (
                    <div 
                      className="markdown-body text-sm"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }}
                    />
                  )}
                </div>

                {/* Sources Collapsible Accordion (Bot only) */}
                {isBot && m.sources && m.sources.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm transition-all">
                    <button
                      onClick={() => toggleAccordion(m.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-b border-transparent active:bg-gray-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-gray-400" />
                        Referenced Sources ({m.sources.length} chunks)
                      </span>
                      {openSourceAccordions[m.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {openSourceAccordions[m.id] && (
                      <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto bg-gray-50/30">
                        {m.sources.map((s, idx) => {
                          const isExpanded = expandedSources[`${m.id}-${idx}`]
                          return (
                            <div key={idx} className="p-3 text-xs">
                              {/* Source summary card */}
                              <div 
                                onClick={() => toggleSourceExpansion(m.id, idx)}
                                className="flex items-center gap-2 flex-wrap cursor-pointer group"
                              >
                                <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{s.doc_name}</span>
                                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{s.loan_category}</span>
                                <span className="text-gray-400">§ {s.section}</span>
                                <span className="text-gray-400">p.{s.page_number}</span>
                                <span className="ml-auto text-gray-400 font-medium">sim: {s.similarity}</span>
                                {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                              </div>

                              {/* Expanded chunk content display */}
                              {isExpanded && s.content && (
                                <div className="mt-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-600 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                                  {s.content}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3.5 shadow-sm text-sm text-gray-400 flex items-center gap-2.5">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              Thinking & retrieving guidelines...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={ask} className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input
            id="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about loan rules, rates, eligibility limits..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 placeholder-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
