'use client'

import { useState, useCallback, useEffect } from 'react'

import { institucionalService } from '@/services/institucional-service'
import type {
  CityHallRecord,
  ManagementRecord,
  ProfileUpdatePayload,
  SocialLink,
} from '@/types/institucional'

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span className={`material-symbols-outlined animate-spin text-[20px] ${className}`}>sync</span>
  )
}

export default function PrefeituraProfileTab() {
  const [, setProfile] = useState<CityHallRecord | null>(null)
  const [, setGestao] = useState<ManagementRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // form state
  const [cityHallName, setCityHallName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [officeHours, setOfficeHours] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [mayorName, setMayorName] = useState('')
  const [mayorPhotoUrl, setMayorPhotoUrl] = useState('')
  const [mayorBio, setMayorBio] = useState('')
  const [viceMayorName, setViceMayorName] = useState('')
  const [viceMayorPhotoUrl, setViceMayorPhotoUrl] = useState('')
  const [viceMayorBio, setViceMayorBio] = useState('')
  const [cabinetChiefName, setCabinetChiefName] = useState('')
  const [cabinetChiefPhotoUrl, setCabinetChiefPhotoUrl] = useState('')
  const [cabinetChiefBio, setCabinetChiefBio] = useState('')
  const [cabinetDescription, setCabinetDescription] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, g] = await Promise.all([
        institucionalService.adminGetProfile(),
        institucionalService.getManagement(),
      ])
      setProfile(p)
      setGestao(g)
      setCityHallName(p.city_hall_name)
      setDescription(p.description ?? '')
      setImageUrl(p.image_url ?? '')
      setAddress(p.contact.address ?? '')
      setPhone(p.contact.phone ?? '')
      setEmail(p.contact.email ?? '')
      setOfficeHours(p.contact.office_hours ?? '')
      setSocialLinks(p.social_links.length > 0 ? p.social_links : [{ label: '', url: '' }])
      setMayorName(g.mayor.name ?? '')
      setMayorPhotoUrl(g.mayor.photo_url ?? '')
      setMayorBio(g.mayor.bio ?? '')
      setViceMayorName(g.vice_mayor.name ?? '')
      setViceMayorPhotoUrl(g.vice_mayor.photo_url ?? '')
      setViceMayorBio(g.vice_mayor.bio ?? '')
      setCabinetChiefName(g.cabinet_chief.name ?? '')
      setCabinetChiefPhotoUrl(g.cabinet_chief.photo_url ?? '')
      setCabinetChiefBio(g.cabinet_chief.bio ?? '')
      setCabinetDescription(g.cabinet_description ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: ProfileUpdatePayload = {
        city_hall_name: cityHallName || undefined,
        description: description || undefined,
        image_url: imageUrl || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        office_hours: officeHours || undefined,
        social_links: socialLinks.every((s) => s.label && s.url)
          ? socialLinks.filter((s) => s.label && s.url)
          : undefined,
        mayor_name: mayorName || undefined,
        mayor_photo_url: mayorPhotoUrl || undefined,
        mayor_bio: mayorBio || undefined,
        vice_mayor_name: viceMayorName || undefined,
        vice_mayor_photo_url: viceMayorPhotoUrl || undefined,
        vice_mayor_bio: viceMayorBio || undefined,
        cabinet_chief_name: cabinetChiefName || undefined,
        cabinet_chief_photo_url: cabinetChiefPhotoUrl || undefined,
        cabinet_chief_bio: cabinetChiefBio || undefined,
        cabinet_description: cabinetDescription || undefined,
      }
      await institucionalService.adminUpdateProfile(payload)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  const addSocialLink = () => setSocialLinks([...socialLinks, { label: '', url: '' }])
  const removeSocialLink = (idx: number) => setSocialLinks(socialLinks.filter((_, i) => i !== idx))
  const updateSocialLink = (idx: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks]
    updated[idx] = { ...updated[idx], [field]: value }
    setSocialLinks(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="text-primary" />
        <span className="ml-2 text-sm text-on-surface-variant">Carregando perfil...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-container">
          Perfil salvo com sucesso.
        </div>
      )}

      {/* Dados gerais */}
      <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient">
        <h3 className="font-headline text-lg font-bold text-primary">Dados gerais</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Nome da Prefeitura</label>
            <input value={cityHallName} onChange={(e) => setCityHallName(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">URL da imagem</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-on-surface">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient">
        <h3 className="font-headline text-lg font-bold text-primary">Contato</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Endereço</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Horário de atendimento</label>
            <input value={officeHours} onChange={(e) => setOfficeHours(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Links sociais */}
      <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-primary">Redes sociais</h3>
          <button onClick={addSocialLink}
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[16px]">add</span> Adicionar
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {socialLinks.map((sl, idx) => (
            <div key={idx} className="flex gap-3">
              <input value={sl.label} onChange={(e) => updateSocialLink(idx, 'label', e.target.value)}
                placeholder="Rótulo (ex: Facebook)"
                className="flex-1 rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              <input value={sl.url} onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                placeholder="URL"
                className="flex-[2] rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              <button onClick={() => removeSocialLink(idx)}
                className="rounded-lg bg-surface-container p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gestão */}
      <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient">
        <h3 className="font-headline text-lg font-bold text-primary">Gestão municipal</h3>
        <div className="mt-4 space-y-6">
          {([
            { title: 'Prefeito(a)', name: mayorName, setName: setMayorName, photo: mayorPhotoUrl, setPhoto: setMayorPhotoUrl, bio: mayorBio, setBio: setMayorBio },
            { title: 'Vice-prefeito(a)', name: viceMayorName, setName: setViceMayorName, photo: viceMayorPhotoUrl, setPhoto: setViceMayorPhotoUrl, bio: viceMayorBio, setBio: setViceMayorBio },
            { title: 'Chefe de gabinete', name: cabinetChiefName, setName: setCabinetChiefName, photo: cabinetChiefPhotoUrl, setPhoto: setCabinetChiefPhotoUrl, bio: cabinetChiefBio, setBio: setCabinetChiefBio },
          ] as const).map((person) => (
            <div key={person.title}>
              <p className="text-sm font-semibold text-on-surface-variant">{person.title}</p>
              <div className="mt-2 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface">Nome</label>
                  <input value={person.name} onChange={(e) => person.setName(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface">Foto URL</label>
                  <input value={person.photo} onChange={(e) => person.setPhoto(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface">Biografia</label>
                  <input value={person.bio} onChange={(e) => person.setBio(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Descrição do gabinete</label>
            <textarea value={cabinetDescription} onChange={(e) => setCabinetDescription(e.target.value)} rows={2}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-dark disabled:opacity-60">
          {saving ? <Spinner /> : <span className="material-symbols-outlined text-[18px]">save</span>}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

