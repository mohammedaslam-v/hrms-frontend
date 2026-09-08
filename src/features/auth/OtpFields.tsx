import { useEffect, useState } from 'react'
import type { OtpChallenge } from '../../types/auth'

interface OtpFieldsProps {
  challenge: OtpChallenge
  code: string
  onCodeChange: (code: string) => void
  onResend: () => void
  resending: boolean
  disabled: boolean
}

/**
 * Seconds remaining until the given ISO timestamp, ticking down to zero.
 * Only the clock is state; the remainder is derived during render, so a new
 * challenge updates the display immediately rather than on the next tick.
 */
function useCountdown(target: string): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return Math.max(0, Math.ceil((new Date(target).getTime() - now) / 1000))
}

export function OtpFields({
  challenge,
  code,
  onCodeChange,
  onResend,
  resending,
  disabled,
}: OtpFieldsProps) {
  const resendIn = useCountdown(challenge.resendAvailableAt)
  const expiresIn = useCountdown(challenge.expiresAt)

  const expiredLabel =
    expiresIn === 0
      ? 'That code has expired — ask for a new one.'
      : `Expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`

  return (
    <>
      <div className="auth-field">
        <label htmlFor="code">6-digit code</label>
        <input
          id="code"
          className="otp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          value={code}
          // Digits only — pasting a code with spaces or dashes should still work.
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={disabled}
          required
          autoFocus
        />
        <div className="hint">
          Sent to <strong>{challenge.sentTo}</strong> · {expiredLabel}
        </div>
      </div>

      <div className="auth-resend">
        {resendIn > 0 ? (
          <span className="hint">You can ask for a new code in {resendIn}s</span>
        ) : (
          <button
            type="button"
            className="linkbtn"
            onClick={onResend}
            disabled={resending || disabled}
          >
            {resending ? 'Sending…' : 'Send a new code'}
          </button>
        )}
      </div>
    </>
  )
}
