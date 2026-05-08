# Prefeitura Admin Page - Implementation Report

## Changes Made

### 1. Types (`frontend/types/institucional.ts`)
- Added `ProfileUpdatePayload` - mirrors backend `ProfileUpdateRequest`
- Added `DepartmentCreatePayload` - mirrors backend `DepartmentCreateRequest`
- Added `DepartmentUpdatePayload` - mirrors backend `DepartmentUpdateRequest`
- Added `OfficeCreatePayload` - mirrors backend `OfficeCreateRequest`
- Added `OfficeUpdatePayload` - mirrors backend `OfficeUpdateRequest`
- Added `AdminPrefeituraProfile` - combined city hall + management response type

### 2. Service (`frontend/services/institucional-service.ts`)
Added admin methods:
- `adminGetProfile()` → GET `/admin/profile`
- `adminUpdateProfile(data)` → PUT `/admin/profile`
- `adminListDepartments()` → GET `/admin/secretarias`
- `adminCreateDepartment(data)` → POST `/admin/secretarias`
- `adminUpdateDepartment(id, data)` → PUT `/admin/secretarias/{id}`
- `adminDeleteDepartment(id)` → DELETE `/admin/secretarias/{id}`
- `adminListOffices()` → GET `/admin/reparticoes`
- `adminCreateOffice(data)` → POST `/admin/reparticoes`
- `adminUpdateOffice(id, data)` → PUT `/admin/reparticoes/{id}`
- `adminDeleteOffice(id)` → DELETE `/admin/reparticoes/{id}`

### 3. Admin Page (`frontend/app/admin/prefeitura/`)
- `page.tsx` - thin server component wrapper with metadata
- `prefeitura-admin-client.tsx` - main client component with 3 tabs:
  - **Perfil da Prefeitura** - edit city hall name, description, image, contact, social links, gestão (mayor/vice/cabinet)
  - **Secretarias** - CRUD table for departments (create/edit/delete)
  - **Repartições** - CRUD table for offices (create/edit/delete)

### 4. Navigation Updates
- `AdminShell.tsx` - added `{ href: '/admin/prefeitura', label: 'Prefeitura', icon: 'location_city' }` to sidebar
- `AdminHomePage.tsx` - added card for Prefeitura to dashboard

## Validation
- ✅ TypeScript (`tsc --noEmit`): passes clean
- ✅ ESLint: passes clean (no warnings, no errors)
- ✅ Next.js build: succeeds

## Files Changed
- `frontend/types/institucional.ts` (added admin payload types)
- `frontend/services/institucional-service.ts` (added admin methods)
- `frontend/components/admin/AdminShell.tsx` (added nav item)
- `frontend/components/admin/AdminHomePage.tsx` (added dashboard card)
- `frontend/app/admin/prefeitura/page.tsx` (new)
- `frontend/app/admin/prefeitura/prefeitura-admin-client.tsx` (new)

## Open Risks
- The Profile tab loads city hall and management data via two separate API calls (admin profile + public management endpoint). The management admin endpoint doesn't exist separately; the admin update endpoint accepts all fields at once.
- No file upload for images - URLs are entered manually (consistent with existing patterns).
