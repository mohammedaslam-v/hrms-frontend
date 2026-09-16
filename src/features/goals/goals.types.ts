export type GoalType = 'metric' | 'milestone'
export type GoalPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'FY'
export type GoalDirection = 'up' | 'down'

/** Derived on the server from progress against time elapsed. Never stored. */
export type GoalStatus = 'Achieved' | 'Missed' | 'Not started' | 'At risk' | 'On track'

export interface Milestone {
  id: number
  title: string
  isDone: boolean
  sortOrder: number
}

export interface GoalView {
  id: number
  ref: string
  employeeId: number
  employeeName?: string
  title: string
  goalType: GoalType
  period: GoalPeriod
  /** e.g. "Q2 · Jul–Sep", computed from the configured financial year. */
  periodLabel: string
  progress: number
  status: GoalStatus
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  direction: GoalDirection
  note: string | null
  setOn: string
  setterName: string | null
  milestonesDone: number
  milestonesTotal: number
  milestones: Milestone[]
}

export interface MyGoalsSummaryView {
  goalsThisYear: number
  averageProgress: number
  needingAttention: number
  achieved: number
  goals: GoalView[]
}

export interface MemberGoalsGroup {
  employeeId: number
  employeeCode: string
  fullName: string
  designation: string | null
  department: string | null
  goalsCount: number
  averageProgress: number
  goals: GoalView[]
}

export interface TeamGoalsSummaryView {
  totalGoals: number
  onTrack: number
  atRisk: number
  achievedSoFar: number
  members: MemberGoalsGroup[]
}

export interface CreateGoalDto {
  employeeId: number
  title: string
  goalType: GoalType
  period: GoalPeriod
  targetValue?: number | null
  currentValue?: number | null
  unit?: string | null
  direction?: GoalDirection
  note?: string | null
  milestones?: string[]
}

export interface TeamGoalsFilter {
  period?: string
  status?: string
  employeeId?: number
}

/** Bar and figure colour, from the design's GOAL_TONE. */
export const GOAL_TONE: Record<GoalStatus, string> = {
  Achieved: 'var(--green)',
  'On track': 'var(--blue)',
  'At risk': 'var(--amber)',
  Missed: 'var(--red)',
  'Not started': 'var(--muted2)',
}

/** Chip class for the same status, from the design's GOAL_CHIP. */
export const GOAL_CHIP: Record<GoalStatus, string> = {
  Achieved: 'c-in',
  'On track': 'c-wfh',
  'At risk': 'c-wfo',
  Missed: 'c-abs',
  'Not started': 'c-out',
}
