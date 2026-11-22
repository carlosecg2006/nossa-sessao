import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { addToCatalog, type Entry } from './catalog'
import type { Summary } from './types'
import { db, ensureAuth } from './firebase'
import { diffEntries } from './room'

const LOAD_ERROR = 'Não deu pra carregar agora. Confere a internet e recarrega a página.'
const TIMEOUT_MS = 10_000

export function useRoom(roomId: string, ownerKey: string | null) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const current = useRef<Entry[]>([])

  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | null = null
    let gotSnapshot = false
    setLoading(true)
    setError(null)
    setIsOwner(false)
    current.current = []

    const fail = () => {
      if (cancelled) return
      setError(LOAD_ERROR)
      setLoading(false)
    }
    const timer = setTimeout(() => {
      if (!gotSnapshot) fail()
    }, TIMEOUT_MS)

    ensureAuth()
      .then(async () => {
        if (cancelled) return
        if (ownerKey !== null) {
          try {
            const snap = await getDoc(doc(db(), 'rooms', roomId))
            if (!cancelled) setIsOwner(snap.exists() && snap.data().ownerKey === ownerKey)
          } catch {
            // not owner if unreadable
          }
        }
        if (cancelled) return
        unsub = onSnapshot(
          collection(db(), 'rooms', roomId, 'entries'),
          (snap) => {
            gotSnapshot = true
            clearTimeout(timer)
            const list = snap.docs.map((d) => d.data() as Entry)
            current.current = list
            setEntries(list)
            setError(null)
            setLoading(false)
          },
          () => {
            clearTimeout(timer)
            fail()
          },
        )
      })
      .catch(() => {
        clearTimeout(timer)
        fail()
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
      unsub?.()
    }
  }, [roomId, ownerKey])

  const save = useCallback(
    (e: Entry) => setDoc(doc(db(), 'rooms', roomId, 'entries', e.key), e),
    [roomId],
  )
  const remove = useCallback(
    (key: string) => deleteDoc(doc(db(), 'rooms', roomId, 'entries', key)),
    [roomId],
  )
  const add = useCallback(
    async (s: Summary) => {
      const before = current.current
      const next = addToCatalog(before, s, Date.now())
      if (next.length === before.length) return
      await setDoc(doc(db(), 'rooms', roomId, 'entries', next[next.length - 1].key), next[next.length - 1])
    },
    [roomId],
  )
  const commit = useCallback(
    async (next: Entry[]) => {
      const { upserts, deletes } = diffEntries(current.current, next)
      if (!upserts.length && !deletes.length) return
      const batch = writeBatch(db())
      for (const e of upserts) batch.set(doc(db(), 'rooms', roomId, 'entries', e.key), e)
      for (const k of deletes) batch.delete(doc(db(), 'rooms', roomId, 'entries', k))
      await batch.commit()
    },
    [roomId],
  )

  // Always works from the live snapshot, never a stale render-time array.
  const apply = useCallback(
    (fn: (current: Entry[]) => Entry[]) => commit(fn(current.current)),
    [commit],
  )

  return { entries, loading, error, isOwner, save, remove, add, commit, apply }
}
