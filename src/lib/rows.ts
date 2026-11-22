import { entryKey, picks, queue, toReview, watched, type Entry } from './catalog'
import type { Details, Summary } from './types'

export interface RowItem {
  key: string
  summary: Summary
  entry: Entry | null
}

export interface Row {
  id: string
  title: string
  items: RowItem[]
}

const GENRE_TITLES: Record<string, string> = { Fantasia: 'Bruxas e magia' }

export function buildRows(
  entries: Entry[],
  detailsByKey: Record<string, Details>,
  lancamentos: Summary[],
  isOwner: boolean,
): Row[] {
  const toItems = (list: Entry[]): RowItem[] =>
    list.flatMap((e) => {
      const d = detailsByKey[e.key]
      return d ? [{ key: e.key, summary: d, entry: e }] : []
    })

  const byGenre = new Map<string, Entry[]>()
  for (const e of entries) {
    if (e.status === 'assistido') continue
    for (const g of detailsByKey[e.key]?.genres ?? []) {
      byGenre.set(g, [...(byGenre.get(g) ?? []), e])
    }
  }
  const genreRows: Row[] = [...byGenre.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([g, list]) => ({ id: `genero-${g}`, title: GENRE_TITLES[g] ?? g, items: toItems(list) }))

  const known = new Set(entries.map((e) => e.key))
  const novos: RowItem[] = lancamentos
    .map((s) => ({ key: entryKey(s.mediaType, s.id), summary: s, entry: null }))
    .filter((i) => !known.has(i.key))

  const rows: Row[] = [
    { id: 'fila', title: 'Nossa fila', items: toItems(queue(entries)) },
    { id: 'escolhidos', title: 'Escolhidos por ela', items: toItems(picks(entries)) },
    ...genreRows,
    { id: 'lancamentos', title: 'Lançamentos', items: novos },
    { id: 'assistidos', title: 'Já vimos ✓', items: toItems(watched(entries)) },
    { id: 'revisar', title: 'Pra revisar', items: isOwner ? toItems(toReview(entries)) : [] },
  ]
  return rows.filter((r) => r.items.length > 0)
}
