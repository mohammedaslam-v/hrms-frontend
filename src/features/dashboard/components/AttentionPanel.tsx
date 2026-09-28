import { useNavigate } from 'react-router-dom'
import { ALL_NAV_ITEMS } from '../../../navigation/nav-items'
import type { AttentionItem } from '../dashboard.types'

const TONE: Record<AttentionItem['tone'], string> = {
  violet: '#6D53F0',
  coral: '#EA6A18',
  maroon: '#8B2E2E',
  saffron: '#DD8B08',
}

/**
 * Everything waiting on a decision, in one list.
 *
 * An item is only a link when the screen that answers it exists. The two
 * attendance items arrive with `goTo: null` because Attendance & activity is
 * not built — they still say what is wrong, and the live table below this panel
 * already names the people, so nothing is lost by not linking.
 */
export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="empty">
        <b>All clear</b>
        Nothing needs a decision from you right now.
      </div>
    )
  }

  const pathFor = (navKey: string): string | null =>
    ALL_NAV_ITEMS.find((i) => i.key === navKey)?.path ?? null

  return (
    <>
      {items.map((item) => {
        const path = item.goTo ? pathFor(item.goTo) : null

        const body = (
          <>
            <span className="dot" style={{ background: TONE[item.tone], marginTop: 6 }} />
            <div>
              <b style={{ fontSize: 13 }}>{item.title}</b>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{item.detail}</div>
            </div>
          </>
        )

        if (!path) return <div className="ach" key={item.kind}>{body}</div>

        return (
          <div
            className="ach clickable"
            key={item.kind}
            role="link"
            tabIndex={0}
            onClick={() => navigate(path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(path)
              }
            }}
          >
            {body}
          </div>
        )
      })}
    </>
  )
}
