import { useEffect, useState } from 'react'
import { searchTitles } from '../lib/tmdb'
import type { Summary } from '../lib/types'

const DEBOUNCE_MS = 300
const MAX_RESULTS = 8

export default function SearchBar({ onAdd }: { onAdd: (s: Summary) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Summary[]>([])

  useEffect(() => {
    const term = q.trim()
    if (!term) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchTitles(term)
        .then((r) => {
          if (!cancelled) setResults(r.slice(0, MAX_RESULTS))
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q])

  const shown = q.trim() ? results : []

  const pick = (s: Summary) => {
    onAdd(s)
    setQ('')
    setResults([])
  }

  return (
    <div className="search">
      <input
        type="search"
        className="search-input"
        placeholder="Buscar filme ou série"
        aria-label="Buscar filme ou série"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {shown.length > 0 && (
        <ul className="search-results">
          {shown.map((s) => (
            <li key={`${s.mediaType}-${s.id}`}>
              <button type="button" className="search-item" onClick={() => pick(s)}>
                {s.posterUrl ? (
                  <img src={s.posterUrl} alt="" className="search-thumb" />
                ) : (
                  <span className="search-thumb" />
                )}
                <span className="search-title">{s.title}</span>
                <span className="search-year">{s.year}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
