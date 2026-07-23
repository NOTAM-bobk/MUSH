import { useEffect, useMemo, useRef, useState } from 'react'

const INK_COLORS = [
  { name: 'Ink', value: '#241B2F' },
  { name: 'Amber', value: '#B8862E' },
  { name: 'Coral', value: '#E1663F' },
  { name: 'Moss', value: '#5C7A4A' },
  { name: 'Ocean', value: '#2F6FED' },
  { name: 'Plum', value: '#7C4DFF' },
]

const CARD_ACCENTS = ['#F0B23E', '#E1663F', '#5C7A4A', '#2F6FED', '#7C4DFF']

const PROMPTS = [
  "What are three things you're grateful for today?",
  'Describe a moment that made you smile recently.',
  "What's been weighing on your mind lately?",
  'What would make today feel like a win?',
]

function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function loadEntries() {
  try {
    const saved = localStorage.getItem('journal_entries')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function computeStreak(entries) {
  if (!entries.length) return 0
  const days = new Set(entries.map((e) => new Date(e.created).toDateString()))
  const cursor = new Date()
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toDateString())) return 0
  }
  let streak = 0
  while (days.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function SparkleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2.5c.9 2.7 1.9 4.4 3.1 5.6 1.2 1.2 2.9 2.2 5.6 3.1-2.7.9-4.4 1.9-5.6 3.1-1.2 1.2-2.2 2.9-3.1 5.6-.9-2.7-1.9-4.4-3.1-5.6C7.7 13 6 12 3.3 11.2c2.7-.9 4.4-1.9 5.6-3.1 1.2-1.2 2.2-2.9 3.1-5.6Z"
      />
    </svg>
  )
}

export default function Entries() {
  const [entries, setEntries] = useState(loadEntries)
  const [view, setView] = useState('list') // 'list' | 'edit'
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [showColors, setShowColors] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false })
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('journal_entries', JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    function syncFormats() {
      if (document.activeElement !== editorRef.current) return
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      })
    }
    document.addEventListener('selectionchange', syncFormats)
    return () => document.removeEventListener('selectionchange', syncFormats)
  }, [])

  const streak = useMemo(() => computeStreak(entries), [entries])

  const filteredEntries = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => (e.title + ' ' + stripHtml(e.content)).toLowerCase().includes(q))
  }, [entries, query])

  function placeCursorAtEnd() {
    if (!editorRef.current) return
    const range = document.createRange()
    range.selectNodeContents(editorRef.current)
    range.collapse(false)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function openNew(promptText) {
    setActiveId(null)
    setTitle('')
    setShowColors(false)
    setView('edit')
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = promptText ? `<p>${promptText}</p><p><br></p>` : ''
        editorRef.current.focus()
        placeCursorAtEnd()
      }
    })
  }

  function openEntry(entry) {
    setActiveId(entry.id)
    setTitle(entry.title)
    setShowColors(false)
    setView('edit')
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = entry.content
    })
  }

  function saveEntry() {
    const content = editorRef.current ? editorRef.current.innerHTML : ''
    const plain = stripHtml(content)
    if (!title.trim() && !plain) {
      setView('list')
      return
    }
    if (activeId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === activeId
            ? { ...e, title: title.trim() || 'Untitled', content, updated: new Date().toISOString() }
            : e
        )
      )
    } else {
      const now = new Date().toISOString()
      setEntries((prev) => [
        { id: now + Math.random().toString(16).slice(2), title: title.trim() || 'Untitled', content, created: now, updated: now },
        ...prev,
      ])
    }
    setView('list')
  }

  function deleteEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setView('list')
  }

  function exec(command, value = null) {
    editorRef.current.focus()
    document.execCommand(command, false, value)
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = document.createElement('img')
      img.src = reader.result
      img.className = 'entry-image'
      img.alt = ''
      if (editorRef.current) {
        editorRef.current.insertBefore(img, editorRef.current.firstChild)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (view === 'edit') {
    return (
      <div className="screen editor-screen">
        <div className="editor-header">
          <button className="icon-btn" onClick={saveEntry} aria-label="Save and go back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path d="M19 12H6M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            className="title-input"
            placeholder="Give it a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {activeId && (
            <button className="icon-btn" onClick={() => deleteEntry(activeId)} aria-label="Delete entry">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 .8 12.1A2 2 0 0 0 7.8 21h8.4a2 2 0 0 0 2-1.9L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div
          className="editor-body"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write what's on your mind..."
        />

        <div className="toolbar">
          <button
            className={`tool-btn${activeFormats.bold ? ' on' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('bold')}
            aria-label="Bold"
            aria-pressed={activeFormats.bold}
          >
            <span className="tool-glyph" style={{ fontWeight: 800 }}>B</span>
          </button>
          <button
            className={`tool-btn${activeFormats.italic ? ' on' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('italic')}
            aria-label="Italic"
            aria-pressed={activeFormats.italic}
          >
            <span className="tool-glyph" style={{ fontStyle: 'italic' }}>I</span>
          </button>
          <button
            className={`tool-btn${activeFormats.underline ? ' on' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('underline')}
            aria-label="Underline"
            aria-pressed={activeFormats.underline}
          >
            <span className="tool-glyph" style={{ textDecoration: 'underline' }}>U</span>
          </button>

          <div className="tool-color-wrap">
            <button
              className={`tool-btn${showColors ? ' on' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowColors((s) => !s)}
              aria-label="Text color"
              aria-expanded={showColors}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="m9 2 1.06 3.24L13.3 6.3 10.06 7.36 9 10.6 7.94 7.36 4.7 6.3l3.24-1.06L9 2Zm9.5 6.5L20 11l-1.5 2.5L16 12l1.5-2.5-1.5-2.5 1.5-1L18.5 8.5ZM6.8 12 9 15.5l-6 6-1-1 4-4-1.5-.5.3-2 2-.3.5-1.7Z" />
              </svg>
            </button>
            {showColors && (
              <div className="color-pop">
                {INK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className="swatch"
                    style={{ background: c.value }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('foreColor', c.value)
                      setShowColors(false)
                    }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            className="tool-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current.click()}
            aria-label="Add image"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="9" cy="10" r="1.6" fill="currentColor" />
              <path d="m5 17 4.5-4.8L13 15.5l2-2.3L19 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImage}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button
          className={`icon-pill${showSearch ? ' on' : ''}`}
          onClick={() => {
            setShowSearch((s) => !s)
            setQuery('')
          }}
          aria-label="Search entries"
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
            <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="top-bar-spacer" />

        <div className="streak-pill" title="Day streak">
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path
              fill="currentColor"
              d="M12.5 2c.6 2.2.2 3.7-.9 4.9-.9.9-1.6 1.9-1.6 3.2 0 .9.3 1.6.8 2.1-1.7-.3-2.8-1.7-2.8-3.5 0-1 .4-1.9 1-2.6C6.3 7.3 5.3 9.6 5.3 12c0 4 2.9 7.2 6.2 7.2s6.2-3.2 6.2-7.2c0-3.7-2.1-7.3-5.2-10Z"
            />
          </svg>
          <span>{streak}</span>
        </div>

        <button className="icon-pill" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
            <path d="M4 7h11M18 7h2M6 12h2M11 12h7M4 17h13M20 17h0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="14.5" cy="7" r="2.1" fill="var(--bg)" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.5" cy="12" r="2.1" fill="var(--bg)" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="16.5" cy="17" r="2.1" fill="var(--bg)" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {showSearch && (
        <input
          className="search-input"
          placeholder="Search your entries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      )}

      {entries.length === 0 ? (
        <>
          <div className="hero">
            <div className="hero-circle">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none">
                <path
                  d="M5 5.2c0-.9.73-1.6 1.63-1.5C8.7 3.9 10.9 4.4 12 5.4c1.1-1 3.3-1.5 5.37-1.7A1.6 1.6 0 0 1 19 5.2v12.6c0 .9-.76 1.55-1.63 1.46-2.06-.2-4.26.15-5.37 1.14-1.1-1-3.3-1.34-5.37-1.14C5.76 19.35 5 18.7 5 17.8V5.2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M12 5.4v14.2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <h1 className="hero-title">Your journal is empty</h1>
            <p className="hero-sub">Start your mindful journey by capturing your first thought today.</p>
          </div>

          <p className="eyebrow prompts-eyebrow">Writing prompts to start</p>
          <div className="prompt-list">
            {PROMPTS.map((p) => (
              <button key={p} className="prompt-card" onClick={() => openNew(p)}>
                <span className="prompt-icon">
                  <SparkleIcon />
                </span>
                <span>{p}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="eyebrow" style={{ marginTop: 4 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="list-title">Your journal</h1>

          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No matches.</p>
              <p className="empty-sub">Try a different search.</p>
            </div>
          ) : (
            <div className="entry-list">
              {filteredEntries.map((entry, i) => (
                <button
                  key={entry.id}
                  className="entry-card"
                  style={{ '--accent': CARD_ACCENTS[i % CARD_ACCENTS.length] }}
                  onClick={() => openEntry(entry)}
                >
                  <div className="entry-card-title">{entry.title}</div>
                  <div className="entry-card-preview">
                    {stripHtml(entry.content).slice(0, 100) || 'No text yet'}
                  </div>
                  <div className="entry-card-date">{formatDate(entry.updated)}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <button className="fab" onClick={() => openNew()} aria-label="New entry">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path
            d="M4 20.5 4.8 16.6 15.7 5.7a1.7 1.7 0 0 1 2.4 0l1.2 1.2a1.7 1.7 0 0 1 0 2.4L8.4 20.2 4 20.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
