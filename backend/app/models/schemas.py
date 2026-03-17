from typing import Optional
from pydantic import BaseModel


# ─── Auth ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


# ─── Batches ─────────────────────────────────────────────────────────────────
class BatchCreate(BaseModel):
    name: str
    is_complete: bool = False


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    is_complete: Optional[bool] = None


# ─── Drugs ───────────────────────────────────────────────────────────────────
class DrugCreate(BaseModel):
    ar_name: str
    en_name: Optional[str] = None
    price: float
    is_local: bool = True


class DrugUpdate(BaseModel):
    ar_name: Optional[str] = None
    en_name: Optional[str] = None
    price: Optional[float] = None
    is_local: Optional[bool] = None


# ─── Persons ─────────────────────────────────────────────────────────────────
class PersonCreate(BaseModel):
    full_name: str
    ph_number: Optional[str] = None
    location: Optional[str] = None
    batch_id: str
    inv_number: Optional[str] = None


class PersonUpdate(BaseModel):
    full_name: Optional[str] = None
    ph_number: Optional[str] = None
    location: Optional[str] = None
    is_complete: Optional[bool] = None
    inv_number: Optional[str] = None


# ─── Records ─────────────────────────────────────────────────────────────────
class RecordCreate(BaseModel):
    person_id: str
    batch_id: str
    drug_id: str
    drug_name: str
    drug_price: float
    final_price: float
    status: str = "ordered"


class RecordStatusUpdate(BaseModel):
    status: str  # ordered | prepared | ready
