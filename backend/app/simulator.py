import asyncio
import random
import logging
from datetime import datetime
from typing import Optional
from app.database import supabase

logger = logging.getLogger("simulator")

RATES = {
    "whatsapp": {"delivery": 1.0, "open": 0.52, "click": 0.28},
    "email":    {"delivery": 1.0, "open": 0.35, "click": 0.18},
    "sms":      {"delivery": 1.0, "open": 0.12, "click": 0.06},
}

FAILURE_REASONS = [
    "number_unreachable", "user_blocked", "invalid_number", "carrier_rejected", "account_suspended"
]

def update_status(comm_id: str, status: str, campaign_id: str, failure_reason: Optional[str] = None):
    try:
        now_str = datetime.utcnow().isoformat() + "Z"
        update_data = {"status": status}
        if status == "delivered": update_data["delivered_at"] = now_str
        elif status == "opened": update_data["opened_at"] = now_str
        elif status == "clicked": update_data["clicked_at"] = now_str
        elif status == "failed": 
            update_data["failed_at"] = now_str
            update_data["failure_reason"] = failure_reason
            
        supabase.table("communications").update(update_data).eq("id", comm_id).execute()
        
        # Check if campaign is completed
        remaining = supabase.table("communications").select("id").eq("campaign_id", campaign_id).eq("status", "sent").execute()
        if not remaining.data:
            supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
            
    except Exception as e:
        logger.error(f"Failed to update comm {comm_id}: {e}")

async def simulate_communication(comm_id: str, channel: str, campaign_id: str):
    channel = channel.lower()
    rates = RATES.get(channel, RATES["whatsapp"])
    
    # 1-5 seconds to deliver
    await asyncio.sleep(random.uniform(1, 5))
    
    if random.random() > rates["delivery"]:
        reason = random.choice(FAILURE_REASONS)
        update_status(comm_id, "failed", campaign_id, failure_reason=reason)
        return
        
    update_status(comm_id, "delivered", campaign_id)
    
    # 3-15 seconds to open
    await asyncio.sleep(random.uniform(3, 15))
    if random.random() < rates["open"]:
        update_status(comm_id, "opened", campaign_id)
        
        # 2-8 seconds to click
        await asyncio.sleep(random.uniform(2, 8))
        if random.random() < rates["click"]:
            update_status(comm_id, "clicked", campaign_id)
