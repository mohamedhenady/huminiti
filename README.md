# Huminiti Pharmacy App 💊

نظام إدارة دفعات الأدوية — تعاون بين **صيدلية السعوي** ومؤسسة **هيومنيتي**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React + Tailwind CSS |
| Backend | Python FastAPI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Password) |

## Structure

```
huminiti-1/
├── frontend/          # Next.js 14 React app (RTL Arabic UI)
│   ├── app/
│   │   ├── login/     # Login page
│   │   ├── batches/   # Batches list + detail
│   │   │   └── [id]/person/[pid]/  # Person detail
│   │   └── drugs/     # Drug dictionary (pharmacy only)
│   ├── components/layout/  # Sidebar, TopBar, AppLayout, BottomNav
│   └── lib/           # API client, Auth context
└── backend/           # FastAPI Python server
    └── app/
        ├── routers/   # auth, batches, drugs, persons, records
        ├── models/    # Pydantic schemas
        ├── config.py  # Settings from .env
        └── main.py    # App + CORS
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your Supabase service role key
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

## User Roles

| Role | Capabilities |
|---|---|
| `pharmacy` (صيدلية) | Full access: create/edit batches, manage drugs, update statuses |
| `huminiti` | Read-only: view progress and status only |

Set role via Supabase Dashboard → Authentication → Users → Edit user metadata:
```json
{ "role": "pharmacy" }
```
