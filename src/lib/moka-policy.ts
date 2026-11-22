export type MokaPolicy = {
  registrationDeadline?: string | null
  selectionReleaseAt?: string | null
}

export function registrationIsClosed(settings: MokaPolicy, now = Date.now()) {
  const deadline = settings.registrationDeadline ? Date.parse(settings.registrationDeadline) : NaN
  return Number.isFinite(deadline) && now >= deadline
}

export function selectionIsOpen(settings: MokaPolicy, now = Date.now()) {
  const release = settings.selectionReleaseAt ? Date.parse(settings.selectionReleaseAt) : NaN
  return Number.isFinite(release) && now >= release
}

export function toWIBInput(value?: string | null) {
  return value ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16) : ''
}

export function fromWIBInput(value: string) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : null
}
