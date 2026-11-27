import type { MokaDocument } from '@/types/moka'
import { dateLabel, ownerID, type WorkspaceData } from './types'
import { Text } from './ui'
import { documentStatusLabels } from '@/lib/moka'

export default function ReviewMetadata({
  document,
  data,
}: {
  document: MokaDocument
  data: WorkspaceData
}) {
  const events = (data.reviewHistory || []).filter(
    (entry) =>
      ownerID(entry.owner) === ownerID(document.owner) && entry.documentKind === document.kind,
  )
  return (
    <div className="mt-4 text-[10px] leading-6 text-muted">
      {document.reviewedAt && (
        <Text>
          Diperiksa oleh {document.reviewedByName} · {dateLabel(document.reviewedAt, true)}
        </Text>
      )}
      {events.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">
            Riwayat pemeriksaan ({events.length})
          </summary>
          <ol className="mt-2 space-y-2 border-l border-line pl-3">
            {events.map((event) => (
              <li key={event.id}>
                <Text>
                  {event.action === 'document-upload'
                    ? 'Unggahan'
                    : documentStatusLabels[event.result || ''] || event.result}{' '}
                  · {event.actorName} · {dateLabel(event.recordedAt, true)}
                </Text>
                {event.note && <Text>{event.note}</Text>}
                {event.filename && <Text className="break-all">{event.filename}</Text>}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}
