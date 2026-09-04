import { useEffect } from 'react'

export interface ToastMessage {
  text: string
  tone?: 'good' | 'bad' | ''
}

interface ToastProps {
  message: ToastMessage | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, 3600)
    return () => clearTimeout(id)
  }, [message, onDismiss])

  return (
    <div className={`toast${message ? ' on' : ''} ${message?.tone ?? ''}`} role="status">
      {message?.text}
    </div>
  )
}
