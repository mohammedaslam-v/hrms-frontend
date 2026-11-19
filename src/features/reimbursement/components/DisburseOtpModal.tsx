import { useEffect, useRef, useState } from 'react'

interface DisburseOtpModalProps {
  title?: string
  beneficiaryName: string
  beneficiaryCode?: string
  department?: string | null
  amount: number
  purposeText: string
  initialChallengeId: string
  maskedEmail: string
  onResendOtp: () => Promise<string>
  onConfirm: (challengeId: string, otp: string) => Promise<void>
  onClose: () => void
}

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function DisburseOtpModal({
  title = 'Authorize Payout via RazorpayX',
  beneficiaryName,
  beneficiaryCode,
  department,
  amount,
  purposeText,
  initialChallengeId,
  maskedEmail,
  onResendOtp,
  onConfirm,
  onClose,
}: DisburseOtpModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [challengeId, setChallengeId] = useState(initialChallengeId)
  const [currentEmail] = useState(maskedEmail)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const otpCode = digits.join('')

  const handleDigitChange = (index: number, val: string) => {
    // If user pasted a multi-character string (e.g. copied from email)
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length > 1) {
      const nextDigits = [...digits]
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = cleaned[i] || ''
      }
      setDigits(nextDigits)
      const nextFocus = Math.min(cleaned.length, 5)
      inputRefs.current[nextFocus]?.focus()
      return
    }

    const nextDigits = [...digits]
    nextDigits[index] = cleaned.slice(-1)
    setDigits(nextDigits)
    setError(null)

    // Auto-advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return
    try {
      setResending(true)
      setError(null)
      const newChallengeId = await onResendOtp()
      setChallengeId(newChallengeId)
      setDigits(['', '', '', '', '', ''])
      setSecondsLeft(60)
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the authorization code.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onConfirm(challengeId, otpCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disbursement verification failed.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal on"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 41, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🔒
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                {title}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Two-Factor Financial Authorization
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Beneficiary & Amount Card */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line2)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Beneficiary
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {beneficiaryName}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>
              {beneficiaryCode ? `${beneficiaryCode} · ` : ''}
              {department ? `${department} · ` : ''}
              {purposeText}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Payout Amount
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
              {formatInr(amount)}
            </div>
          </div>
        </div>

        {/* Information text */}
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5', margin: '0 0 16px' }}>
          To authorize this bank transfer via RazorpayX, enter the 6-digit code sent to your registered admin email:{' '}
          <strong style={{ color: 'var(--ink)' }}>{currentEmail}</strong>
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* OTP Input Boxes */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={submitting}
                style={{
                  width: '48px',
                  height: '54px',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '10px',
                  border: digit ? '2px solid #2563eb' : '1.5px solid var(--line2)',
                  background: '#fafbfc',
                  color: 'var(--ink)',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              />
            ))}
          </div>

          {/* Resend info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              marginBottom: '22px',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>
              {secondsLeft > 0 ? (
                <>⏱️ Resend code in <strong>{secondsLeft}s</strong></>
              ) : (
                'Didn’t receive the code?'
              )}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0 || resending || submitting}
              style={{
                background: 'none',
                border: 'none',
                color: secondsLeft > 0 ? 'var(--muted2)' : '#2563eb',
                fontWeight: 600,
                cursor: secondsLeft > 0 ? 'default' : 'pointer',
                padding: '4px',
                fontSize: '12px',
              }}
            >
              {resending ? 'Sending…' : 'Resend Code'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || otpCode.length !== 6}
              style={{
                background: '#2563eb',
                borderColor: '#2563eb',
                minWidth: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {submitting ? 'Verifying & Sending…' : 'Verify & Send to RazorpayX ⚡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
