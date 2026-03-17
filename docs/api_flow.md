# API Flow & Usage 📡

## Authentication
The application uses Supabase JWT tokens.

1. User logs in via `POST /api/auth/login`.
2. Backend returns an `access_token`.
3. Frontend stores token and includes it in `Authorization: Bearer <token>` headers for subsequent requests.

## Batch Workflow
1. **Creation**: Pharmacy creates a batch (`POST /api/batches/`).
2. **Import**: Pharmacy uploads an Excel file (`POST /api/records/import-excel/{batch_id}`).
   - Backend parses rows.
   - Creates `persons` if they don't exist.
   - Matches `drugs` by name or creates new dictionary entries.
   - Creates `records` for each drug per person.
3. **Preparation**: Pharmacy updates drug status (`PATCH /api/records/{id}/status`).
   - Statuses: `ordered` → `prepared` → `ready`.
4. **Distribution**: When all drugs for a person are `ready`, the pharmacy can mark the person as `received` (`POST /api/persons/{id}/receive`).

## Role Permissions
- **Pharmacy**: Full CRUD on all endpoints.
- **Huminiti**: `GET` (Read-only) access to monitor progress.
