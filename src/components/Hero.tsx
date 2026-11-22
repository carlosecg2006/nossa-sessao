import type { Details } from '../lib/types'

export default function Hero({
  details,
  onSelect,
}: {
  details: Details
  onSelect: (key: string) => void
}) {
  const key = `${details.mediaType}-${details.id}`
  const open = () => onSelect(key)
  return (
    <div
      className="hero"
      style={details.backdropUrl ? { backgroundImage: `url(${details.backdropUrl})` } : undefined}
    >
      <div className="hero-content">
        <h2 className="hero-title">{details.title}</h2>
        <p className="hero-overview">{details.overview}</p>
        <div className="hero-actions">
          <button type="button" className="btn btn--primary" onClick={open}>▶ Trailer</button>
          <button type="button" className="btn btn--secondary" onClick={open}>♥ Quero ver</button>
          <button type="button" className="btn btn--secondary" onClick={open}>+ Minha fila</button>
        </div>
      </div>
    </div>
  )
}
