import type {
  Application,
  Interview,
  MokaDocument,
  MokaSetting,
  ProfilePhoto,
  ReviewHistory,
} from '@/types/moka'
import type { Profile } from '@/lib/moka'

export type WorkspaceData = {
  user: { id: string; name: string; email: string; role: string }
  applications: Application[]
  documents: MokaDocument[]
  interviews: Interview[]
  settings: MokaSetting
  totalApplications: number
  serverTime?: string
  profilePhotos?: ProfilePhoto[]
  reviewHistory?: ReviewHistory[]
}

export type SharedProps = {
  data: WorkspaceData
  page: string
  navigate: (page: string) => void
  refresh: () => Promise<void>
  notify: (message: string) => void
}

export type ParticipantProps = SharedProps & {
  profile: Profile
  setProfile: (profile: Profile) => void
  onboarding?: boolean
}

export const ownerID = (owner: Application['owner']) =>
  typeof owner === 'object' ? owner.id : owner

export function dateLabel(value?: string | null, withTime = false) {
  if (!value) return 'Belum ditetapkan'
  return (
    new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' } : {}),
      timeZone: 'Asia/Jakarta',
    }) + (withTime ? ' WIB' : '')
  )
}
