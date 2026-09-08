import { useState } from 'react'
import { AddProjectModal } from './AddProjectModal'
import { PROJECT_CHIP, type ProjectRecord } from './projects.types'

/**
 * Projects and achievements.
 *
 * Nothing is gated here — a project is work, and anyone who can open the profile
 * can see it. The author's name is shown because an entry on somebody's record
 * that nobody can attribute is worth less than no entry at all.
 */
interface ProjectsCardProps {
  projects: ProjectRecord[]
  isSelf: boolean
  /** Only a manager or an admin, and never on their own record — same rule as the server. */
  canRecord: boolean
  employeeId: number
  employeeName: string
  onChange: (projects: ProjectRecord[]) => void
}

export function ProjectsCard({
  projects,
  isSelf,
  canRecord,
  employeeId,
  employeeName,
  onChange,
}: ProjectsCardProps) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="card">
      <h3>Projects &amp; achievements</h3>
      {projects.length === 0 ? (
        <div className="empty">
          <b>Nothing recorded yet</b>
          {isSelf
            ? 'Your manager adds the work you are known for here.'
            : 'No projects have been added for this person.'}
        </div>
      ) : (
        projects.map((project) => (
          <div className="doc" key={project.id}>
            <span style={{ flex: 1, minWidth: 0 }}>
              {project.title}
              {project.addedByName && <div className="hint">Added by {project.addedByName}</div>}
            </span>
            <span className={`chip ${PROJECT_CHIP[project.status]}`}>{project.status}</span>
          </div>
        ))
      )}

      {canRecord && (
        <button className="btn ghost sm mt" onClick={() => setAdding(true)}>
          Add a project
        </button>
      )}

      {adding && (
        <AddProjectModal
          employeeId={employeeId}
          employeeName={employeeName}
          onAdded={onChange}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
