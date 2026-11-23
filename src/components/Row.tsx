import { useRef, useState } from 'react'
import type { Row as RowData, RowItem } from '../lib/rows'
import PosterCard from './PosterCard'

export default function Row({
  row,
  onSelect,
  onMove,
  onDrop,
}: {
  row: RowData
  onSelect: (key: string) => void
  onMove?: (key: string, dir: -1 | 1) => void
  onDrop?: (draggedKey: string, targetPos: number) => void
}) {
  const track = useRef<HTMLDivElement>(null)
  const dragged = useRef<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const reorder = row.id === 'fila'
  const scroll = (dir: -1 | 1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }
  const cardProps = (item: RowItem) => ({ item, watched: item.entry?.status === 'assistido', onSelect })
  const last = row.items.length - 1
  return (
    <section className="row">
      <h2 className="row-title">{row.title}</h2>
      <div className="row-body">
        <button type="button" className="row-arrow row-arrow--prev" aria-label="Anterior" onClick={() => scroll(-1)}>
          ‹
        </button>
        <div className="row-track" ref={track}>
          {row.items.map((item, i) => {
            if (!reorder) return <PosterCard key={item.key} {...cardProps(item)} />
            return (
              <div
                key={item.key}
                className={`card-slot${overKey === item.key ? ' card-slot--over' : ''}`}
                draggable
                onDragStart={(e) => {
                  dragged.current = item.key
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', item.key)
                }}
                onDragOver={(e) => {
                  if (!dragged.current) return
                  e.preventDefault()
                  setOverKey(item.key)
                }}
                onDragLeave={() => setOverKey((k) => (k === item.key ? null : k))}
                onDragEnd={() => {
                  dragged.current = null
                  setOverKey(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = dragged.current
                  dragged.current = null
                  setOverKey(null)
                  const pos = item.entry?.queuePos
                  if (from && from !== item.key && pos !== null && pos !== undefined) onDrop?.(from, pos)
                }}
              >
                <PosterCard {...cardProps(item)} />
                {i > 0 && (
                  <button
                    type="button"
                    className="move-btn move-btn--left"
                    aria-label="Mover pra esquerda"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMove?.(item.key, -1)
                    }}
                  >
                    ◀
                  </button>
                )}
                {i < last && (
                  <button
                    type="button"
                    className="move-btn move-btn--right"
                    aria-label="Mover pra direita"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMove?.(item.key, 1)
                    }}
                  >
                    ▶
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" className="row-arrow row-arrow--next" aria-label="Próximo" onClick={() => scroll(1)}>
          ›
        </button>
      </div>
    </section>
  )
}
