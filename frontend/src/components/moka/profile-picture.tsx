import { resolveAvatarUrl } from '@/services/moka-mock-service'
import type { WorkspaceData } from './types'

export default function ProfilePicture({
  data,
  owner,
  name,
  portrait = false,
  className = 'size-9',
}: {
  data: WorkspaceData
  owner: string
  name: string
  portrait?: boolean
  className?: string
}) {
  const url = resolveAvatarUrl(owner, data)
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-brand/7 font-serif text-brand ${portrait ? 'rounded-lg' : 'rounded-full'} ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt={`Foto profil ${name}`}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <span aria-label={`Avatar ${name}`}>{name.slice(0, 1)}</span>
      )}
    </span>
  )
}
