import { useState } from 'react'
import Entries from './Entries.jsx'
import Insights from './Insights.jsx'
import Affirmations from './Affirmations.jsx'

const TABS = [
  {
    key: 'entries',
    label: 'Entries',
    path: 'M6.5 3.5h8.4c.5 0 .98.2 1.33.55l2.72 2.72c.35.35.55.83.55 1.33V19.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Zm8 .9V8h3.6L14.5 4.4ZM8.5 12h7v1.4h-7V12Zm0 3.4h7v1.4h-7v-1.4Z',
  },
  {
    key: 'insights',
    label: 'Insights',
    path: 'M4.5 19.5v-8.2h3.4v8.2H4.5Zm5.8 0V4.5h3.4v15h-3.4Zm5.8 0v-6.1h3.4v6.1h-3.4Z',
  },
  {
    key: 'affirmations',
    label: 'Affirmations',
    path: 'M12 20.2s-6.9-4.25-9.2-8.3C1.4 9.4 2 6.3 4.7 4.9c2.1-1.1 4.4-.5 5.9 1.2L12 7.6l1.4-1.5c1.5-1.7 3.8-2.3 5.9-1.2 2.7 1.4 3.3 4.5 1.9 7-2.3 4.05-9.2 8.3-9.2 8.3Z',
  },
]

export default function App() {
  const [tab, setTab] = useState('entries')

  return (
    <div className="app-shell">
      <main className="app-content">
        {tab === 'entries' && <Entries />}
        {tab === 'insights' && <Insights />}
        {tab === 'affirmations' && <Affirmations />}
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="nav-pill">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path fill="currentColor" d={t.path} />
                </svg>
              </span>
              <span className="nav-label">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
