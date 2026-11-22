import { useRef } from 'react'
import type { Row as RowData } from '../lib/rows'
import PosterCard from './PosterCard'

export default function Row({
  row,
  onSelect,
}: {
  row: RowData
  onSelect: (key: string) => void
}) {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: -1 | 1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }
  return (
    <section className="row">
      <h2 className="row-title">{row.title}</h2>
      <div className="row-body">
        <button type="button" className="row-arrow row-arrow--prev" aria-label="Anterior" onClick={() => scroll(-1)}>
          ‹
        </button>
        <div className="row-track" ref={track}>
          {row.items.map((item) => (
            <PosterCard key={item.key} item={item} watched={item.entry?.status === 'assistido'} onSelect={onSelect} />
          ))}
        </div>
        <button type="button" className="row-arrow row-arrow--next" aria-label="Próximo" onClick={() => scroll(1)}>
          ›
        </button>
      </div>
    </section>
  )
}
