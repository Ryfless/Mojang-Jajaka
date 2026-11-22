import { uploadDocumentTypes } from './moka'

type ReviewableDocument = {
  id: string
  owner: string | { id: string }
  kind: string
  reviewStatus?: string | null
  revisionNumber?: number | null
  createdAt: string
}

export const relationID = (value: string | { id: string }) =>
  typeof value === 'object' ? value.id : value

export function currentDocuments<T extends ReviewableDocument>(documents: T[]): T[] {
  const result = new Map<string, T>()
  for (const document of documents) {
    const key = `${relationID(document.owner)}:${document.kind}`
    const previous = result.get(key)
    if (
      !previous ||
      (document.revisionNumber || 1) > (previous.revisionNumber || 1) ||
      ((document.revisionNumber || 1) === (previous.revisionNumber || 1) &&
        document.createdAt > previous.createdAt)
    )
      result.set(key, document)
  }
  return [...result.values()]
}

export function documentReviewState(documents: ReviewableDocument[]) {
  const current = currentDocuments(documents)
  const required = uploadDocumentTypes.filter((type) => type.required)
  const reviewed = required.filter((type) =>
    current.some(
      (document) => document.kind === type.key && document.reviewStatus === 'received',
    ),
  ).length
  const complete = reviewed === required.length
  return {
    reviewed,
    total: required.length,
    complete,
    allReceived: complete,
  }
}
