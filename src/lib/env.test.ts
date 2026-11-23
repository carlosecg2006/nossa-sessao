import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from './env'

describe('env', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('lê de import.meta.env', () => {
    vi.stubEnv('VITE_TESTE_A', 'vite')
    expect(env('VITE_TESTE_A')).toBe('vite')
  })

  it('cai para process.env quando import.meta.env não tem', () => {
    const penv = (globalThis as any).process.env
    penv.VITE_TESTE_B = 'node'
    try {
      expect(env('VITE_TESTE_B')).toBe('node')
    } finally {
      delete penv.VITE_TESTE_B
    }
  })

  it('devolve undefined quando não existe', () => {
    expect(env('VITE_NAO_EXISTE')).toBeUndefined()
  })
})
