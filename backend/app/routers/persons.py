from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models.schemas import PersonCreate, PersonUpdate

router = APIRouter(prefix="/persons", tags=["persons"])


@router.get("/batch/{batch_id}")
async def list_persons_by_batch(batch_id: str, search: str = "", status_filter: str = "all"):
    sb = get_supabase()
    query = (
        sb.table("persons")
        .select("*, records(*)")
        .eq("batch_id", batch_id)
        .order("full_name")
    )
    if status_filter == "received":
        query = query.eq("is_complete", True)
    elif status_filter == "pending":
        query = query.eq("is_complete", False)
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,inv_number.ilike.%{search}%")
    res = query.execute()
    return res.data


@router.get("/{person_id}")
async def get_person(person_id: str):
    sb = get_supabase()
    res = (
        sb.table("persons")
        .select("*, records(*, drugs(*))")
        .eq("id", person_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Person not found")
    return res.data


@router.post("/", status_code=201)
async def create_person(data: PersonCreate):
    sb = get_supabase()
    res = sb.table("persons").insert(data.model_dump()).execute()
    return res.data[0]


@router.patch("/{person_id}")
async def update_person(person_id: str, data: PersonUpdate):
    sb = get_supabase()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    res = sb.table("persons").update(payload).eq("id", person_id).execute()
    return res.data[0]


@router.post("/{person_id}/receive")
async def mark_received(person_id: str):
    """Mark a person as having received all their drugs."""
    sb = get_supabase()
    # Ensure all records are 'ready' before marking received
    records_res = (
        sb.table("records")
        .select("status")
        .eq("person_id", person_id)
        .execute()
    )
    records = records_res.data
    if not records:
        raise HTTPException(status_code=400, detail="No drug records found")
    not_ready = [r for r in records if r["status"] != "ready"]
    if not_ready:
        raise HTTPException(
            status_code=400,
            detail=f"{len(not_ready)} drug(s) are not ready yet"
        )
    res = sb.table("persons").update({"is_complete": True}).eq("id", person_id).execute()
    return res.data[0]
