import { useState, type FormEvent } from 'react'
import { authApi } from '../api/auth'
import type { AuthenticatedEmployee, OtpChallenge } from '../types/auth'
import { AuthCard } from './AuthCard'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { OtpFields } from './OtpFields'

interface LoginPageProps {
  onSignedIn: (employee: AuthenticatedEmployee) => void
}

type Step = 'credentials' | 'otp' | 'forgot'

const messageOf = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export function LoginPage({ onSignedIn }: LoginPageProps) {
  const [step, setStep] = useState<Step>('credentials')
  const [workEmail, setWorkEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      // A correct password does not sign anyone in — it earns an OTP challenge.
      const next = await authApi.login(workEmail, password)
      setChallenge(next)
      setCode('')
      setNotice(null)
      setStep('otp')
    } catch (err) {
      setError(messageOf(err, 'Could not sign you in.'))
    } finally {
      setBusy(false)
    }
  }

  const submitOtp = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) return
    setError(null)
    setBusy(true)
    try {
      const session = await authApi.verifyOtp(challenge.challengeId, code)
      onSignedIn(session.employee)
    } catch (err) {
      setError(messageOf(err, 'That code could not be verified.'))
      setCode('')
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

  const backToCredentials = () => {
    setStep('credentials')
    setChallenge(null)
    setCode('')
    setPassword('')
    setError(null)
    setNotice(null)
  }

  if (step === 'forgot') {
    return (
      <ForgotPasswordPage
        initialEmail={workEmail}
        onDone={(msg) => {
          backToCredentials()
          setNotice(msg)
        }}
        onCancel={backToCredentials}
      />
    )
  }

  if (step === 'otp' && challenge) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="Enter the 6-digit code to finish signing in."
        error={error}
        notice={notice}
        onSubmit={submitOtp}
        footer={
          <button type="button" className="linkbtn" onClick={backToCredentials}>
            Use a different account
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
          {busy ? 'Verifying…' : 'Verify and sign in'}
        </button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use your Bambinos work email and password."
      error={error}
      notice={notice}
      onSubmit={submitCredentials}
      footer="Trouble signing in? Contact HR — your HRMS password is the same one you use for the Bambinos admin portal."
    >
      <div className="auth-field">
        <label htmlFor="workEmail">Work email</label>
        <input
          id="workEmail"
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

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
        />
        <div className="auth-forgot">
          <button
            type="button"
            className="linkbtn"
            onClick={() => {
              setError(null)
              setNotice(null)
              setStep('forgot')
            }}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <button className="btn primary block" type="submit" disabled={busy}>
        {busy ? 'Checking…' : 'Continue'}
      </button>
    </AuthCard>
  )
}
