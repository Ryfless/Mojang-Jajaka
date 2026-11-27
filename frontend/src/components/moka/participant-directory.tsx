import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, List, Search, Users, X } from 'lucide-react'
import type { Application } from '@/types/moka'
import { statusLabels } from '@/lib/moka'
import { filterParticipants, type DirectoryState } from '@/lib/participant-directory'
import { Badge, Button, Empty, Input, Panel, Select, Text } from './ui'
import { ownerID, type WorkspaceData } from './types'
import ProfilePicture from './profile-picture'

const PAGE_SIZE = 10
const DIRECTORY_STATUS_KEYS = ['draft', 'pending', 'accepted', 'rejected'] as const

export default function ParticipantDirectory({
  data,
  state,
  onChange,
  onDetail,
  renderList,
}: {
  data: WorkspaceData
  state: DirectoryState
  onChange: (state: DirectoryState) => void
  onDetail: (application: Application) => void
  renderList: (items: Application[]) => ReactNode
}) {
  const filtered = filterParticipants(data, state)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(state.page, pages)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const update = (patch: Partial<DirectoryState>, reset = true) =>
    onChange({ ...state, ...patch, ...(reset ? { page: 1 } : {}) })
  const hasActiveFilter = Boolean(state.search || state.status || state.review)

  return (
    <>
      <div
        role="group"
        aria-label="Kategori peserta"
        className="mb-5 grid w-full grid-cols-2 gap-1.5 rounded-xl border border-line bg-paper p-1.5 shadow-xs"
      >
        {(['Mojang', 'Jajaka'] as const).map((category) => {
          const active = state.category === category
          return (
            <Button
              key={category}
              variant={active ? 'primary' : 'ghost'}
              aria-pressed={active}
              className={`w-full !min-h-11 !rounded-lg !text-sm !font-semibold ${
                active
                  ? '!border-brand !bg-brand !text-ivory shadow-xs'
                  : '!border-transparent !text-muted hover:!bg-canvas/70 hover:!text-ink'
              }`}
              onClick={() => update({ category })}
            >
              {category}
            </Button>
          )
        })}
      </div>

      <Panel className="!overflow-hidden !p-0">
        <div className="space-y-4 border-b border-line bg-paper px-5 pb-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Kelompok peserta" className="flex flex-wrap gap-1.5">
              {[
                ['all', 'Semua peserta'],
                ['accepted', 'Lolos administrasi'],
              ].map(([key, label]) => {
                const selected = state.group === key
                return (
                  <Button
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    variant="ghost"
                    className={`!min-h-9 !rounded-lg !px-3.5 !py-1.5 !text-xs ${
                      selected
                        ? '!bg-brand/10 !font-semibold !text-brand'
                        : '!text-muted hover:!bg-canvas/70 hover:!text-ink'
                    }`}
                    onClick={() => update({ group: key as DirectoryState['group'] })}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-line bg-canvas/60 px-3 py-1 text-[11px] font-medium text-ink">
                {filtered.length} peserta
              </span>
              <div
                role="group"
                aria-label="Tampilan peserta"
                className="inline-flex rounded-lg border border-line bg-canvas/50 p-0.5"
              >
                <Button
                  variant="ghost"
                  aria-pressed={state.mode === 'list'}
                  aria-label="Tampilan List"
                  className={`!min-h-8 !gap-1.5 !rounded-md !px-3 !py-1 !text-xs ${
                    state.mode === 'list' ? '!bg-paper !font-semibold !text-brand shadow-xs' : '!text-muted'
                  }`}
                  onClick={() => update({ mode: 'list' }, false)}
                >
                  <List size={14} />
                  List
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={state.mode === 'grid'}
                  aria-label="Tampilan Grid"
                  className={`!min-h-8 !gap-1.5 !rounded-md !px-3 !py-1 !text-xs ${
                    state.mode === 'grid' ? '!bg-paper !font-semibold !text-brand shadow-xs' : '!text-muted'
                  }`}
                  onClick={() => update({ mode: 'grid' }, false)}
                >
                  <LayoutGrid size={14} />
                  Grid
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                value={state.search}
                onChange={(e) => update({ search: e.target.value })}
                placeholder="Cari nama, email, atau ID pendaftaran..."
                aria-label="Cari peserta"
                className="!min-h-10 !bg-canvas/35 !py-2 !pl-10 !pr-9 !text-xs focus:!bg-paper"
              />
              {state.search && (
                <button
                  type="button"
                  aria-label="Bersihkan kata kunci"
                  onClick={() => update({ search: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-canvas hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:flex lg:items-center">
              {state.group === 'all' && (
                <Select
                  aria-label="Status administrasi"
                  value={state.status}
                  onChange={(e) => update({ status: e.target.value })}
                  className="!min-h-10 !bg-canvas/35 !py-2 !text-xs focus:!bg-paper lg:w-48"
                >
                  <option value="">Semua status administrasi</option>
                  {DIRECTORY_STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {statusLabels[key]}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                aria-label="Status pemeriksaan dokumen"
                value={state.review}
                onChange={(e) => update({ review: e.target.value })}
                className="!min-h-10 !bg-canvas/35 !py-2 !text-xs focus:!bg-paper lg:w-48"
              >
                <option value="">Semua pemeriksaan</option>
                <option value="unreviewed">Belum diperiksa</option>
                <option value="reviewed">Sudah diperiksa semua</option>
              </Select>
            </div>

            {hasActiveFilter && (
              <Button
                variant="secondary"
                className="!min-h-10 !shrink-0 !gap-1.5 !px-3.5 !py-2 !text-xs"
                onClick={() => update({ search: '', status: '', review: '' })}
              >
                <X size={13} />
                Reset filter
              </Button>
            )}
          </div>
        </div>

        {state.mode === 'list' ? (
          renderList(visible)
        ) : visible.length ? (
          <div className="grid grid-cols-2 gap-3.5 p-4 sm:grid-cols-3 md:gap-4 md:p-5 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((item) => (
              <Panel key={item.id} className="flex flex-col !p-3">
                <ProfilePicture
                  data={data}
                  owner={ownerID(item.owner)}
                  name={item.fullName || 'Peserta'}
                  portrait
                  className="aspect-[3/4] w-full text-2xl"
                />
                <Text as="h2" className="mt-3 truncate font-serif text-sm font-semibold">
                  {item.fullName || 'Data belum dilengkapi'}
                </Text>
                <Text className="mt-1 truncate text-[10px] text-muted">
                  ID {item.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text
                  className={`mt-1.5 text-[11px] font-medium ${item.category === 'Jajaka' ? 'text-jajaka' : 'text-brand'}`}
                >
                  {item.category || '-'}
                </Text>
                <div className="mt-2">
                  <Badge status={item.status || 'draft'}>
                    {statusLabels[item.status || 'draft']}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  className="mt-auto pt-3 !min-h-8 !justify-start !px-0 !py-1 !text-xs"
                  onClick={() => onDetail(item)}
                >
                  Detail
                  <ChevronRight size={14} />
                </Button>
              </Panel>
            ))}
          </div>
        ) : (
          <Empty
            icon={<Users size={24} />}
            title="Belum ada peserta yang sesuai"
            description="Coba ubah kata kunci atau filter pencarian."
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-[10px] text-muted">
          <Text>
            Halaman {page} dari {pages}
            {data.totalApplications > 100 ? ' · Memuat 100 pendaftaran terbaru' : ''}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="!size-8 !min-h-8 !p-0"
              aria-label="Halaman sebelumnya"
              disabled={page <= 1}
              onClick={() => update({ page: page - 1 }, false)}
            >
              <ChevronLeft size={15} />
            </Button>
            <Button
              variant="secondary"
              className="!size-8 !min-h-8 !p-0"
              aria-label="Halaman berikutnya"
              disabled={page >= pages}
              onClick={() => update({ page: page + 1 }, false)}
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </Panel>
    </>
  )
}
