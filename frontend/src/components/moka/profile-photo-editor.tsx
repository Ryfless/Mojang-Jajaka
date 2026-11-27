import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { mokaApi, uploadMockAvatar } from '@/services/moka-mock-service'
import { Alert, Button, Input, Modal, Text } from './ui'
import type { SharedProps } from './types'
import { ownerID } from './types'

export default function ProfilePhotoEditor({
  data,
  refresh,
  notify,
}: Pick<SharedProps, 'data' | 'refresh' | 'notify'>) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setFile(null)
  }

  const custom = data.profilePhotos?.some((photo) => ownerID(photo.owner) === data.user.id)

  const save = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await uploadMockAvatar(file)
      await refresh()
      setOpen(false)
      clearSelection()
      notify('Foto profil berhasil diperbarui. Dokumen pas foto resmi tidak berubah.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true)
            setError('')
          }}
        >
          <Upload size={15} />
          Ganti foto profil
        </Button>
        {custom && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await mokaApi('avatar-reset', {}, 'participant')
                await refresh()
                notify(
                  'Foto profil kustom dihapus. Pas foto resmi digunakan kembali jika tersedia.',
                )
              } catch (e) {
                setError((e as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          >
            Gunakan pas foto default
          </Button>
        )}
      </div>
      {!open && error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <Modal
        open={open}
        onClose={() => {
          if (!busy) {
            setOpen(false)
            clearSelection()
          }
        }}
        title="Ganti foto profil"
      >
        <Text className="mb-5 text-xs leading-6 text-muted">
          Foto profil terpisah dari dokumen pas foto 4 × 6. Perubahan ini tidak mengubah dokumen
          resmi atau status pemeriksaannya. Foto ditampilkan dengan potongan portrait yang
          konsisten.
        </Text>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Pilih foto profil"
          onChange={(e) => {
            const next = e.target.files?.[0]
            setError('')
            if (preview) URL.revokeObjectURL(preview)
            if (next && !['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
              setError('Pilih gambar JPG, PNG, atau WebP.')
              setFile(null)
              setPreview('')
            } else if (next) {
              setFile(next)
              setPreview(URL.createObjectURL(next))
            } else {
              setFile(null)
              setPreview('')
            }
          }}
        />
        {preview && (
          <div className="relative mx-auto mt-5 aspect-[2/3] w-40 overflow-hidden rounded-lg border border-line">
            <img
              src={preview}
              alt="Pratinjau foto profil baru"
              className="h-full w-full object-cover object-center"
            />
          </div>
        )}
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setOpen(false)
              clearSelection()
            }}
          >
            Batal
          </Button>
          <Button disabled={!file} busy={busy} onClick={save}>
            Simpan foto profil
          </Button>
        </div>
      </Modal>
    </>
  )
}
