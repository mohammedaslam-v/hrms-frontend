export type FeedbackVisibility = 'employee' | 'managers_only'

export interface FeedbackRecord {
  id: number
  authorName: string | null
  body: string
  visibility: FeedbackVisibility
  givenOn: string
}
