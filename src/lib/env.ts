// Lê variáveis do Vite (navegador) ou do Node (scripts como o seed).
export function env(name: string): string | undefined {
  const fromVite = import.meta.env?.[name]
  if (fromVite !== undefined) return fromVite
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  return proc?.env?.[name]
}
