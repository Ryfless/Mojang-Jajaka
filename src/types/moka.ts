export type MokaRole = 'participant' | 'committee'

export interface MokaUser {
  id: string
  name: string
  email: string
  role: MokaRole
}

export type ApplicationStatus = 'draft' | 'pending' | 'accepted' | 'rejected'

export type ApplicationCategory = 'Mojang' | 'Jajaka'

export type DocumentKind =
  | 'parentPermission'
  | 'registrationForm'
  | 'portrait'
  | 'fullBody'
  | 'closeUp'
  | 'identity'
  | 'cv'
  | 'certificate'

export type DocumentReviewStatus = 'uploaded' | 'received'

export interface ThemePreferences {
  presetId: string
  brand: string
  cocoa: string
  canvas: string
  paper: string
  accent: string
  logoUrl: string
  coverUrl: string
  eventYear: string
}

export interface Application {
  id: string
  owner: string | MokaUser
  fullName?: string | null
  phone?: string | null
  category?: ApplicationCategory | null
  birthDate?: string | null
  height?: number | null
  weight?: number | null
  education?: string | null
  address?: string | null
  district?: string | null
  eligibility?: boolean | null
  status?: ApplicationStatus | null
  reviewNote?: string | null
  winner?: boolean | null
  resultPublished?: boolean | null
  submittedAt?: string | null
  requirementsConfirmed?: boolean | null
  decidedByName?: string | null
  decidedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface MokaDocument {
  id: string
  owner: string | MokaUser
  kind: DocumentKind
  originalName?: string | null
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  url?: string | null
  reviewStatus?: DocumentReviewStatus | null
  reviewNote?: string | null
  previousVersion?: string | null
  revisionNumber?: number | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Interview {
  id: string
  participant?: string | MokaUser | null
  date: string
  location: string
  link?: string | null
  note?: string | null
  status?: 'draft' | 'published' | 'cancelled' | null
  createdAt: string
  updatedAt: string
}

export interface ProfilePhoto {
  id: string
  owner: string | MokaUser
  url: string
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  createdAt: string
  updatedAt: string
}

export interface ReviewHistory {
  id: string
  owner: string | MokaUser
  action: 'document-upload' | 'document-review' | 'administrative-decision'
  document?: string | null
  application?: string | null
  documentKind?: string | null
  revisionNumber?: number | null
  result?: string | null
  note?: string | null
  filename?: string | null
  actorName?: string | null
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export interface MokaSetting {
  id: string
  registrationNote?: string | null
  parentPermissionTemplate?: string | null
  registrationFormTemplate?: string | null
  cvTemplate?: string | null
  registrationDeadline?: string | null
  selectionReleaseAt?: string | null
  uploadNote?: string | null
  physicalNote?: string | null
  eventYear?: string | null
  theme?: ThemePreferences | null
  updatedAt?: string
}

export interface ParticipantScenario {
  id: string
  userId: string
  label: string
  shortLabel: string
  description: string
}

export interface MokaStoreState {
  users: MokaUser[]
  activeParticipantId: string
  activeRole: MokaRole
  applications: Application[]
  documents: MokaDocument[]
  interviews: Interview[]
  profilePhotos: ProfilePhoto[]
  reviewHistory: ReviewHistory[]
  settings: MokaSetting
}
