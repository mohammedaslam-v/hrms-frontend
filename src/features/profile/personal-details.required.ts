import type { ProfileView } from './profile.types'

/**
 * The personal details every employee has to supply, and how to tell whether
 * one is still missing.
 *
 * A counterpart to DOCUMENT_OPTIONS: documents gate the portal until they are
 * uploaded, and these gate it until they are filled in. Keeping the rule in one
 * list means the popup, the highlight and the card all agree about what is
 * outstanding — three copies of "is PAN set?" would eventually disagree.
 *
 * PAN and Aadhaar deliberately accept the number recorded against the uploaded
 * document as well as the one typed into the profile. Somebody who entered it
 * while uploading their PAN card has supplied it, and being asked again for
 * something already on file is how people learn to ignore a warning.
 */
export interface RequiredPersonalField {
  key: string
  label: string
  isMissing: (view: ProfileView) => boolean
}

const blank = (value: string | null | undefined): boolean =>
  !value || value.trim().length === 0

const docNumber = (view: ProfileView, key: string): string | null =>
  view.documents.find((d) => d.key === key)?.docNumber ?? null

export const REQUIRED_PERSONAL_FIELDS: RequiredPersonalField[] = [
  {
    key: 'mobile',
    label: 'Mobile number',
    isMissing: (v) => blank(v.mobile),
  },
  {
    key: 'dateOfBirth',
    label: 'Date of birth',
    isMissing: (v) => blank(v.dateOfBirth),
  },
  {
    key: 'pan',
    label: 'PAN number',
    isMissing: (v) => blank(v.panNumber) && blank(docNumber(v, 'pan')),
  },
  {
    key: 'aadhaar',
    label: 'Aadhaar number',
    isMissing: (v) => blank(v.aadharNumber) && blank(docNumber(v, 'aadhaar')),
  },
  {
    key: 'emergencyContactName',
    label: 'Emergency contact name',
    isMissing: (v) => blank(v.emergencyContactName),
  },
  {
    key: 'emergencyContactNumber',
    label: 'Emergency contact number',
    isMissing: (v) => blank(v.emergencyMobile),
  },
  {
    key: 'emergencyContactRelation',
    label: 'Relationship with emergency contact',
    isMissing: (v) => blank(v.emergencyContactRelation),
  },
]

/**
 * Only ever asked of the person themselves. A manager looking at a report sees
 * nulls because the server withholds personal details, not because they are
 * unfilled — gating on that would accuse the employee of something they have
 * already done.
 */
export function missingPersonalFields(view: ProfileView): RequiredPersonalField[] {
  if (!view.isSelf) return []
  return REQUIRED_PERSONAL_FIELDS.filter((field) => field.isMissing(view))
}
