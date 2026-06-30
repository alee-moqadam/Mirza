import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Mirza render error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main className="app-error-boundary" dir="rtl">
      <h1>برنامه با خطا روبه‌رو شد</h1>
      <p>برای ادامه، صفحه را دوباره بارگذاری کنید. اگر خطا تکرار شد، متن خطا را بررسی کنید.</p>
      {import.meta.env.DEV && <pre>{this.state.error?.stack || this.state.error?.message || String(this.state.error)}</pre>}
    </main>
  }
}
