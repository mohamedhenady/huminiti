from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, batches, drugs, persons, records

app = FastAPI(
    title="Huminiti Pharmacy API",
    description="نظام إدارة دفعات الأدوية — صيدلية السعوي × هيومنيتي",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

app.include_router(auth.router, prefix="/api")
app.include_router(batches.router, prefix="/api")
app.include_router(drugs.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(records.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "message": "Huminiti Pharmacy API is running 🟢"}
