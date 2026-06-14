import asyncio
import random
import logging
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import FastAPI
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("channel-service")

app = FastAPI(title="Xeno Channel Service")

# ─── Delivery simulation rates ────────────────────────────────────────────────

RATES = {
    "whatsapp": {
        "delivery": 1.0,
        "open":     0.52,   # of delivered
        "click":    0.28,   # of opened
    },
    "email": {
        "delivery": 1.0,
        "open":     0.35,
        "click":    0.18,
    },
    "sms": {
        "delivery": 1.0,
        "open":     0.12,
        "click":    0.06,
    },
}

FAILURE_REASONS = [
    "number_unreachable",
    "user_blocked",
    "invalid_number",
    "carrier_rejected",
    "account_suspended",
]

# ─── Request models ────────────────────────────────────────────────────────────

class CommunicationItem(BaseModel):
    communication_id: str
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    channel: str
    message: str

class SendRequest(BaseModel):
    communications: List[CommunicationItem]
    callback_url: str

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/send")
async def send(req: SendRequest):
    for comm in req.communications:
        asyncio.create_task(
            simulate(comm, req.callback_url)
        )
    logger.info(f"Accepted {len(req.communications)} messages for simulation")
    return {"accepted": len(req.communications), "queued": True}

# ─── Simulation logic ─────────────────────────────────────────────────────────

async def simulate(comm: CommunicationItem, callback_url: str):
    channel = comm.channel.lower()
    rates = RATES.get(channel, RATES["whatsapp"])

    # Initial delivery delay: 1–5 seconds
    await asyncio.sleep(random.uniform(1, 5))

    retry_count = 0
    while True:
        # Delivery outcome
        if random.random() > rates["delivery"]:
            reason = random.choice(FAILURE_REASONS)
            is_permanent = reason in ["invalid_number", "user_blocked", "account_suspended"]
            failure_type = "permanent" if is_permanent else "transient"
            
            if is_permanent or retry_count >= 3:
                await fire_callback(comm.communication_id, "failed", callback_url, reason, failure_type, retry_count)
                return # Give up
                
            # Transient failure, perform retry with exponential backoff
            await fire_callback(comm.communication_id, "retrying", callback_url, reason, failure_type, retry_count + 1)
            wait_time = 2 ** (retry_count + 1) # 2s, 4s, 8s
            logger.info(f"Transient failure for {comm.communication_id}. Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
            retry_count += 1
            continue
            
        else:
            await fire_callback(comm.communication_id, "delivered", callback_url)
            break

    # Open: 3–15s after delivery
    await asyncio.sleep(random.uniform(3, 15))
    if random.random() < rates["open"]:
        await fire_callback(comm.communication_id, "opened", callback_url)

        # Click: 2–8s after open
        await asyncio.sleep(random.uniform(2, 8))
        if random.random() < rates["click"]:
            await fire_callback(comm.communication_id, "clicked", callback_url)

# ─── Callback with retry ──────────────────────────────────────────────────────

async def fire_callback(
    communication_id: str,
    status: str,
    callback_url: str,
    failure_reason: Optional[str] = None,
    failure_type: Optional[str] = None,
    retry_count: int = 0,
    max_retries: int = 3,
):
    payload = {
        "communication_id": communication_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "failure_reason": failure_reason,
        "failure_type": failure_type,
        "retry_count": retry_count,
    }

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(callback_url, json=payload)
                resp.raise_for_status()
                logger.info(f"Callback OK: {communication_id} → {status}")
                return
        except Exception as e:
            wait = 2 ** attempt  # 1s, 2s, 4s
            logger.warning(f"Callback failed (attempt {attempt+1}): {e}. Retrying in {wait}s")
            await asyncio.sleep(wait)

    logger.error(f"Callback permanently failed after {max_retries} attempts: {communication_id} {status}")
