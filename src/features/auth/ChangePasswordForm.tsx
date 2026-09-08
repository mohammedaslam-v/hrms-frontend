import { useState, type FormEvent } from 'react'
import { authApi } from './auth.api'

interface ChangePasswordFormProps {
  /** Changing the password revokes every session, so the app must sign out after. */
  onChanged: () => void
  onCancel: () => void
}

const MIN_PASSWORD_LENGTH = 8

export function ChangePasswordForm({ onChanged, onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()

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
      await authApi.changePassword(currentPassword, newPassword)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <div className="notice bad auth-error" role="alert">
          {error}
        </div>
      )}

      <div className="notice blue auth-error">
        This is the same password you use for the Bambinos admin portal. Changing it here
        changes it there too, and signs you out of both.
      </div>

      <div className="auth-field">
        <label htmlFor="currentPassword">Current password</label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={busy}
          required
          autoFocus
        />
      </div>

      <div className="auth-field">
        <label htmlFor="cpNew">New password</label>
        <input
          id="cpNew"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={busy}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="cpConfirm">Confirm new password</label>
        <input
          id="cpConfirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={busy}
          required
        />
      </div>

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
        <button className="btn ghost" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
