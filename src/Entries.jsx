import { useEffect, useRef, useState } from 'react'

const INK_COLORS = [
  { name: 'Ink', value: '#241B2F' },
  { name: 'Plum', value: '#5B3DF5' },
  { name: 'Coral', value: '#FF7D54' },
  { name: 'Teal', value: '#2FB8A6' },
  { name: 'Ocean', value: '#2F6FED' },
  { name: 'Mustard', value: '#E0A526' },
]

const CARD_ACCENTS = ['#5B3DF5', '#FF7D54', '#2FB8A6', '#2F6FED', '#E0A526']

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

export default function Entries() {
  const [entries, setEntries] = useState(loadEntries)
  const [view, setView] = useState('list') // 'list' | 'edit'
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [showColors, setShowColors] = useState(false)
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

  function openNew() {
    setActiveId(null)
    setTitle('')
    setShowColors(false)
    setView('edit')
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = ''
      editorRef.current?.focus()
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
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
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
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M7 19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7H7v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z" />
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
              <svg viewBox="0 0 24 24" width="19" height="19">
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
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2ZM8.5 12l2.5 3 3.5-4.5L19 17H5l3.5-5Z" />
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
      <div className="list-header">
        <p className="eyebrow">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1>Your journal</h1>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">A blank page.</p>
          <p className="empty-sub">Tap the pencil to write your first entry.</p>
        </div>
      ) : (
        <div className="entry-list">
          {entries.map((entry, i) => (
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

      <button className="fab" onClick={openNew} aria-label="New entry">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="m4 20 .8-4.2L15.6 5a1.4 1.4 0 0 1 2 0l1.4 1.4a1.4 1.4 0 0 1 0 2L8.2 19.2 4 20Z" />
        </svg>
      </button>
    </div>
  )
}
