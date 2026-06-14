import asyncio
import os
import httpx
import logging
from datetime import datetime
from app.database import supabase

logger = logging.getLogger("xeno-worker")

async def scheduler_worker():
    """
    Background worker that polls for scheduled campaigns and dispatches them
    when their scheduled_at time has passed.
    """
    logger.info("Scheduler worker started")
    
    channel_service_url = os.environ.get("CHANNEL_SERVICE_URL", "http://localhost:8001") + "/send"
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    callback_url = f"{backend_url}/api/campaigns/receipt"
    
    while True:
        try:
            now_str = datetime.utcnow().isoformat() + "Z"
            
            # Find campaigns that are scheduled and ready to send
            res = supabase.table("campaigns").select("*").eq("status", "scheduled").lte("scheduled_at", now_str).execute()
            campaigns = res.data or []
            
            for camp in campaigns:
                logger.info(f"Dispatching scheduled campaign: {camp['id']}")
                
                # 1. Update campaign to sending
                supabase.table("campaigns").update({"status": "sending"}).eq("id", camp["id"]).execute()
                
                # 2. Get communications
                comms_res = supabase.table("communications").select("*").eq("campaign_id", camp["id"]).execute()
                comms = comms_res.data or []
                
                if not comms:
                    supabase.table("campaigns").update({"status": "completed"}).eq("id", camp["id"]).execute()
                    continue
                    
                # 3. Update communications to sent
                # We can't bulk update easily, so we just update them one by one or leave it
                # Actually we can just update all where campaign_id = camp['id']
                supabase.table("communications").update({"status": "sent", "sent_at": now_str}).eq("campaign_id", camp["id"]).execute()
                
                # 4. Get customers to fetch phone/email (need full info for channel service)
                cust_res = supabase.table("customers").select("id, phone, email").execute()
                cust_map = {c["id"]: c for c in (cust_res.data or [])}
                
                communications_payload = []
                for comm in comms:
                    c = cust_map.get(comm["customer_id"], {})
                    communications_payload.append({
                        "communication_id": comm["id"],
                        "recipient_phone": c.get("phone"),
                        "recipient_email": c.get("email"),
                        "channel": comm["channel"],
                        "message": comm["message"]
                    })
                    
                send_payload = {
                    "communications": communications_payload,
                    "callback_url": callback_url
                }
                
                # 5. Dispatch
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(channel_service_url, json=send_payload, timeout=10.0)
                        logger.info(f"Worker dispatched {len(communications_payload)} communications for {camp['id']}")
                except Exception as e:
                    logger.error(f"Worker dispatch failed for {camp['id']}: {e}")
                    
                # 6. Update campaign to sent
                supabase.table("campaigns").update({"status": "sent", "sent_at": now_str}).eq("id", camp["id"]).execute()
                
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
            
        await asyncio.sleep(10)
