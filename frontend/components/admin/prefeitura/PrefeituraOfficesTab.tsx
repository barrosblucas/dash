'use client'

import { useState, useCallback, useEffect } from 'react'

import { institucionalService } from '@/services/institucional-service'
import type {
  DepartmentRecord,
  OfficeRecord,
  OfficeKind,
  OfficeCreatePayload,
  OfficeUpdatePayload,
} from '@/types/institucional'

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span className={`material-symbols-outlined animate-spin text-[20px] ${className}`}>sync</span>
  )
}

interface OfficeFormData {
  department_id: string
  kind: OfficeKind
  name: string
  description: string
  phone: string
  email: string
  address: string
  office_hours: string
  latitude: string
  longitude: string
}

const emptyOfficeForm: OfficeFormData = {
  department_id: '',
  kind: 'reparticao',
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  office_hours: '',
  latitude: '',
  longitude: '',
}

export default function PrefeituraOfficesTab() {
  const [items, setItems] = useState<OfficeRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<OfficeFormData>(emptyOfficeForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [officesResp, deptResp] = await Promise.all([
        institucionalService.adminListOffices(),
        institucionalService.adminListDepartments(),
      ])
      setItems(officesResp.items)
      setDepartments(deptResp.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar repartições.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const handleEdit = (item: OfficeRecord) => {
    setEditingId(item.id)
    setForm({
      department_id: item.department_id?.toString() ?? '',
      kind: item.kind,
      name: item.name,
      description: item.description ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      office_hours: item.office_hours ?? '',
      latitude: item.latitude?.toString() ?? '',
      longitude: item.longitude?.toString() ?? '',
    })
    setShowForm(true)
    setFormError(null)
  }

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyOfficeForm)
    setShowForm(true)
    setFormError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyOfficeForm)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Nome é obrigatório.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const deptId = form.department_id ? Number(form.department_id) : undefined
      const lat = form.latitude ? Number(form.latitude) : undefined
      const lng = form.longitude ? Number(form.longitude) : undefined

      if (editingId !== null) {
        const payload: OfficeUpdatePayload = {
          department_id: deptId,
          kind: form.kind,
          name: form.name || undefined,
          description: form.description || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          office_hours: form.office_hours || undefined,
          latitude: lat,
          longitude: lng,
        }
        await institucionalService.adminUpdateOffice(editingId, payload)
      } else {
        const payload: OfficeCreatePayload = {
          department_id: deptId,
          kind: form.kind,
          name: form.name,
          description: form.description || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          office_hours: form.office_hours || undefined,
          latitude: lat,
          longitude: lng,
        }
        await institucionalService.adminCreateOffice(payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyOfficeForm)
      await loadItems()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar repartição.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta repartição?')) return
    setDeletingId(id)
    try {
      await institucionalService.adminDeleteOffice(id)
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir repartição.')
    } finally {
      setDeletingId(null)
    }
  }

  const updateField = (field: keyof OfficeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="text-primary" />
        <span className="ml-2 text-sm text-on-surface-variant">Carregando repartições...</span>
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
          <span className="font-semibold text-on-surface">{items.length}</span> repartições cadastradas
        </p>
        <button onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-dark">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nova repartição
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary">
            {editingId ? 'Editar repartição' : 'Nova repartição'}
          </h3>
          {formError && (
            <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{formError}</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
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
                <option value="setor">Setor</option>
                <option value="reparticao">Repartição</option>
                <option value="gabinete">Gabinete</option>
                <option value="autarquia">Autarquia</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Secretaria vinculada</label>
              <select value={form.department_id} onChange={(e) => updateField('department_id', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— Nenhuma —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id.toString()}>{d.name}</option>
                ))}
              </select>
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
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Horário de atendimento</label>
              <input value={form.office_hours} onChange={(e) => updateField('office_hours', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-on-surface">Endereço</label>
              <input value={form.address} onChange={(e) => updateField('address', e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-on-surface">Descrição</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={2}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Latitude</label>
              <input value={form.latitude} onChange={(e) => updateField('latitude', e.target.value)} type="number" step="any"
                className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Longitude</label>
              <input value={form.longitude} onChange={(e) => updateField('longitude', e.target.value)} type="number" step="any"
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
                <th className="px-6 py-3 font-medium">Secretaria</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma repartição cadastrada.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-on-surface">{item.name}</p>
                      {item.description && <p className="text-xs text-on-surface-variant line-clamp-1">{item.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {item.kind}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{item.department_name ?? '—'}</td>
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
