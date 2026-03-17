from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.models.schemas import BatchCreate, BatchUpdate

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("/")
async def list_batches():
    sb = get_supabase()
    res = sb.table("batches").select("*").order("created_at", desc=True).execute()
    return res.data


@router.get("/{batch_id}")
async def get_batch(batch_id: str):
    sb = get_supabase()
    res = sb.table("batches").select("*").eq("id", batch_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Batch not found")
    return res.data


@router.post("/", status_code=201)
async def create_batch(data: BatchCreate):
    sb = get_supabase()
    res = sb.table("batches").insert(data.model_dump()).execute()
    return res.data[0]


@router.patch("/{batch_id}")
async def update_batch(batch_id: str, data: BatchUpdate):
    sb = get_supabase()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    res = sb.table("batches").update(payload).eq("id", batch_id).execute()
    return res.data[0]


@router.delete("/{batch_id}", status_code=204)
async def delete_batch(batch_id: str):
    sb = get_supabase()
    sb.table("batches").delete().eq("id", batch_id).execute()
