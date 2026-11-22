import { useEffect, useState, type ReactNode } from 'react'

export default function Header({ children }: { children?: ReactNode }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`app-header${solid ? ' app-header--solid' : ''}`}>
      <h1 className="app-brand">Nossa Sessão</h1>
      {children}
    </header>
  )
}
