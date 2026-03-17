from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models.schemas import DrugCreate, DrugUpdate

router = APIRouter(prefix="/drugs", tags=["drugs"])


@router.get("/")
async def list_drugs(search: str = "", type_filter: str = "all"):
    sb = get_supabase()
    query = sb.table("drugs").select("*").order("ar_name")
    if type_filter == "local":
        query = query.eq("is_local", True)
    elif type_filter == "imported":
        query = query.eq("is_local", False)
    if search:
        query = query.or_(f"ar_name.ilike.%{search}%,en_name.ilike.%{search}%")
    res = query.execute()
    return res.data


@router.post("/", status_code=201)
async def create_drug(data: DrugCreate):
    sb = get_supabase()
    res = sb.table("drugs").insert(data.model_dump()).execute()
    return res.data[0]


@router.patch("/{drug_id}")
async def update_drug(drug_id: str, data: DrugUpdate):
    sb = get_supabase()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    res = sb.table("drugs").update(payload).eq("id", drug_id).execute()
    return res.data[0]


@router.delete("/{drug_id}", status_code=204)
async def delete_drug(drug_id: str):
    sb = get_supabase()
    sb.table("drugs").delete().eq("id", drug_id).execute()
