import type { RowItem } from '../lib/rows'

export default function PosterCard({
  item,
  watched,
  onSelect,
}: {
  item: RowItem
  watched: boolean
  onSelect: (key: string) => void
}) {
  const { summary, entry } = item
  const inQueue = entry?.status === 'fila'
  return (
    <button
      type="button"
      className={`card${watched ? ' card--watched' : ''}`}
      aria-label={summary.title}
      onClick={() => onSelect(item.key)}
    >
      {summary.posterUrl ? (
        <img src={summary.posterUrl} alt="" loading="lazy" />
      ) : (
        <span className="card-fallback">{summary.title}</span>
      )}
      {inQueue && <span className="badge badge--fila">Na fila</span>}
      {watched && <span className="badge badge--visto">✓</span>}
    </button>
  )
}
