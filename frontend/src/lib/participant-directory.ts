import { documentReviewState } from '@/lib/moka-review'
import type { WorkspaceData } from '@/components/moka/types'
import { ownerID } from '@/components/moka/types'

export type DirectoryState = {
  group: 'all' | 'accepted'
  category: 'Mojang' | 'Jajaka'
  search: string
  status: string
  review: string
  mode: 'list' | 'grid'
  page: number
}

export const initialDirectoryState: DirectoryState = {
  group: 'all',
  category: 'Mojang',
  search: '',
  status: '',
  review: '',
  mode: 'list',
  page: 1,
}

export function filterParticipants(data: WorkspaceData, state: DirectoryState) {
  return data.applications.filter((item) => {
    const query = state.search.trim().toLowerCase()
    const email = typeof item.owner === 'object' ? item.owner.email : ''
    const review = documentReviewState(
      data.documents.filter((document) => ownerID(document.owner) === ownerID(item.owner)),
    )
    const status = state.group === 'accepted' ? 'accepted' : state.status
    return (
      item.category === state.category &&
      (!status || item.status === status) &&
      (!query || `${item.fullName || ''} ${email} ${item.id}`.toLowerCase().includes(query)) &&
      (!state.review || (state.review === 'reviewed' ? review.complete : !review.complete))
    )
  })
}
