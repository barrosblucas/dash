# Code Context: Admin Panel & Institucional Domain

## Files Retrieved
1. `frontend/components/admin/AdminShell.tsx` (214L) — Admin layout shell with sidebar nav, auth guard, theme toggle
2. `frontend/components/admin/AdminHomePage.tsx` (66L) — Admin dashboard landing page with cards and Saúde sync panel
3. `backend/features/institucional/institucional_types.py` (192L) — All Pydantic schemas for the institucional BC
4. `backend/features/institucional/institucional_handler.py` (297L) — FastAPI router with public + admin endpoints
5. `backend/api/routes/__init__.py` (27L) — Route re-exports (does NOT include institucional)
6. `frontend/app/admin/legislacao-municipal/page.tsx` (12L) — Thin server component wrapper
7. `frontend/app/prefeitura/prefeitura-client.tsx` (181L) — Public prefeitura page client component
8. `frontend/components/prefeitura/PrefeituraOfficialCard.tsx` (32L) — Official person card component
9. `frontend/components/prefeitura/PrefeituraCard.tsx` (22L) — Generic card wrapper for prefeitura sections
10. `frontend/components/prefeitura/PrefeituraPlaceholder.tsx` (17L) — Empty state placeholder
11. `frontend/types/institucional.ts` — TypeScript types mirroring backend Pydantic schemas
12. `frontend/services/institucional-service.ts` — API client for institucional endpoints
13. `frontend/components/prefeitura/index.ts` — Barrel exports for prefeitura components
14. `backend/shared/database/institucional_models.py` — SQLAlchemy ORM models (3 tables)

---

## Key Code

### 1. AdminShell.tsx — FULL CONTENT

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

const adminNavigation = [
  { href: '/admin', label: 'Painel', icon: 'shield_person' },
  { href: '/admin/users', label: 'Usuários', icon: 'group' },
  { href: '/admin/obras', label: 'Obras', icon: 'construction' },
  { href: '/admin/saude/unidades', label: 'Saúde', icon: 'local_hospital' },
  { href: '/admin/legislacoes', label: 'Legislações', icon: 'article' },
  { href: '/admin/diario-oficial', label: 'Diário Oficial', icon: 'newspaper' },
  { href: '/admin/legislacao-municipal', label: 'Legislação Municipal', icon: 'book' },
] as const;

interface AdminShellProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <div className="rounded-2xl bg-surface-container-low px-8 py-6 text-center shadow-ambient">
        <p className="font-headline text-lg font-bold text-primary">Carregando área administrativa...</p>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { initialized, session, status, setLoading, setSession, clearSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (initialized) return undefined;
    setLoading();
    authService.session().then((response) => {
      if (!active) return;
      if (response.authenticated && response.session) { setSession(response.session); return; }
      clearSession();
    }).catch(() => { if (active) clearSession(); });
    return () => { active = false; };
  }, [clearSession, initialized, setLoading, setSession]);

  useEffect(() => {
    if (initialized && status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, pathname, router, status]);

  useEffect(() => {
    if (initialized && status === 'authenticated' && session?.user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [initialized, router, session?.user.role, status]);

  const userInitials = useMemo(() => {
    const name = session?.user.name ?? 'Admin';
    return name.split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }, [session?.user.name]);

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    clearSession();
    router.replace('/login');
  };

  if (!initialized || status === 'loading' || status === 'unauthenticated' || session?.user.role !== 'admin') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-surface/90 px-4 py-4 backdrop-blur-2xl">
        <button onClick={() => setSidebarOpen(true)} className="rounded-lg bg-surface-container-low p-2.5" aria-label="Abrir menu administrativo">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <p className="font-headline font-bold text-primary">Admin</p>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-low p-6 transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* ... nav items, session info ... */}
          <nav className="space-y-2">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-72">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

### 2. AdminHomePage.tsx — FULL CONTENT

```tsx
import Link from 'next/link';
import AdminSaudeSyncPanel from './AdminSaudeSyncPanel';

const adminCards = [
  { href: '/admin/users', title: 'Gestão de usuários', description: 'Cadastre, edite acessos e execute reset de senha com rastreabilidade.', icon: 'group' },
  { href: '/admin/obras', title: 'Gestão de obras', description: 'Mantenha o catálogo público e atualize medições mensais com segurança.', icon: 'construction' },
  { href: '/admin/saude/unidades', title: 'Saúde Transparente', description: 'Gerencie unidades de saúde, horários, importação e sincronização manual.', icon: 'favorite' },
] as const;

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-ambient-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-primary-fixed-dim">Governança</p>
        <h2 className="mt-3 font-headline text-4xl font-extrabold">Painel administrativo</h2>
        <p className="mt-4 max-w-3xl text-sm text-primary-fixed-dim">Área isolada para autenticação, gestão de usuários e manutenção do cadastro de obras e saúde transparente.</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-3xl bg-surface-container-low p-7 shadow-ambient transition hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-4xl text-secondary">{card.icon}</span>
            <h3 className="mt-5 font-headline text-2xl font-bold text-primary">{card.title}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{card.description}</p>
          </Link>
        ))}
      </section>
      <section className="rounded-3xl bg-surface-container-low p-8 shadow-ambient">
        <AdminSaudeSyncPanel />
      </section>
    </div>
  );
}
```

### 3. institucional_types.py — FULL CONTENT

```python
"""Schemas Pydantic do bounded context institucional."""
from __future__ import annotations
from enum import StrEnum
from pydantic import BaseModel, Field

class DepartmentKind(StrEnum):
    SECRETARIA = "secretaria"
    AUTARQUIA = "autarquia"

class OfficeKind(StrEnum):
    SECRETARIA = "secretaria"
    SETOR = "setor"
    REPARTICAO = "reparticao"
    GABINETE = "gabinete"
    AUTARQUIA = "autarquia"

class SocialLinkItem(BaseModel):
    label: str
    url: str

class ContactInfo(BaseModel):
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    office_hours: str | None = None

class GestaoPerson(BaseModel):
    role: str
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None

# --- Public responses ---
class PrefeituraResponse(BaseModel):
    city_hall_name: str
    description: str | None = None
    image_url: str | None = None
    contact: ContactInfo
    social_links: list[SocialLinkItem] = Field(default_factory=list)
    updated_at: str

class GestaoResponse(BaseModel):
    mayor: GestaoPerson
    vice_mayor: GestaoPerson
    cabinet_chief: GestaoPerson
    cabinet_description: str | None = None
    updated_at: str

class DepartmentRecord(BaseModel):
    id: int
    slug: str
    name: str
    kind: DepartmentKind
    leader_title: str
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None
    updated_at: str

class DepartmentListResponse(BaseModel):
    items: list[DepartmentRecord]
    total: int

class OfficeRecord(BaseModel):
    id: int
    department_id: int | None = None
    department_name: str | None = None
    department_slug: str | None = None
    kind: OfficeKind
    name: str
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    updated_at: str

class OfficeListResponse(BaseModel):
    items: list[OfficeRecord]
    total: int

# --- Admin schemas ---
class ProfileUpdateRequest(BaseModel):
    city_hall_name: str | None = None
    description: str | None = None
    image_url: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    office_hours: str | None = None
    social_links: list[SocialLinkItem] | None = None
    mayor_name: str | None = None
    mayor_photo_url: str | None = None
    mayor_bio: str | None = None
    vice_mayor_name: str | None = None
    vice_mayor_photo_url: str | None = None
    vice_mayor_bio: str | None = None
    cabinet_chief_name: str | None = None
    cabinet_chief_photo_url: str | None = None
    cabinet_chief_bio: str | None = None
    cabinet_description: str | None = None

class DepartmentCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    kind: DepartmentKind = DepartmentKind.SECRETARIA
    leader_title: str = "Secretário(a)"
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None

class DepartmentUpdateRequest(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    kind: DepartmentKind | None = None
    leader_title: str | None = None
    secretary_name: str | None = None
    secretary_photo_url: str | None = None
    description: str | None = None
    mission: str | None = None
    vision: str | None = None
    values: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    image_url: str | None = None

class OfficeCreateRequest(BaseModel):
    department_id: int | None = None
    kind: OfficeKind = OfficeKind.REPARTICAO
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None

class OfficeUpdateRequest(BaseModel):
    department_id: int | None = None
    kind: OfficeKind | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    office_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
```

### 4. institucional_handler.py — FULL CONTENT

```python
"""Rotas HTTP do bounded context institucional."""
from __future__ import annotations
import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.features.institucional.institucional_data import (
    create_department, create_office, delete_department, delete_office,
    department_to_dict, get_department_by_id, get_department_by_slug,
    get_office_by_id, get_or_create_profile, list_departments, list_offices,
    office_to_dict, profile_to_gestao_dict, profile_to_prefeitura_dict,
    update_department, update_office, update_profile,
)
from backend.features.institucional.institucional_types import (...)
from backend.shared.database.connection import get_db
from backend.shared.security import require_admin_user

router = APIRouter(prefix="/institucional", tags=["institucional"])

# Public routes:
# GET  /prefeitura              -> PrefeituraResponse
# GET  /gestao                  -> GestaoResponse
# GET  /secretarias             -> DepartmentListResponse
# GET  /secretarias/{slug}      -> DepartmentRecord
# GET  /reparticoes             -> OfficeListResponse

# Admin routes (require_admin_user):
# GET    /admin/profile                -> PrefeituraResponse
# PUT    /admin/profile                -> PrefeituraResponse
# GET    /admin/secretarias            -> DepartmentListResponse
# POST   /admin/secretarias            -> DepartmentRecord (201)
# PUT    /admin/secretarias/{id}       -> DepartmentRecord
# DELETE /admin/secretarias/{id}       -> 204
# GET    /admin/reparticoes            -> OfficeListResponse
# POST   /admin/reparticoes            -> OfficeRecord (201)
# PUT    /admin/reparticoes/{id}       -> OfficeRecord
# DELETE /admin/reparticoes/{id}       -> 204
```

### 5. routes/__init__.py — FULL CONTENT

```python
"""API routes module — backward-compatible re-exports."""
from backend.features.despesa.despesa_handler import router as despesas_router
from backend.features.kpi.kpi_handler import router as kpis_router
from backend.features.licitacao.licitacao_handler import router as licitacoes_router
from backend.features.movimento_extra.movimento_extra_handler import router as movimento_extra_router
from backend.features.receita.receita_handler import router as receitas_router
from backend.features.scraping.scraping_handler import router as scraping_router

__all__ = [
    "receitas_router", "despesas_router", "kpis_router",
    "scraping_router", "movimento_extra_router", "licitacoes_router",
]
```

**IMPORTANT**: The institucional router is NOT in this file. It's registered directly in `backend/api/main.py`:
```python
# main.py line 30-31:
from backend.features.institucional.institucional_handler import router as institucional_router
# main.py line 295:
app.include_router(institucional_router, prefix="/api/v1")
```

### 6. legislacao-municipal/page.tsx — FULL CONTENT

```tsx
import type { Metadata } from 'next';
import LegislacaoMunicipalAdminClient from './legislacao-municipal-admin-client';

export const metadata: Metadata = {
  title: 'Admin | Legislação Municipal',
  description: 'Busca e download de matérias legislativas individuais do Diário Oficial MS.',
};

export default function LegislacaoMunicipalAdminPage() {
  return <LegislacaoMunicipalAdminClient />;
}
```

### 7. prefeitura-client.tsx — FULL CONTENT

```tsx
'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  PrefeituraCard, PrefeituraContactBlock, PrefeituraFeatureNav,
  PrefeituraPageHeader, PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function PrefeituraClient() {
  const { data: cityHall, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'prefeitura'],
    queryFn: () => institucionalService.getCityHall(),
  });

  // Renders:
  // - PrefeituraPageHeader (eyebrow, title, description)
  // - PrefeituraFeatureNav (nav links)
  // - Loading skeleton
  // - Error -> PrefeituraPlaceholder
  // - cityHall: hero image, description card, contact card, social links
  // - Quick nav grid: Prefeito e Vice, Gabinete, Secretarias, Repartições
  // - No data -> PrefeituraPlaceholder
}
```

### 8. PrefeituraOfficialCard.tsx — FULL CONTENT

```tsx
import type { OfficialRecord } from '@/types/institucional';

interface PrefeituraOfficialCardProps {
  official: OfficialRecord;
}

export function PrefeituraOfficialCard({ official }: PrefeituraOfficialCardProps) {
  const officialName = official.name ?? 'Aguardando atualização';
  return (
    <div className="flex flex-col items-center rounded-[28px] border border-outline/10 bg-surface-container-low p-6 text-center shadow-ambient sm:p-8">
      {official.photo_url ? (
        <img src={official.photo_url} alt={officialName} className="h-32 w-32 rounded-full object-cover ring-4 ring-primary/10 sm:h-40 sm:w-40" />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/10 sm:h-40 sm:w-40">
          <span className="material-symbols-outlined text-5xl text-primary/40">person</span>
        </div>
      )}
      <p className="mt-5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{official.role}</p>
      <h3 className="mt-3 font-headline text-xl font-bold text-primary sm:text-2xl">{officialName}</h3>
      {official.bio ? <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">{official.bio}</p> : null}
    </div>
  );
}
```

### 9. PrefeituraCard.tsx — FULL CONTENT

```tsx
import type { ReactNode } from 'react';

interface PrefeituraCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PrefeituraCard({ title, description, children, className = '' }: PrefeituraCardProps) {
  return (
    <section className={`rounded-[28px] border border-outline/10 bg-surface-container-low p-6 shadow-ambient ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="font-headline text-xl font-bold text-primary">{title}</h2>}
          {description && <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
```

### 10. PrefeituraPlaceholder.tsx — FULL CONTENT

```tsx
interface PrefeituraPlaceholderProps {
  title?: string;
  description?: string;
}

export function PrefeituraPlaceholder({
  title = 'Informações em atualização',
  description = 'Estamos organizando os dados para esta seção. Volte em breve.',
}: PrefeituraPlaceholderProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-outline/20 bg-surface-container-lowest px-5 py-10 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">info</span>
      <p className="mt-4 font-headline text-lg font-bold text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
    </div>
  );
}
```

### 11. TypeScript Types — `frontend/types/institucional.ts` — FULL CONTENT

```typescript
export interface CityHallContact {
  address: string | null; phone: string | null; email: string | null; office_hours: string | null;
}
export interface SocialLink { label: string; url: string; }
export interface CityHallRecord {
  city_hall_name: string; description: string | null; image_url: string | null;
  contact: CityHallContact; social_links: SocialLink[]; updated_at: string;
}
export interface OfficialRecord {
  role: string; name: string | null; photo_url: string | null; bio: string | null;
}
export interface ManagementRecord {
  mayor: OfficialRecord; vice_mayor: OfficialRecord; cabinet_chief: OfficialRecord;
  cabinet_description: string | null; updated_at: string;
}
export type DepartmentKind = 'secretaria' | 'autarquia';
export interface DepartmentRecord {
  id: number; slug: string; name: string; kind: DepartmentKind; leader_title: string;
  secretary_name: string | null; secretary_photo_url: string | null;
  description: string | null; mission: string | null; vision: string | null; values: string | null;
  phone: string | null; email: string | null; address: string | null; office_hours: string | null;
  image_url: string | null; updated_at: string;
}
export interface DepartmentListResponse { items: DepartmentRecord[]; total: number; }
export type OfficeKind = 'secretaria' | 'setor' | 'reparticao' | 'gabinete' | 'autarquia';
export interface OfficeRecord {
  id: number; department_id: number | null; department_name: string | null;
  department_slug: string | null; kind: OfficeKind; name: string;
  description: string | null; phone: string | null; email: string | null;
  address: string | null; office_hours: string | null;
  latitude: number | null; longitude: number | null; updated_at: string;
}
export interface OfficeListResponse { items: OfficeRecord[]; total: number; }
```

### 12. Institucional Service — `frontend/services/institucional-service.ts` — FULL CONTENT

```typescript
import { apiClient } from '@/services/api';
import type { CityHallRecord, ManagementRecord, DepartmentListResponse, DepartmentRecord, OfficeListResponse } from '@/types/institucional';

const INSTITUCIONAL_ENDPOINT = '/api/v1/institucional';

export const institucionalService = {
  getCityHall: () => apiClient.get<CityHallRecord>(`${INSTITUCIONAL_ENDPOINT}/prefeitura`),
  getManagement: () => apiClient.get<ManagementRecord>(`${INSTITUCIONAL_ENDPOINT}/gestao`),
  listDepartments: () => apiClient.get<DepartmentListResponse>(`${INSTITUCIONAL_ENDPOINT}/secretarias`),
  getDepartmentBySlug: (slug: string) => apiClient.get<DepartmentRecord>(`${INSTITUCIONAL_ENDPOINT}/secretarias/${slug}`),
  listOffices: () => apiClient.get<OfficeListResponse>(`${INSTITUCIONAL_ENDPOINT}/reparticoes`),
};
```

### 13. Prefeitura Components Barrel — `frontend/components/prefeitura/index.ts`

```typescript
export { PrefeituraPageHeader } from './PrefeituraPageHeader';
export { PrefeituraCard } from './PrefeituraCard';
export { PrefeituraContactBlock } from './PrefeituraContactBlock';
export { PrefeituraPlaceholder } from './PrefeituraPlaceholder';
export { PrefeituraOfficialCard } from './PrefeituraOfficialCard';
export { default as PrefeituraFeatureNav } from './PrefeituraFeatureNav';
```

### 14. ORM Models — `backend/shared/database/institucional_models.py` — 3 Tables

- **`institucional_profile`** — Singleton row: city_hall_name, description, image_url, contact fields, mayor/vice/cabinet_chief fields, social_links_json
- **`institucional_departments`** — Secretarias/Autarquias: slug (unique), name, kind, leader_title, secretary fields, description/mission/vision/values, contact, image_url
- **`institucional_offices`** — Repartições/Setores/Gabinetes: FK to departments (nullable), kind, name, contact, lat/lng

---

## Architecture

### Backend — Institucional Bounded Context

```
backend/
├── features/institucional/
│   ├── institucional_types.py      # Pydantic schemas (16 models)
│   ├── institucional_handler.py    # FastAPI router (15 endpoints)
│   ├── institucional_data.py       # Data access layer (SQLAlchemy queries)
│   └── institucional_bootstrap.py  # Idempotent seed data
├── shared/database/
│   └── institucional_models.py     # 3 ORM models
└── api/
    └── main.py                     # Registers institucional_router at /api/v1
```

**Route registration**: The institucional router is NOT in `backend/api/routes/__init__.py`. It's registered directly in `backend/api/main.py` line 295:
```python
app.include_router(institucional_router, prefix="/api/v1")
```
The handler defines `router = APIRouter(prefix="/institucional")`, so full paths are `/api/v1/institucional/...`.

**Auth**: Admin routes use `require_admin_user` dependency. Public routes have no auth.

**Bootstrap**: `institucional_bootstrap.bootstrap_institucional(session)` runs at app startup in `main.py` lines 147-151.

### Frontend — Admin Panel

```
frontend/
├── app/admin/
│   ├── layout.tsx                  # Uses AdminShell wrapper
│   ├── page.tsx                    # AdminHomePage
│   ├── users/                      # User management
│   ├── obras/                      # Works management
│   ├── saude/unidades/             # Health units
│   ├── legislacoes/                # Legislation
│   ├── diario-oficial/             # Official gazette
│   └── legislacao-municipal/       # Municipal legislation (thin server wrapper)
├── components/admin/
│   ├── AdminShell.tsx              # Layout: sidebar + auth guard + theme
│   ├── AdminHomePage.tsx           # Dashboard cards + Saúde sync panel
│   └── AdminSaudeSyncPanel.tsx     # Saúde data sync monitor
└── stores/
    ├── authStore.ts                # Zustand: session/status/role
    └── themeStore.ts               # Zustand: dark/light toggle
```

**Admin navigation** (7 items in AdminShell):
- Painel (`/admin`), Usuários (`/admin/users`), Obras (`/admin/obras`), Saúde (`/admin/saude/unidades`), Legislações (`/admin/legislacoes`), Diário Oficial (`/admin/diario-oficial`), Legislação Municipal (`/admin/legislacao-municipal`)

**Auth flow**: AdminShell checks `useAuthStore` → if not initialized, calls `authService.session()` → if unauthenticated redirects to `/login?next=...` → if authenticated but not admin, redirects to `/dashboard`.

### Frontend — Prefeitura (Public)

```
frontend/
├── app/prefeitura/
│   ├── page.tsx                    # Server component
│   ├── prefeitura-client.tsx       # Client: React Query fetch + render
│   ├── prefeito-e-vice/            # Management subpage
│   ├── gabinete/                   # Cabinet subpage
│   ├── secretarias/                # Departments subpage
│   └── reparticoes/                # Offices subpage
├── components/prefeitura/
│   ├── index.ts                    # Barrel exports (6 components)
│   ├── PrefeituraPageHeader.tsx    # Section header
│   ├── PrefeituraCard.tsx          # Generic card wrapper
│   ├── PrefeituraContactBlock.tsx  # Contact info display
│   ├── PrefeituraFeatureNav.tsx    # Feature navigation
│   ├── PrefeituraOfficialCard.tsx  # Person card (photo, role, name, bio)
│   └── PrefeituraPlaceholder.tsx   # Empty state
├── types/institucional.ts          # TypeScript types mirroring backend
└── services/institucional-service.ts  # API client (5 methods)
```

**Data flow**: `institucionalService` → `apiClient.get()` → `/api/v1/institucional/...` → `institucional_handler.py` → `institucional_data.py` → SQLAlchemy → SQLite

**Key observation**: The frontend service does NOT have admin methods yet (no create/update/delete calls for departments, offices, or profile). Only read operations are implemented.

---

## Start Here

**To add admin CRUD UI for institucional**: Start with `frontend/app/admin/legislacao-municipal/page.tsx` as the pattern for admin pages (thin server wrapper + client component). Then add admin API methods to `frontend/services/institucional-service.ts` (currently missing all admin endpoints). The backend admin endpoints already exist in `institucional_handler.py` (lines 127-297).

**Key gap**: `backend/api/routes/__init__.py` does NOT export the institucional router — it's registered separately in `main.py`. This is intentional but inconsistent with other feature routers.

**Admin nav**: To add a new admin page for "Prefeitura" (institutional profile CRUD), add an entry to `adminNavigation` array in `AdminShell.tsx` (line 11) and create the page under `frontend/app/admin/`.