import { Component, type ErrorInfo, type ReactNode } from 'react'
import Header from './Header'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <>
        <Header />
        <p className="state" role="alert">Não deu pra carregar agora. Confere a internet e recarrega a página.</p>
      </>
    )
  }
}
