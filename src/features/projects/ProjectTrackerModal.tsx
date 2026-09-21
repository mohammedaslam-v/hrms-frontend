import { useState, type FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { messageOf } from '../../shared/api/errors'
import { projectsApi } from './projects.api'
import {
  PROJECT_CHIP,
  TASK_CHIP,
  type ProjectRecord,
  type ProjectStatus,
  type ProjectTaskRecord,
  type TaskStatus,
} from './projects.types'

const PROJECT_STATUSES: ProjectStatus[] = ['In progress', 'Live', 'Done']
const TASK_STATUSES: TaskStatus[] = ['Pending', 'In progress', 'Done']

interface ProjectTrackerModalProps {
  project: ProjectRecord
  canEdit: boolean
  onClose: () => void
  onUpdated: (projects: ProjectRecord[]) => void
}

export function ProjectTrackerModal({
  project,
  canEdit,
  onClose,
  onUpdated,
}: ProjectTrackerModalProps) {
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('Pending')
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<number | null>(null)
  const [subtaskTitle, setSubtaskTitle] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tasks = project.tasks || []
  const stats = project.taskStats || {
    total: 0,
    done: 0,
    inProgress: 0,
    pending: 0,
  }

  const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  // Quick project status change
  const changeProjectStatus = async (newStatus: ProjectStatus) => {
    if (!canEdit || busy || newStatus === project.status) return
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.update(project.id, { status: newStatus })
      onUpdated(updated)
    } catch (err) {
      setError(messageOf(err, 'Could not update project status.'))
    } finally {
      setBusy(false)
    }
  }

  // Delete project
  const deleteProject = async () => {
    if (!canEdit || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.delete(project.id)
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not delete project.'))
      setBusy(false)
    }
  }

  // Add root task
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit || !newTaskTitle.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.addTask(project.id, {
        title: newTaskTitle.trim(),
        status: newTaskStatus,
      })
      onUpdated(updated)
      setNewTaskTitle('')
      setNewTaskStatus('Pending')
    } catch (err) {
      setError(messageOf(err, 'Could not add task.'))
    } finally {
      setBusy(false)
    }
  }

  // Add subtask
  const handleAddSubtask = async (parentTaskId: number) => {
    if (!canEdit || !subtaskTitle.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.addTask(project.id, {
        parentTaskId,
        title: subtaskTitle.trim(),
        status: 'Pending',
      })
      onUpdated(updated)
      setSubtaskTitle('')
      setAddingSubtaskFor(null)
    } catch (err) {
      setError(messageOf(err, 'Could not add subtask.'))
    } finally {
      setBusy(false)
    }
  }

  // Cycle task status: Pending -> In progress -> Done -> Pending
  const cycleTaskStatus = async (task: ProjectTaskRecord) => {
    if (!canEdit || busy) return
    const next: Record<TaskStatus, TaskStatus> = {
      Pending: 'In progress',
      'In progress': 'Done',
      Done: 'Pending',
    }
    const newStatus = next[task.status]
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.updateTask(task.id, { status: newStatus })
      onUpdated(updated)
    } catch (err) {
      setError(messageOf(err, 'Could not update task.'))
    } finally {
      setBusy(false)
    }
  }

  // Delete task
  const deleteTask = async (taskId: number) => {
    if (!canEdit || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await projectsApi.deleteTask(taskId)
      onUpdated(updated)
    } catch (err) {
      setError(messageOf(err, 'Could not delete task.'))
    } finally {
      setBusy(false)
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  return (
    <Modal
      title="Project Tracker"
      onClose={onClose}
      maxWidth={680}
      busy={busy}
      error={error}
    >
      {/* Project Header & Meta */}
      <div
        style={{
          borderBottom: '1px solid var(--line2)',
          paddingBottom: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, margin: 0 }}>{project.title}</h2>
            <div className="hint" style={{ marginTop: '4px' }}>
              {project.startedOn && <span>Started {project.startedOn} · </span>}
              {project.addedByName && <span>Added by {project.addedByName}</span>}
            </div>
          </div>
          {canEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="hint" style={{ fontSize: '12px' }}>Status:</span>
              <select
                value={project.status}
                onChange={(e) => changeProjectStatus(e.target.value as ProjectStatus)}
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                }}
                disabled={busy}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className={`chip ${PROJECT_CHIP[project.status]}`}>{project.status}</span>
          )}
        </div>

        {project.note && (
          <p style={{ fontSize: '13.5px', color: 'var(--ink2)', margin: '10px 0 0' }}>
            {project.note}
          </p>
        )}
      </div>

      {/* Progress & KPIs */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink2)' }}>
            Overall Progress: {percent}% completed
          </span>
          <span className="hint" style={{ fontSize: '12px' }}>
            {stats.done} of {stats.total} tasks done
          </span>
        </div>
        <div className="bar" style={{ height: '8px', background: 'var(--line2)', borderRadius: '4px', overflow: 'hidden' }}>
          <i
            style={{
              display: 'block',
              height: '100%',
              width: `${percent}%`,
              background: percent === 100 ? 'var(--green)' : 'var(--blue)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
          <div
            onClick={() => setFilter(filter === 'Done' ? 'all' : 'Done')}
            style={{
              background: filter === 'Done' ? 'var(--green-soft)' : 'var(--bg)',
              border: `1px solid ${filter === 'Done' ? 'var(--green)' : 'var(--line)'}`,
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{stats.done}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted)' }}>
              Done
            </div>
          </div>

          <div
            onClick={() => setFilter(filter === 'In progress' ? 'all' : 'In progress')}
            style={{
              background: filter === 'In progress' ? 'var(--amber-soft)' : 'var(--bg)',
              border: `1px solid ${filter === 'In progress' ? 'var(--amber)' : 'var(--line)'}`,
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--amber)' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted)' }}>
              In progress
            </div>
          </div>

          <div
            onClick={() => setFilter(filter === 'Pending' ? 'all' : 'Pending')}
            style={{
              background: filter === 'Pending' ? 'var(--blue-soft)' : 'var(--bg)',
              border: `1px solid ${filter === 'Pending' ? 'var(--blue)' : 'var(--line)'}`,
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--muted)' }}>{stats.pending}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted)' }}>
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line2)', paddingBottom: '10px', marginBottom: '14px' }}>
        {(['all', 'Pending', 'In progress', 'Done'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn sm ${filter === tab ? 'primary' : 'ghost'}`}
            onClick={() => setFilter(tab)}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            {tab === 'all' ? `All (${stats.total})` : `${tab} (${tab === 'Done' ? stats.done : tab === 'In progress' ? stats.inProgress : stats.pending})`}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '16px' }}>
        {filteredTasks.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            <b>No tasks in this view</b>
            {canEdit ? 'Add a task below to start tracking work.' : 'No tasks recorded for this project yet.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line2)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '8px',
              }}
            >
              {/* Main Task Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  title="Click to cycle status: Pending ➔ In progress ➔ Done"
                  onClick={() => cycleTaskStatus(task)}
                  disabled={!canEdit || busy}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: canEdit ? 'pointer' : 'default',
                    padding: 0,
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {task.status === 'Done' ? '✅' : task.status === 'In progress' ? '⏳' : '⭕'}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: task.status === 'Done' ? 'var(--muted)' : 'var(--ink)',
                      textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="hint" style={{ marginLeft: '8px', fontSize: '11.5px' }}>
                      Due {task.dueDate}
                    </span>
                  )}
                </div>

                <span
                  className={`chip ${TASK_CHIP[task.status]}`}
                  style={{ cursor: canEdit ? 'pointer' : 'default', fontSize: '11px' }}
                  onClick={() => cycleTaskStatus(task)}
                >
                  {task.status}
                </span>

                {canEdit && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '2px 7px', fontSize: '11.5px' }}
                      onClick={() => setAddingSubtaskFor(addingSubtaskFor === task.id ? null : task.id)}
                      title="Add a subtask under this task"
                    >
                      + Subtask
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '2px 6px', color: 'var(--red)', fontSize: '13px' }}
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Subtasks List */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div style={{ marginLeft: '26px', marginTop: '8px', borderLeft: '2px solid var(--line)', paddingLeft: '10px' }}>
                  {task.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => cycleTaskStatus(sub)}
                        disabled={!canEdit || busy}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          padding: 0,
                          fontSize: '15px',
                        }}
                      >
                        {sub.status === 'Done' ? '✅' : sub.status === 'In progress' ? '⏳' : '⭕'}
                      </button>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '12.5px',
                          color: sub.status === 'Done' ? 'var(--muted)' : 'var(--ink)',
                          textDecoration: sub.status === 'Done' ? 'line-through' : 'none',
                        }}
                      >
                        {sub.title}
                      </span>
                      <span className={`chip ${TASK_CHIP[sub.status]}`} style={{ fontSize: '10.5px', padding: '1px 6px' }}>
                        {sub.status}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn ghost sm"
                          style={{ padding: '1px 5px', color: 'var(--red)', fontSize: '11px' }}
                          onClick={() => deleteTask(sub.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Add Subtask Input */}
              {addingSubtaskFor === task.id && (
                <div style={{ marginLeft: '26px', marginTop: '8px', display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Subtask title..."
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSubtask(task.id)
                      }
                    }}
                    style={{ flex: 1, fontSize: '12.5px', padding: '5px 8px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={!subtaskTitle.trim() || busy}
                    onClick={() => handleAddSubtask(task.id)}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => {
                      setAddingSubtaskFor(null)
                      setSubtaskTitle('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Task Form (Inline) */}
      {canEdit && (
        <form
          onSubmit={handleAddTask}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Add a new task (e.g. Design review, API integration...)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={busy}
            style={{ flex: 1, minWidth: '180px', fontSize: '13px' }}
          />
          <select
            value={newTaskStatus}
            onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
            disabled={busy}
            style={{ fontSize: '12.5px', padding: '6px 8px' }}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn primary sm"
            disabled={!newTaskTitle.trim() || busy}
          >
            + Add Task
          </button>
        </form>
      )}

      {/* Footer & Delete Project */}
      {canEdit && (
        <div
          style={{
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--red)', fontWeight: 500 }}>
                Delete this project and all its tasks?
              </span>
              <button
                type="button"
                className="btn sm"
                style={{ background: 'var(--red)', color: '#fff' }}
                onClick={deleteProject}
                disabled={busy}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn ghost sm"
              style={{ color: 'var(--red)', fontSize: '12px' }}
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              Delete Project
            </button>
          )}

          <button type="button" className="btn outline sm" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </Modal>
  )
}
