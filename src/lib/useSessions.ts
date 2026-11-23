import { useCallback, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, ensureAuth } from './firebase'
import type { Session } from './sessions'

export function useSessions(roomId: string) {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | null = null
    setSessions([])
    ensureAuth()
      .then(() => {
        if (cancelled) return
        unsub = onSnapshot(
          collection(db(), 'rooms', roomId, 'sessions'),
          (snap) => {
            if (!cancelled) setSessions(snap.docs.map((d) => d.data() as Session))
          },
          () => {},
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [roomId])

  const save = useCallback(
    async (s: Session) => {
      await ensureAuth()
      await setDoc(doc(db(), 'rooms', roomId, 'sessions', s.id), s)
    },
    [roomId],
  )

  return { sessions, save }
}
