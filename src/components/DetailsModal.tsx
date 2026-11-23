import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { addToQueue, markWatched, react, type Entry } from '../lib/catalog'
import type { Details, Summary } from '../lib/types'

const SAVE_ERROR = 'Não deu pra salvar agora, tenta de novo.'
const FOCUSABLE = 'button, [href], iframe, input, [tabindex]:not([tabindex="-1"])'

interface Props {
  details: Details | null
  loadFailed?: boolean
  entry: Entry | null
  isOwner: boolean
  onApply: (fn: (current: Entry[]) => Entry[]) => Promise<void>
  onAdd: (s: Summary) => Promise<void>
  onRemove: (key: string) => Promise<void>
  onClose: () => void
}

function runtime(min: number | null): string | null {
  if (min === null) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}min`
  return m ? `${h}h ${m}min` : `${h}h`
}

export default function DetailsModal({ details, loadFailed = false, entry, isOwner, onApply, onAdd, onRemove, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const downOnBackdrop = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const [trailer, setTrailer] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!items.length) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (!panelRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus()
    }
  }, [])

  const run = useCallback(async (fn: () => Promise<void>) => {
    setFailed(false)
    try {
      await fn()
    } catch {
      setFailed(true)
    }
  }, [])

  const key = entry?.key
  const apply = (fn: (es: Entry[]) => Entry[]) => run(() => onApply(fn))
  const meta = details
    ? [details.year, runtime(details.runtimeMin)].filter(Boolean).join(' · ')
    : ''

  return (
    <div
      className="modal-backdrop"
      data-testid="modal-backdrop"
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) onClose()
        downOnBackdrop.current = false
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
      >
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
          ✕
        </button>
        {!details ? (
          <>
            <h2 id={titleId} className="modal-title modal-title--plain">Detalhes</h2>
            {loadFailed ? (
              <p className="modal-error modal-loading" role="alert">Não deu pra carregar esse filme agora.</p>
            ) : (
              <p className="modal-loading">Carregando…</p>
            )}
          </>
        ) : (
          <>
            <div className="modal-top">
              {trailer && details.trailerYoutubeKey ? (
                <div className="modal-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${details.trailerYoutubeKey}?autoplay=1`}
                    title={`Trailer de ${details.title}`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  className="modal-cover"
                  style={details.backdropUrl ? { backgroundImage: `url(${details.backdropUrl})` } : undefined}
                />
              )}
              <h2 id={titleId} className="modal-title">{details.title}</h2>
            </div>
            <div className="modal-body">
              <div className="modal-actions">
                {details.trailerYoutubeKey && (
                  <button type="button" className="btn btn--primary" onClick={() => setTrailer(true)}>
                    ▶ Trailer
                  </button>
                )}
                {!entry && (
                  <button type="button" className="btn btn--secondary" onClick={() => run(() => onAdd(details))}>
                    + Adicionar ao catálogo
                  </button>
                )}
                {entry && key && (
                  <>
                    <button
                      type="button"
                      className={`btn btn--secondary${entry.reaction === 'quero' ? ' btn--pressed' : ''}`}
                      aria-pressed={entry.reaction === 'quero'}
                      onClick={() => apply((es) => react(es, key, 'quero', Date.now(), isOwner ? 'dono' : 'amiga'))}
                    >
                      {entry.reaction === 'quero' ? '♥ Você quer ver' : '♥ Quero ver'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn--secondary${entry.reaction === 'naocurti' ? ' btn--pressed' : ''}`}
                      aria-pressed={entry.reaction === 'naocurti'}
                      onClick={() => apply((es) => react(es, key, 'naocurti', Date.now(), isOwner ? 'dono' : 'amiga'))}
                    >
                      👎 Não curti
                    </button>
                    {entry.status === 'catalogo' && (
                      <button type="button" className="btn btn--secondary" onClick={() => apply((es) => addToQueue(es, key))}>
                        + Fila
                      </button>
                    )}
                    {entry.status === 'fila' && (
                      <button type="button" className="btn btn--secondary" onClick={() => apply((es) => markWatched(es, key, Date.now()))}>
                        ✓ Já assistimos
                      </button>
                    )}
                    {entry.status === 'assistido' && (
                      <button type="button" className="btn btn--secondary" onClick={() => apply((es) => addToQueue(es, key))}>
                        ↺ Ver de novo
                      </button>
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          run(async () => {
                            await onRemove(key)
                            onClose()
                          })
                        }
                      >
                        Remover do catálogo
                      </button>
                    )}
                  </>
                )}
              </div>
              {failed && <p className="modal-error" role="alert">{SAVE_ERROR}</p>}

              <p className="modal-meta">
                <span>{meta}</span>
                {details.certification && <span className="modal-cert">{details.certification}</span>}
              </p>
              {details.genres.length > 0 && <p className="modal-genres">{details.genres.join(' · ')}</p>}
              {details.director && <p className="modal-credit">Direção: {details.director}</p>}
              {details.cast.length > 0 && <p className="modal-credit">Elenco: {details.cast.join(', ')}</p>}
              <p className="modal-overview">{details.overview}</p>

              <h3 className="modal-sub">Onde assistir</h3>
              {details.providers.length ? (
                <ul className="modal-providers">
                  {details.providers.map((p) => (
                    <li key={p.name}>
                      {p.logoUrl && <img src={p.logoUrl} alt={p.name} />}
                      <span>{p.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="modal-credit">Ainda não está em streaming oficial no Brasil</p>
              )}

              {details.images.length > 0 && (
                <div className="modal-photos">
                  {details.images.slice(0, 10).map((src) => (
                    <img key={src} src={src} alt={`Cena de ${details.title}`} loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
