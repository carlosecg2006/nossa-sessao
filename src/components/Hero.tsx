import { entryKey } from '../lib/catalog'
import type { Details } from '../lib/types'

export default function Hero({
  details,
  onSelect,
  onWant,
  onQueue,
}: {
  details: Details
  onSelect: (key: string) => void
  onWant: (key: string) => void
  onQueue: (key: string) => void
}) {
  const key = entryKey(details.mediaType, details.id)
  const open = () => onSelect(key)
  return (
    <div
      className="hero"
      style={details.backdropUrl ? { backgroundImage: `url("${details.backdropUrl}")` } : undefined}
    >
      <div className="hero-content">
        <h2 className="hero-title">{details.title}</h2>
        <p className="hero-overview">{details.overview}</p>
        <div className="hero-actions">
          <button type="button" className="btn btn--primary" onClick={open}>
            {details.trailerYoutubeKey ? '▶ Trailer' : 'ⓘ Detalhes'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => onWant(key)}>♥ Quero ver</button>
          <button type="button" className="btn btn--secondary" onClick={() => onQueue(key)}>+ Minha fila</button>
        </div>
      </div>
    </div>
  )
}
