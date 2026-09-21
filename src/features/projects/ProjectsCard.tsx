import { useState } from 'react'
import { AddProjectModal } from './AddProjectModal'
import { ProjectTrackerModal } from './ProjectTrackerModal'
import { PROJECT_CHIP, type ProjectRecord } from './projects.types'

interface ProjectsCardProps {
  projects: ProjectRecord[]
  isSelf: boolean
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
  const [trackingProject, setTrackingProject] = useState<ProjectRecord | null>(null)

  // Under Option 2, employees can manage their own, and managers/admins can manage reports
  const canManage = isSelf || canRecord

  const achievements = projects.filter((p) => p.type === 'achievement')
  const regularProjects = projects.filter((p) => p.type !== 'achievement')

  const handleProjectsUpdated = (updated: ProjectRecord[]) => {
    onChange(updated)
    if (trackingProject) {
      const refreshed = updated.find((p) => p.id === trackingProject.id) || null
      setTrackingProject(refreshed)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
        <h3 style={{ margin: 0 }}>Projects &amp; achievements</h3>
        {projects.length > 0 && (
          <span className="hint" style={{ fontSize: '12px' }}>
            {regularProjects.length} project{regularProjects.length === 1 ? '' : 's'}
            {achievements.length > 0 && ` · ${achievements.length} win${achievements.length === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <b>Nothing recorded yet</b>
          {canManage
            ? 'Add projects and track what is done, in progress, and pending.'
            : 'No projects or achievements have been recorded yet.'}
        </div>
      ) : (
        <div className="projects-scroll">
          {/* Key Achievements Highlight Section */}
          {achievements.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 700,
                  color: 'var(--amber)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>🏆</span> Key Achievements &amp; Wins
              </div>
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    background: 'var(--amber-soft)',
                    border: '1px solid #f2dfbd',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setTrackingProject(ach)}
                  title="Click to view details or edit"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#684506' }}>
                      {ach.title}
                    </div>
                    <span className="chip c-wfo" style={{ fontSize: '10.5px' }}>
                      Milestone
                    </span>
                  </div>
                  {ach.note && (
                    <div style={{ fontSize: '12px', color: '#7a5208', marginTop: '4px' }}>
                      {ach.note}
                    </div>
                  )}
                  <div className="hint" style={{ marginTop: '5px', fontSize: '11.5px', color: '#976e1a' }}>
                    {ach.startedOn && <span>{ach.startedOn} · </span>}
                    {ach.addedByName && <span>Added by {ach.addedByName}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular Projects with Tracker Summary */}
          {regularProjects.length > 0 && (
            <div>
              {achievements.length > 0 && (
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  Active &amp; Delivered Projects
                </div>
              )}

              {regularProjects.map((project) => {
                const stats = project.taskStats || { total: 0, done: 0, inProgress: 0, pending: 0 }
                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

                return (
                  <div
                    key={project.id}
                    className="doc"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      cursor: 'pointer',
                      padding: '11px 13px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--line2)',
                      background: 'var(--card)',
                      transition: 'border-color 0.15s ease',
                    }}
                    onClick={() => setTrackingProject(project)}
                    title="Click to open Project Tracker (tasks & subtasks)"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', flex: 1, minWidth: 0 }}>
                        {project.title}
                      </div>
                      <span className={`chip ${PROJECT_CHIP[project.status]}`}>{project.status}</span>
                    </div>

                    {project.note && (
                      <div className="hint" style={{ marginTop: '4px', fontSize: '12px' }}>
                        {project.note}
                      </div>
                    )}

                    {/* Mini Task Tracker Progress Bar */}
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--line2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>
                          {stats.total > 0 ? `${stats.done}/${stats.total} tasks done (${pct}%)` : 'No tasks added yet'}
                        </span>
                        <span style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '11px' }}>
                          Track tasks ➔
                        </span>
                      </div>

                      {stats.total > 0 ? (
                        <div className="bar" style={{ height: '5px', background: 'var(--line2)', borderRadius: '3px', overflow: 'hidden' }}>
                          <i
                            style={{
                              display: 'block',
                              height: '100%',
                              width: `${pct}%`,
                              background: pct === 100 ? 'var(--green)' : 'var(--blue)',
                            }}
                          />
                        </div>
                      ) : null}

                      <div className="hint" style={{ marginTop: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{project.startedOn ? `Started ${project.startedOn}` : 'In progress'}</span>
                        {project.addedByName && <span>Added by {project.addedByName}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Button - Visible to both Employee (self) and Manager/Admin */}
      {canManage && (
        <button
          className="btn ghost sm mt"
          onClick={() => setAdding(true)}
          style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
        >
          + Add a project or achievement
        </button>
      )}

      {/* Add Project / Achievement Modal */}
      {adding && (
        <AddProjectModal
          employeeId={employeeId}
          employeeName={employeeName}
          isSelf={isSelf}
          onAdded={handleProjectsUpdated}
          onClose={() => setAdding(false)}
        />
      )}

      {/* Project Tracker Modal (Interactive tasks & subtasks tracker) */}
      {trackingProject && (
        <ProjectTrackerModal
          project={trackingProject}
          canEdit={canManage}
          onClose={() => setTrackingProject(null)}
          onUpdated={handleProjectsUpdated}
        />
      )}
    </div>
  )
}
