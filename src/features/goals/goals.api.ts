import { request } from '../../shared/api/client'
import type {
  CreateGoalDto,
  GoalView,
  MyGoalsSummaryView,
  TeamGoalsFilter,
  TeamGoalsSummaryView,
  UpdateGoalDto,
} from './goals.types'

export const goalsApi = {
  getMyGoals: () => request<MyGoalsSummaryView>('/goals/me'),

  getTeamGoals: (filters?: TeamGoalsFilter) => {
    const params = new URLSearchParams()
    if (filters?.period && filters.period !== 'all') {
      params.append('period', filters.period)
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status)
    }
    if (filters?.employeeId) {
      params.append('employeeId', String(filters.employeeId))
    }
    const qs = params.toString()
    return request<TeamGoalsSummaryView>(`/goals/team${qs ? `?${qs}` : ''}`)
  },

  create: (dto: CreateGoalDto) =>
    request<GoalView>('/goals', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: number, dto: UpdateGoalDto) =>
    request<GoalView>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  approve: (id: number) =>
    request<{ success: boolean; data: GoalView; message: string }>(`/goals/${id}/approve`, {
      method: 'POST',
    }),

  reject: (id: number, reason?: string) =>
    request<{ success: boolean; data: GoalView; message: string }>(`/goals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  updateMetric: (id: number, currentValue: number) =>
    request<GoalView>(`/goals/${id}/metric`, {
      method: 'PATCH',
      body: JSON.stringify({ currentValue }),
    }),

  toggleMilestone: (goalId: number, milestoneId: number, isDone: boolean) =>
    request<GoalView>(`/goals/${goalId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDone }),
    }),

  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/goals/${id}`, {
      method: 'DELETE',
    }),
}
