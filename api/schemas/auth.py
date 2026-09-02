from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class DecodedToken(BaseModel):
    user_id: int
    personal_id: str
    user_name: str
    role: str  # "admin", "staff", "readonly"
    store_id: Optional[int]
    is_active: bool
    expires: datetime
