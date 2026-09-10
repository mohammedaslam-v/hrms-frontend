import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth-context'
import { AppShell } from '../layouts/AppShell'
import { ALL_NAV_ITEMS } from '../navigation/nav-items'
import { canAccess, homePathFor } from '../navigation/access'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'
import { LeaveApprovalsPage } from '../features/leave'
import { MyLeavePage } from '../features/leave'
import { MyPage } from '../features/profile'
import { TeamDirectoryPage } from '../features/team'

/**
 * Which screen answers each rail entry.
 *
 * Every nav item is routed; the ones absent from this table are permitted and
 * reachable but not yet built, and land on a placeholder rather than a dead link.
 * Adding a page is one line here and one line in `nav-items` — it used to be
 * another rung on a ternary chain inside `App`.
 */
const PAGES: Record<string, ReactNode> = {
  myleave: <MyLeavePage />,
  leave: <LeaveApprovalsPage />,
  me: <MyPage />,
  team: <TeamDirectoryPage />,
}

export function AppRouter() {
  const { employee } = useAuth()
  // Nobody should land on a page their access level padlocks.
  const home = homePathFor(employee.defaultTier)

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={home} replace />} />

          {ALL_NAV_ITEMS.map((item) => (
            <Route
              key={item.key}
              path={item.path}
              element={
                // Routes are gated as well as the rail — typing a URL is not a way in.
                // The API enforces the same rules again; this is only convenience.
                canAccess(item.tier, employee.tiers) ? (
                  (PAGES[item.key] ?? <PlaceholderPage item={item} />)
                ) : (
                  <Navigate to={home} replace />
                )
              }
            />
          ))}

          {/* The same page for a team member. Who may open it is decided by the
              API against the reporting tree, so there is no tier gate here. */}
          <Route path="/me/:id" element={<MyPage />} />

          <Route path="*" element={<Navigate to={home} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
