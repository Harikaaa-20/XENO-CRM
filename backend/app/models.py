from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    reply: str
    actions: List[dict]
    session_id: str


class CampaignReceiptRequest(BaseModel):
    communication_id: str
    status: str
    timestamp: datetime
    failure_reason: Optional[str] = None
    failure_type: Optional[str] = None
    retry_count: Optional[int] = 0


class SegmentFilter(BaseModel):
    inactive_days: Optional[int] = None
    active_days: Optional[int] = None
    min_spend: Optional[float] = None
    max_spend: Optional[float] = None
    min_orders: Optional[int] = None
    max_orders: Optional[int] = None
    city: Optional[str] = None
    tier: Optional[str] = None
    channel: Optional[str] = None
    min_avg_order: Optional[float] = None
    product: Optional[str] = None
    joined_last_days: Optional[int] = None
    never_bought_product: Optional[str] = None
    min_total_items: Optional[int] = None
    single_order_value_over: Optional[float] = None
    email_domain: Optional[str] = None
