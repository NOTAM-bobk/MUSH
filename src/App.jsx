import { useState } from 'react'
import Entries from './Entries.jsx'
import Affirmations from './Affirmations.jsx'
import Insights from './Insights.jsx'

const TABS = [
  {
    key: 'entries',
    label: 'Entries',
    render: (active) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M5 5.2c0-.9.73-1.6 1.63-1.5C8.7 3.9 10.9 4.4 12 5.4c1.1-1 3.3-1.5 5.37-1.7A1.6 1.6 0 0 1 19 5.2v12.6c0 .9-.76 1.55-1.63 1.46-2.06-.2-4.26.15-5.37 1.14-1.1-1-3.3-1.34-5.37-1.14C5.76 19.35 5 18.7 5 17.8V5.2Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinejoin="round"
        />
        <path d="M12 5.4v14.2" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      </svg>
    ),
  },
  {
    key: 'affirmations',
    label: 'Affirmations',
    render: () => (
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.5c.9 2.7 1.9 4.4 3.1 5.6 1.2 1.2 2.9 2.2 5.6 3.1-2.7.9-4.4 1.9-5.6 3.1-1.2 1.2-2.2 2.9-3.1 5.6-.9-2.7-1.9-4.4-3.1-5.6C7.7 13 6 12 3.3 11.2c2.7-.9 4.4-1.9 5.6-3.1 1.2-1.2 2.2-2.9 3.1-5.6Z"
        />
        <path
          fill="currentColor"
          d="M19 15.5c.4 1.1.8 1.8 1.3 2.3.5.5 1.2.9 2.3 1.3-1.1.4-1.8.8-2.3 1.3-.5.5-.9 1.2-1.3 2.3-.4-1.1-.8-1.8-1.3-2.3-.5-.5-1.2-.9-2.3-1.3 1.1-.4 1.8-.8 2.3-1.3.5-.5.9-1.2 1.3-2.3Z"
        />
      </svg>
    ),
  },
  {
    key: 'insights',
    label: 'Insights',
    render: () => (
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true">
        <path d="M5 19.5v-6.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 19.5V6.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 19.5v-9.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function App() {
  const [tab, setTab] = useState('entries')

  return (
    <div className="app-shell">
      <main className="app-content">
        {tab === 'entries' && <Entries />}
        {tab === 'affirmations' && <Affirmations />}
        {tab === 'insights' && <Insights />}
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
              <span className="nav-pill">{t.render(active)}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
