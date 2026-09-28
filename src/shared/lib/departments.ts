/**
 * Department accent colours, from the approved design.
 *
 * One definition because three screens draw the same dot: My page, the team
 * directory and the dashboard. Three copies drift, and a department that is
 * violet on one page and grey on another reads as two different things.
 */
export const DEPT_COLOR: Record<string, string> = {
  Leadership: '#6C5CE7',
  Sales: '#3777FF',
  Marketing: '#E8613A',
  Curriculum: '#F4A93A',
  Tech: '#8B2E2E',
  Operations: '#159A9C',
  People: '#34C77B',
}

/** The colour for a department, or a neutral for one that is unset or unknown. */
export const deptColor = (department: string | null | undefined): string =>
  (department && DEPT_COLOR[department]) || 'var(--muted2)'
