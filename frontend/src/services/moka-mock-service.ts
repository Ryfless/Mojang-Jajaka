import {
  COMMITTEE_USER_ID,
  DEFAULT_PARTICIPANT_ID,
  createInitialMockState,
} from '@/data/dummy-moka'
import { documentTypes, uploadDocumentTypes } from '@/lib/moka'
import { registrationIsClosed, selectionIsOpen } from '@/lib/moka-policy'
import { currentDocuments, documentReviewState, relationID } from '@/lib/moka-review'
import { DEFAULT_THEME, applyThemeToDocument, resolveTheme } from '@/lib/theme'
import type {
  Application,
  ApplicationCategory,
  ApplicationStatus,
  DocumentKind,
  Interview,
  MokaDocument,
  MokaRole,
  MokaSetting,
  MokaStoreState,
  MokaUser,
  ThemePreferences,
} from '@/types/moka'

const STORAGE_KEY = 'moka_frontend_state_v5'
const MAX_LOCALSTORAGE_FILE_BYTES = 400_000
const inMemoryFileUrls = new Map<string, string>()

function loadState(): MokaStoreState {
  if (typeof window === 'undefined') return createInitialMockState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createInitialMockState()
      saveState(initial)
      return initial
    }
    const parsed = JSON.parse(raw) as Partial<MokaStoreState>
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.applications)) {
      throw new Error('Invalid state shape')
    }
    const fallback = createInitialMockState()
    return {
      ...fallback,
      ...parsed,
      settings: {
        ...fallback.settings,
        ...(parsed.settings || {}),
        theme: resolveTheme(parsed.settings?.theme),
      },
    }
  } catch {
    const fresh = createInitialMockState()
    saveState(fresh)
    return fresh
  }
}

function saveState(state: MokaStoreState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore QuotaExceededError so in-memory state remains usable during the session.
  }
}

function makeId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

function text(value: unknown, max = 1000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function userById(state: MokaStoreState, id: string): MokaUser | undefined {
  return state.users.find((u) => u.id === id)
}

function activeParticipantUser(state: MokaStoreState): MokaUser {
  return (
    state.users.find((u) => u.id === state.activeParticipantId && u.role === 'participant') ||
    state.users.find((u) => u.id === DEFAULT_PARTICIPANT_ID) ||
    state.users.find((u) => u.role === 'participant')!
  )
}

function committeeUser(state: MokaStoreState): MokaUser {
  return (
    state.users.find((u) => u.id === COMMITTEE_USER_ID) ||
    state.users.find((u) => u.role === 'committee')!
  )
}

function expandApplicationOwner(state: MokaStoreState, app: Application): Application {
  const ownerId = relationID(app.owner)
  const user = userById(state, ownerId)
  return user ? { ...app, owner: user } : app
}

function expandInterviewParticipant(state: MokaStoreState, item: Interview): Interview {
  if (!item.participant) return item
  const pid = relationID(item.participant)
  const user = userById(state, pid)
  return user ? { ...item, participant: user } : item
}

function buildWorkspacePayload(state: MokaStoreState, roleOverride?: MokaRole) {
  const role = roleOverride || state.activeRole
  const isCommittee = role === 'committee'
  const user = isCommittee ? committeeUser(state) : activeParticipantUser(state)
  const nowISO = new Date().toISOString()

  if (isCommittee) {
    const apps = [...state.applications]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((app) => expandApplicationOwner(state, app))
    const latestDocs = currentDocuments(state.documents)
    const interviews = [...state.interviews]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => expandInterviewParticipant(state, item))

    return {
      user,
      applications: apps,
      documents: latestDocs,
      profilePhotos: state.profilePhotos,
      reviewHistory: [...state.reviewHistory].sort((a, b) =>
        b.recordedAt.localeCompare(a.recordedAt),
      ),
      interviews,
      settings: state.settings,
      totalApplications: apps.length,
      serverTime: nowISO,
    }
  }

  const ownApps = state.applications
    .filter((app) => relationID(app.owner) === user.id)
    .map((app) => {
      const { winner: _winner, ...safe } = expandApplicationOwner(state, app)
      const open = selectionIsOpen(state.settings)
      const decided = ['accepted', 'rejected'].includes(app.status || '')
      return {
        ...safe,
        ...(open && decided ? { winner: app.status === 'accepted' } : {}),
        resultPublished: open && decided,
      }
    })

  const ownDocs = currentDocuments(
    state.documents.filter((doc) => relationID(doc.owner) === user.id),
  )

  const rawApp = state.applications.find((app) => relationID(app.owner) === user.id)
  const canSeeInterview = rawApp?.status === 'accepted' && selectionIsOpen(state.settings)

  const ownInterviews = canSeeInterview
    ? state.interviews
        .filter((item) => item.status === 'published')
        .map((item) => expandInterviewParticipant(state, item))
    : []

  return {
    user,
    applications: ownApps,
    documents: ownDocs,
    profilePhotos: state.profilePhotos.filter((photo) => relationID(photo.owner) === user.id),
    reviewHistory: state.reviewHistory
      .filter((entry) => relationID(entry.owner) === user.id)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    interviews: ownInterviews,
    settings: state.settings,
    totalApplications: ownApps.length,
    serverTime: nowISO,
  }
}

export function getMockState(): MokaStoreState {
  return loadState()
}

export function getCurrentSettings(): MokaSetting {
  return loadState().settings
}

export function getParticipantUsers(): MokaUser[] {
  return loadState().users.filter((u) => u.role === 'participant')
}

export function setActiveRole(role: MokaRole): void {
  const state = loadState()
  state.activeRole = role
  saveState(state)
}

export function setActiveParticipant(userId: string): void {
  const state = loadState()
  const exists = state.users.some((u) => u.id === userId && u.role === 'participant')
  if (exists) {
    state.activeParticipantId = userId
    state.activeRole = 'participant'
    saveState(state)
  }
}

export function resetMockData(): MokaStoreState {
  for (const objectUrl of inMemoryFileUrls.values()) {
    if (objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(objectUrl)
    }
  }
  inMemoryFileUrls.clear()
  const fresh = createInitialMockState()
  saveState(fresh)
  applyThemeToDocument(fresh.settings.theme)
  return fresh
}

export function resolveDocumentUrl(doc?: Pick<MokaDocument, 'id' | 'url'> | null): string {
  if (!doc) return ''
  return inMemoryFileUrls.get(doc.id) || doc.url || ''
}

export function resolveAvatarUrl(
  ownerId: string,
  data: {
    profilePhotos?: Array<{ id: string; owner: string | MokaUser; url?: string | null }>
    documents: MokaDocument[]
  },
): string {
  const custom = data.profilePhotos?.find((photo) => relationID(photo.owner) === ownerId)
  if (custom) {
    return inMemoryFileUrls.get(custom.id) || custom.url || ''
  }
  const portrait = data.documents.find(
    (doc) => relationID(doc.owner) === ownerId && doc.kind === 'portrait',
  )
  if (portrait?.mimeType?.startsWith('image/')) {
    return resolveDocumentUrl(portrait)
  }
  return ''
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Berkas belum dapat dibaca di browser.'))
    reader.readAsDataURL(file)
  })
}

async function fileToStoredUrl(id: string, file: File): Promise<string> {
  if (file.size <= MAX_LOCALSTORAGE_FILE_BYTES) {
    return readFileAsDataUrl(file)
  }
  const objectUrl = URL.createObjectURL(file)
  inMemoryFileUrls.set(id, objectUrl)
  return objectUrl
}

async function resizeAvatarToDataUrl(file: File): Promise<string> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Foto profil harus berupa gambar yang valid.'))
      element.src = sourceUrl
    })

    const targetWidth = 360
    const targetHeight = 540
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return readFileAsDataUrl(file)

    const srcRatio = img.width / img.height
    const dstRatio = targetWidth / targetHeight
    let sx = 0
    let sy = 0
    let sw = img.width
    let sh = img.height

    if (srcRatio > dstRatio) {
      sw = img.height * dstRatio
      sx = (img.width - sw) / 2
    } else {
      sh = img.width / dstRatio
      sy = (img.height - sh) / 2
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)
    const webp = canvas.toDataURL('image/webp', 0.84)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.84)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function processBrandingImage(
  file: File,
  kind: 'logo' | 'cover',
): Promise<string> {
  if (!file.size) throw new Error('Pilih file gambar yang tidak kosong.')
  if (kind === 'logo') {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      throw new Error('Logo harus berupa gambar PNG, JPG, WebP, atau SVG.')
    }
    if (file.type === 'image/svg+xml') {
      if (file.size > 150_000) {
        throw new Error('Ukuran SVG logo maksimal 150 KB.')
      }
      return readFileAsDataUrl(file)
    }
    const sourceUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Berkas gambar logo tidak valid.'))
        el.src = sourceUrl
      })
      const maxDim = 280
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return readFileAsDataUrl(file)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    } finally {
      URL.revokeObjectURL(sourceUrl)
    }
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Gambar cover harus berupa JPG, PNG, atau WebP.')
  }
  const sourceUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Berkas gambar cover tidak valid.'))
      el.src = sourceUrl
    })
    const maxWidth = 1280
    const maxHeight = 960
    const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return readFileAsDataUrl(file)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const webp = canvas.toDataURL('image/webp', 0.82)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function uploadMockDocument(
  kind: DocumentKind,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ success: true; document: MokaDocument }> {
  if (!uploadDocumentTypes.some((type) => type.key === kind)) {
    throw new Error('Template hanya untuk diunduh dan tidak perlu diunggah kembali.')
  }
  if (!file.size) {
    throw new Error('Pilih berkas yang tidak kosong untuk diunggah.')
  }

  onProgress?.(20)
  const state = loadState()
  const user = activeParticipantUser(state)

  if (registrationIsClosed(state.settings)) {
    throw new Error(
      'Batas akhir pendaftaran telah berakhir. Pengisian dan pengiriman pendaftaran sudah dikunci.',
    )
  }

  const app = state.applications.find((item) => relationID(item.owner) === user.id)
  if (!app || app.status !== 'draft') {
    throw new Error(
      'Pendaftaran sudah dikirim. Dokumen hanya dapat ditinjau dan tidak dapat diubah.',
    )
  }

  await new Promise((resolve) => setTimeout(resolve, 90))
  onProgress?.(65)

  const docId = makeId('doc')
  const storedUrl = await fileToStoredUrl(docId, file)
  const previousDocs = state.documents.filter(
    (item) => relationID(item.owner) === user.id && item.kind === kind,
  )
  const latest = currentDocuments(previousDocs)[0]
  const revisionNumber = (latest?.revisionNumber || (latest ? 1 : 0)) + 1
  const nowISO = new Date().toISOString()
  const originalName = file.name.slice(0, 255)

  const doc: MokaDocument = {
    id: docId,
    owner: user.id,
    kind,
    originalName,
    filename: originalName,
    mimeType: file.type || 'application/octet-stream',
    filesize: file.size,
    url: storedUrl,
    reviewStatus: 'uploaded',
    reviewNote: null,
    previousVersion: latest?.id || null,
    revisionNumber,
    reviewedByName: null,
    reviewedAt: null,
    createdAt: nowISO,
    updatedAt: nowISO,
  }

  state.documents.push(doc)
  state.reviewHistory.push({
    id: makeId('rev'),
    owner: user.id,
    action: 'document-upload',
    document: doc.id,
    documentKind: kind,
    revisionNumber,
    result: 'uploaded',
    note: null,
    filename: originalName,
    actorName: user.name,
    recordedAt: nowISO,
    createdAt: nowISO,
    updatedAt: nowISO,
  })
  saveState(state)
  onProgress?.(100)
  await new Promise((resolve) => setTimeout(resolve, 60))

  return { success: true, document: doc }
}

export async function uploadMockAvatar(file: File): Promise<{ success: true }> {
  if (!file.size || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Foto profil harus berupa gambar JPG, PNG, atau WebP yang valid.')
  }
  const state = loadState()
  const user = activeParticipantUser(state)
  const dataUrl = await resizeAvatarToDataUrl(file)
  const nowISO = new Date().toISOString()

  const existingIndex = state.profilePhotos.findIndex(
    (photo) => relationID(photo.owner) === user.id,
  )
  const photoEntry = {
    id: existingIndex >= 0 ? state.profilePhotos[existingIndex].id : makeId('avatar'),
    owner: user.id,
    url: dataUrl,
    filename: `profil-${user.id}.webp`,
    mimeType: 'image/webp',
    filesize: dataUrl.length,
    createdAt: existingIndex >= 0 ? state.profilePhotos[existingIndex].createdAt : nowISO,
    updatedAt: nowISO,
  }

  if (existingIndex >= 0) {
    state.profilePhotos[existingIndex] = photoEntry
  } else {
    state.profilePhotos.push(photoEntry)
  }
  saveState(state)
  return { success: true }
}

export async function mokaApi(
  action: string,
  data?: unknown,
  roleContext?: MokaRole,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const state = loadState()
  const payload = (data ?? {}) as Record<string, unknown>

  if (action === 'session') {
    const role = roleContext || state.activeRole
    const user = role === 'committee' ? committeeUser(state) : activeParticipantUser(state)
    return { user }
  }

  if (action === 'login') {
    const email = text(payload.email, 254).toLowerCase()
    const explicitRole =
      payload.role === 'committee' || payload.role === 'participant'
        ? (payload.role as MokaRole)
        : undefined
    const wantsCommittee =
      explicitRole === 'committee' || (!explicitRole && email.includes('panitia'))

    if (wantsCommittee) {
      state.activeRole = 'committee'
      saveState(state)
      return { user: committeeUser(state) }
    }

    const matchedParticipant = email
      ? state.users.find((u) => u.role === 'participant' && u.email.toLowerCase() === email)
      : undefined
    if (matchedParticipant) {
      state.activeParticipantId = matchedParticipant.id
    }
    state.activeRole = 'participant'
    saveState(state)
    return { user: activeParticipantUser(state) }
  }

  if (action === 'signup') {
    if (registrationIsClosed(state.settings)) {
      throw new Error('Batas akhir pendaftaran telah berakhir. Pendaftaran peserta baru sudah ditutup.')
    }
    const rawName = text(payload.name, 150)
    const rawEmail = text(payload.email, 254).toLowerCase()

    if (!rawName && !rawEmail) {
      state.activeParticipantId = 'user-jajaka-2'
      state.activeRole = 'participant'
      saveState(state)
      return { user: activeParticipantUser(state) }
    }

    const existing = rawEmail
      ? state.users.find((u) => u.role === 'participant' && u.email.toLowerCase() === rawEmail)
      : undefined
    if (existing) {
      state.activeParticipantId = existing.id
      state.activeRole = 'participant'
      saveState(state)
      return { user: existing }
    }

    const newUser: MokaUser = {
      id: makeId('user'),
      name: rawName || 'Peserta Baru MOKA',
      email: rawEmail || `peserta.${Date.now().toString(36)}@contoh-moka.id`,
      role: 'participant',
    }
    state.users.push(newUser)
    state.activeParticipantId = newUser.id
    state.activeRole = 'participant'
    saveState(state)
    return { user: newUser }
  }

  if (action === 'logout') {
    return { success: true }
  }

  if (action === 'workspace') {
    if (roleContext && state.activeRole !== roleContext) {
      state.activeRole = roleContext
      saveState(state)
    }
    return buildWorkspacePayload(state, roleContext)
  }

  if (action === 'policy') {
    const workspace = buildWorkspacePayload(state, roleContext)
    return {
      settings: workspace.settings,
      profilePhotos: workspace.profilePhotos,
      serverTime: workspace.serverTime,
      ...(roleContext !== 'committee'
        ? {
            applications: workspace.applications,
            documents: workspace.documents,
            reviewHistory: workspace.reviewHistory,
          }
        : {}),
    }
  }

  if (action === 'selection-result') {
    const user = activeParticipantUser(state)
    if (!selectionIsOpen(state.settings)) {
      throw new Error('Hasil seleksi belum dibuka oleh panitia.')
    }
    const app = state.applications.find((item) => relationID(item.owner) === user.id)
    if (!app || !['accepted', 'rejected'].includes(app.status || '')) {
      throw new Error('Keputusan administrasi masih diproses oleh panitia. Silakan periksa kembali nanti.')
    }
    const passed = app.status === 'accepted'
    const interviews = passed
      ? state.interviews.filter((item) => item.status === 'published')
      : []
    return {
      winner: passed,
      name: app.fullName || user.name,
      category: app.category || 'Mojang',
      releasedAt: state.settings.selectionReleaseAt || new Date().toISOString(),
      interviews,
    }
  }

  if (action === 'avatar-reset') {
    const user = activeParticipantUser(state)
    state.profilePhotos = state.profilePhotos.filter((photo) => relationID(photo.owner) !== user.id)
    saveState(state)
    return { success: true }
  }

  if (action === 'save') {
    if (registrationIsClosed(state.settings)) {
      throw new Error(
        'Batas akhir pendaftaran telah berakhir. Pengisian dan pengiriman pendaftaran sudah dikunci.',
      )
    }
    const user = activeParticipantUser(state)
    const category = text(payload.category)
    if (category && !['Mojang', 'Jajaka'].includes(category)) {
      throw new Error('Pilih kategori Mojang atau Jajaka.')
    }
    const height = payload.height ? Number(payload.height) : null
    if (height !== null && (!Number.isFinite(height) || height <= 0 || height > 300)) {
      throw new Error('Isi tinggi badan yang valid dalam sentimeter.')
    }
    const weight = payload.weight ? Number(payload.weight) : null
    if (weight !== null && (!Number.isFinite(weight) || weight < 25 || weight > 250)) {
      throw new Error('Isi berat badan yang valid dalam kilogram (25–250 kg).')
    }
    const birthDate = text(payload.birthDate, 10)
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new Error('Tanggal lahir tidak valid.')
    }

    const existing = state.applications.find((item) => relationID(item.owner) === user.id)
    if (existing && existing.status !== 'draft') {
      throw new Error('Pendaftaran sudah dikirim dan tidak dapat diubah kembali.')
    }

    const nowISO = new Date().toISOString()
    const fields = {
      fullName: text(payload.fullName, 150),
      phone: text(payload.phone, 40),
      category: (category as ApplicationCategory) || null,
      height,
      weight,
      birthDate: birthDate || null,
      education: text(payload.education, 200),
      address: text(payload.address, 1000),
      district: text(payload.district, 150),
      eligibility: payload.eligibility === true,
    }

    if (existing) {
      Object.assign(existing, fields, { updatedAt: nowISO })
      saveState(state)
      return { success: true, application: existing }
    }

    const created: Application = {
      id: makeId('app'),
      owner: user.id,
      ...fields,
      status: 'draft',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: null,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: nowISO,
      updatedAt: nowISO,
    }
    state.applications.push(created)
    saveState(state)
    return { success: true, application: created }
  }

  if (action === 'submit') {
    if (registrationIsClosed(state.settings)) {
      throw new Error(
        'Batas akhir pendaftaran telah berakhir. Pengisian dan pengiriman pendaftaran sudah dikunci.',
      )
    }
    const user = activeParticipantUser(state)
    const app = state.applications.find((item) => relationID(item.owner) === user.id)
    if (!app || app.status !== 'draft') {
      throw new Error('Pendaftaran belum dapat dikirim atau sudah dikirim sebelumnya.')
    }
    if (
      !app.fullName ||
      !app.phone ||
      !app.category ||
      !app.birthDate ||
      !app.height ||
      !app.weight ||
      !app.address ||
      !app.district ||
      !app.education ||
      !app.eligibility
    ) {
      throw new Error('Lengkapi data diri dan checklist persyaratan sebelum mengirim.')
    }
    const latestDocs = currentDocuments(
      state.documents.filter((doc) => relationID(doc.owner) === user.id),
    )
    const missing = documentTypes.filter(
      (type) => type.required && !latestDocs.some((doc) => doc.kind === type.key),
    )
    if (missing.length) {
      throw new Error(`Berkas belum lengkap: ${missing.map((d) => d.name).join(', ')}.`)
    }

    const nowISO = new Date().toISOString()
    app.status = 'pending'
    app.submittedAt = nowISO
    app.updatedAt = nowISO
    saveState(state)
    return { success: true }
  }

  // Committee actions
  const reviewer = committeeUser(state)
  const nowISO = new Date().toISOString()

  if (action === 'settings') {
    const nextDeadline = payload.registrationDeadline
    const nextRelease = payload.selectionReleaseAt
    for (const value of [nextDeadline, nextRelease]) {
      if (
        value !== null &&
        value !== undefined &&
        (typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T/.test(value) ||
          !Number.isFinite(Date.parse(value)))
      ) {
        throw new Error(
          'Tanggal dan waktu tidak valid. Gunakan tanggal, jam, dan zona waktu yang jelas.',
        )
      }
    }

    state.settings.registrationDeadline =
      typeof nextDeadline === 'string' ? new Date(nextDeadline).toISOString() : null
    state.settings.selectionReleaseAt =
      typeof nextRelease === 'string' ? new Date(nextRelease).toISOString() : null
    state.settings.updatedAt = nowISO
    saveState(state)
    return { success: true }
  }

  if (action === 'theme-settings') {
    const nextTheme = resolveTheme({
      ...(state.settings.theme || DEFAULT_THEME),
      ...(payload as Partial<ThemePreferences>),
    })
    const registrationNote = text(payload.registrationNote, 500)
    state.settings.theme = nextTheme
    state.settings.eventYear = nextTheme.eventYear
    if (typeof payload.registrationNote === 'string') {
      state.settings.registrationNote =
        registrationNote || createInitialMockState().settings.registrationNote
    }
    state.settings.updatedAt = nowISO
    saveState(state)
    applyThemeToDocument(nextTheme)
    return { success: true, settings: state.settings }
  }

  if (action === 'theme-reset') {
    const freshSettings = createInitialMockState().settings
    state.settings.theme = { ...DEFAULT_THEME }
    state.settings.eventYear = DEFAULT_THEME.eventYear
    state.settings.registrationNote = freshSettings.registrationNote
    state.settings.updatedAt = nowISO
    saveState(state)
    applyThemeToDocument(DEFAULT_THEME)
    return { success: true, settings: state.settings }
  }

  if (action === 'review-document') {
    const docId = text(payload.id, 120)
    const status = text(payload.status, 40) || 'received'

    if (status !== 'received') {
      throw new Error('Status dokumen tidak valid.')
    }

    const doc = state.documents.find((item) => item.id === docId)
    if (!doc) throw new Error('Dokumen tidak ditemukan.')

    if (doc.reviewStatus === 'received') {
      return { success: true, alreadyReviewed: true }
    }

    doc.reviewStatus = 'received'
    doc.reviewNote = null
    doc.reviewedByName = reviewer.name
    doc.reviewedAt = nowISO
    doc.updatedAt = nowISO

    state.reviewHistory.push({
      id: makeId('rev'),
      owner: relationID(doc.owner),
      action: 'document-review',
      document: doc.id,
      documentKind: doc.kind,
      revisionNumber: doc.revisionNumber || 1,
      result: 'received',
      note: null,
      filename: doc.originalName || doc.filename || null,
      actorName: reviewer.name,
      recordedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
    })
    saveState(state)
    return { success: true }
  }

  if (action === 'review') {
    const appId = text(payload.id, 120)
    const status = text(payload.status, 40) as ApplicationStatus
    const note = text(payload.note, 4000)
    const confirmRequirements = payload.confirmRequirements === true

    if (!['accepted', 'rejected'].includes(status)) {
      throw new Error('Pilih keputusan administrasi (Lolos atau Tidak lolos).')
    }
    if (status === 'rejected' && !note) {
      throw new Error('Keputusan tidak lolos wajib disertai alasan.')
    }

    const app = state.applications.find((item) => item.id === appId)
    if (!app) throw new Error('Pendaftaran tidak ditemukan.')

    if (status === 'accepted') {
      const ownerDocs = state.documents.filter(
        (doc) => relationID(doc.owner) === relationID(app.owner),
      )
      if (!documentReviewState(ownerDocs).complete || !confirmRequirements) {
        throw new Error(
          'Semua dokumen wajib harus ditinjau terlebih dahulu dan persyaratan administrasi dikonfirmasi panitia.',
        )
      }
    }

    app.status = status
    app.reviewNote = note || null
    app.requirementsConfirmed = confirmRequirements
    app.decidedByName = reviewer.name
    app.decidedAt = nowISO
    app.updatedAt = nowISO

    state.reviewHistory.push({
      id: makeId('rev'),
      owner: relationID(app.owner),
      application: app.id,
      action: 'administrative-decision',
      result: status,
      note: note || null,
      actorName: reviewer.name,
      recordedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
    })
    saveState(state)
    return { success: true }
  }

  if (action === 'schedule') {
    const id = text(payload.id, 120)
    const date = text(payload.date, 60)
    const location = text(payload.location, 500)
    const link = text(payload.link, 2000)
    const note = text(payload.note, 4000)
    const status = payload.cancelled
      ? 'cancelled'
      : payload.published
        ? 'published'
        : 'draft'

    if (!date || Number.isNaN(Date.parse(date)) || !location) {
      throw new Error('Lengkapi tanggal, waktu, dan lokasi interview.')
    }
    if (link && !/^https?:\/\//.test(link)) {
      throw new Error('Gunakan tautan http atau https.')
    }

    const isoDate = new Date(date).toISOString()
    if (id) {
      const existing = state.interviews.find((item) => item.id === id)
      if (existing) {
        existing.participant = null
        existing.date = isoDate
        existing.location = location
        existing.link = link || null
        existing.note = note || null
        existing.status = status
        existing.updatedAt = nowISO
        saveState(state)
        return { success: true }
      }
    }

    const created: Interview = {
      id: makeId('int'),
      participant: null,
      date: isoDate,
      location,
      link: link || null,
      note: note || null,
      status,
      createdAt: nowISO,
      updatedAt: nowISO,
    }
    state.interviews.push(created)
    saveState(state)
    return { success: true }
  }

  throw new Error('Aksi tidak ditemukan.')
}
