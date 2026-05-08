'use client'

import { useState, useCallback, useEffect } from 'react'

import { institucionalService } from '@/services/institucional-service'
import type {
  DepartmentRecord,
  DepartmentKind,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
} from '@/types/institucional'

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span className={`material-symbols-outlined animate-spin text-[20px] ${className}`}>sync</span>
  )
}

interface DepartmentFormData {
  slug: string
  name: string
  kind: DepartmentKind
  leader_title: string
  secretary_name: string
  secretary_photo_url: string
  description: string
  phone: string
  email: string
  address: string
  office_hours: string
  image_url: string
  mission: string
  vision: string
  values: string
}

const emptyDepartmentForm: DepartmentFormData = {
  slug: '',
  name: '',
  kind: 'secretaria',
  leader_title: 'Secretário(a)',
  secretary_name: '',
  secretary_photo_url: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  office_hours: '',
  image_url: '',
  mission: '',
  vision: '',
  values: '',
}

export default function PrefeituraDepartmentsTab() {
  const [items, setItems] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<DepartmentFormData>(emptyDepartmentForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await institucionalService.adminListDepartments()
      setItems(resp.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar secretarias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const handleEdit = (item: DepartmentRecord) => {
    setEditingId(item.id)
    setForm({
      slug: item.slug,
      name: item.name,
      kind: item.kind,
      leader_title: item.leader_title,
      secretary_name: item.secretary_name ?? '',
      secretary_photo_url: item.secretary_photo_url ?? '',
      description: item.description ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      office_hours: item.office_hours ?? '',
      image_url: item.image_url ?? '',
      mission: item.mission ?? '',
      vision: item.vision ?? '',
      values: item.values ?? '',
    })
    setShowForm(true)
    setFormError(null)
  }

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyDepartmentForm)
    setShowForm(true)
    setFormError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyDepartmentForm)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      setFormError('Slug e nome são obrigatórios.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editingId !== null) {
        const payload: DepartmentUpdatePayload = {}
        if (form.slug) payload.slug = form.slug
        if (form.name) payload.name = form.name
        payload.kind = form.kind
        payload.leader_title = form.leader_title || undefined
        payload.secretary_name = form.secretary_name || undefined
        payload.secretary_photo_url = form.secretary_photo_url || undefined
        payload.description = form.description || undefined
        payload.phone = form.phone || undefined
        payload.email = form.email || undefined
        payload.address = form.address || undefined
        payload.office_hours = form.office_hours || undefined
        payload.image_url = form.image_url || undefined
        payload.mission = form.mission || undefined
        payload.vision = form.vision || undefined
        payload.values = form.values || undefined
        await institucionalService.adminUpdateDepartment(editingId, payload)
      } else {
        const payload: DepartmentCreatePayload = {
          slug: form.slug,
          name: form.name,
          kind: form.kind,
          leader_title: form.leader_title || undefined,
          secretary_name: form.secretary_name || undefined,
          secretary_photo_url: form.secretary_photo_url || undefined,
          description: form.description || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          office_hours: form.office_hours || undefined,
          image_url: form.image_url || undefined,
          mission: form.mission || undefined,
          vision: form.vision || undefined,
          values: form.values || undefined,
        }
        await institucionalService.adminCreateDepartment(payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyDepartmentForm)
      await loadItems()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar secretaria.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta secretaria?')) return
    setDeletingId(id)
    try {
      await institucionalService.adminDeleteDepartment(id)
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir secretaria.')
    } finally {
      setDeletingId(null)
    }
  }

  const updateField = (field: keyof DepartmentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="text-primary" />
        <span className="ml-2 text-sm text-on-surface-variant">Carregando secretarias...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{items.length}</span> secretarias cadastradas
        </p>
        <button onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-dark">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nova secretaria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary">
            {editingId ? 'Editar secretaria' : 'Nova secretaria'}
          </h3>
          {formError && (
            <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{formError}</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Slug *</label>
              <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Nome *</label>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Tipo</label>
              <select value={form.kind} onChange={(e) => updateField('kind', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="secretaria">Secretaria</option>
                <option value="autarquia">Autarquia</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Título do líder</label>
              <input value={form.leader_title} onChange={(e) => updateField('leader_title', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Nome do secretário(a)</label>
              <input value={form.secretary_name} onChange={(e) => updateField('secretary_name', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Foto URL</label>
              <input value={form.secretary_photo_url} onChange={(e) => updateField('secretary_photo_url', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Telefone</label>
              <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">E-mail</label>
              <input value={form.email} onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-on-surface">Endereço</label>
              <input value={form.address} onChange={(e) => updateField('address', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Horário de atendimento</label>
              <input value={form.office_hours} onChange={(e) => updateField('office_hours', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Imagem URL</label>
              <input value={form.image_url} onChange={(e) => updateField('image_url', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-on-surface">Descrição</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={2}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Missão</label>
              <input value={form.mission} onChange={(e) => updateField('mission', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Visão</label>
              <input value={form.vision} onChange={(e) => updateField('vision', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-on-surface">Valores</label>
              <input value={form.values} onChange={(e) => updateField('values', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel}
              className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-on-primary hover:bg-primary-dark disabled:opacity-60">
              {saving ? <Spinner /> : <span className="material-symbols-outlined text-[18px]">save</span>}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-surface-container-low shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-outline-variant text-left text-label-sm text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Secretário(a)</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma secretaria cadastrada.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">/{item.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {item.kind}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{item.secretary_name ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-error-container px-3 py-1.5 text-xs text-on-error-container hover:bg-error disabled:opacity-60">
                          {deletingId === item.id ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">delete</span>}
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
