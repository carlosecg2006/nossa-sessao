import { describe, expect, it, vi } from 'vitest'

vi.mock('firebase/app', () => ({ getApps: () => [], initializeApp: () => ({}) }))
vi.mock('firebase/firestore', () => ({ getFirestore: () => ({}) }))
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  signInAnonymously: () => {
    throw new Error('auth/invalid-api-key')
  },
}))

import { ensureAuth } from './firebase'

describe('ensureAuth', () => {
  it('returns a rejected promise (never throws synchronously) when sign-in blows up', async () => {
    let p: Promise<void> | undefined
    expect(() => {
      p = ensureAuth()
    }).not.toThrow()
    await expect(p).rejects.toThrow('auth/invalid-api-key')
  })
})
