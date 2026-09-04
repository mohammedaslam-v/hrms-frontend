import { useState, type FormEvent } from 'react'
import { authApi } from '../api/auth'
import type { OtpChallenge } from '../types/auth'
import { AuthCard } from './AuthCard'
import { OtpFields } from './OtpFields'

interface ForgotPasswordPageProps {
  initialEmail: string
  onDone: (message: string) => void
  onCancel: () => void
}

type Step = 'email' | 'otp' | 'password'

const MIN_PASSWORD_LENGTH = 8

const messageOf = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export function ForgotPasswordPage({
  initialEmail,
  onDone,
  onCancel,
}: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('email')
  const [workEmail, setWorkEmail] = useState(initialEmail)
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      // Always succeeds, whether or not the address exists — the response is
      // identical either way, so this screen cannot be used to discover accounts.
      const next = await authApi.forgotPassword(workEmail)
      setChallenge(next)
      setCode('')
      setNotice(null)
      setStep('otp')
    } catch (err) {
      setError(messageOf(err, 'Could not send a reset code.'))
    } finally {
      setBusy(false)
    }
  }

  const checkCode = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) return
    setError(null)
    setBusy(true)
    try {
      // Verified without spending the code; reset-password re-checks and consumes it.
      await authApi.verifyResetOtp(challenge.challengeId, code)
      setNotice(null)
      setStep('password')
    } catch (err) {
      setError(messageOf(err, 'That code could not be verified.'))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!challenge) return
    setError(null)
    setResending(true)
    try {
      const next = await authApi.resendOtp(challenge.challengeId)
      setChallenge(next)
      setCode('')
      setNotice('A new code is on its way.')
    } catch (err) {
      setError(messageOf(err, 'Could not send a new code.'))
    } finally {
      setResending(false)
    }
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) return
    if (newPassword !== confirmPassword) {
      setError('Those two passwords do not match.')
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setError(null)
    setBusy(true)
    try {
      await authApi.resetPassword(challenge.challengeId, code, newPassword)
      onDone('Password updated. Sign in with your new password.')
    } catch (err) {
      setError(messageOf(err, 'Could not update your password.'))
      setBusy(false)
    }
  }

  if (step === 'otp' && challenge) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="Enter the 6-digit code we sent you."
        error={error}
        notice={notice}
        onSubmit={checkCode}
        footer={
          <button type="button" className="linkbtn" onClick={onCancel}>
            Back to sign in
          </button>
        }
      >
        <OtpFields
          challenge={challenge}
          code={code}
          onCodeChange={setCode}
          onResend={resend}
          resending={resending}
          disabled={busy}
        />
        <button className="btn primary block" type="submit" disabled={busy || code.length !== 6}>
          {busy ? 'Verifying…' : 'Verify code'}
        </button>
      </AuthCard>
    )
  }

  if (step === 'password') {
    return (
      <AuthCard
        title="Set a new password"
        subtitle="Choose something you have not used here before."
        error={error}
        onSubmit={savePassword}
        footer={
          <button type="button" className="linkbtn" onClick={onCancel}>
            Back to sign in
          </button>
        }
      >
        <div className="auth-field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={busy}
            required
            autoFocus
          />
        </div>
        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={busy}
            required
          />
        </div>
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We will email you a 6-digit code."
      error={error}
      onSubmit={requestCode}
      footer={
        <button type="button" className="linkbtn" onClick={onCancel}>
          Back to sign in
        </button>
      }
    >
      <div className="auth-field">
        <label htmlFor="resetEmail">Work email</label>
        <input
          id="resetEmail"
          type="email"
          autoComplete="username"
          placeholder="name@bambinos.live"
          value={workEmail}
          onChange={(e) => setWorkEmail(e.target.value)}
          disabled={busy}
          required
          autoFocus
        />
      </div>
      <button className="btn primary block" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send code'}
      </button>
    </AuthCard>
  )
}
