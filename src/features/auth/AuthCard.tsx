import type { FormEvent, ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle: string
  error?: string | null
  notice?: string | null
  onSubmit: (event: FormEvent) => void
  children: ReactNode
  footer?: ReactNode
}

/** Shared shell for every auth screen, so the brand block never drifts between steps. */
export function AuthCard({
  title,
  subtitle,
  error,
  notice,
  onSubmit,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="auth">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <div className="auth-brand">
          <span className="logo">b</span>
          <div>
            <div className="wordmark">bambinos.</div>
            <div className="eyebrow">HRMS</div>
          </div>
        </div>

        <h1>{title}</h1>
        <p className="auth-sub">{subtitle}</p>

        {error && (
          <div className="notice bad auth-error" role="alert">
            {error}
          </div>
        )}
        {!error && notice && <div className="notice blue auth-error">{notice}</div>}

        {children}

        {footer && <div className="auth-foot">{footer}</div>}
      </form>
    </div>
  )
}
