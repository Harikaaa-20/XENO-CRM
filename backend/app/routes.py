import csv
import io
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from app.models import ChatRequest, CampaignReceiptRequest
from app import agent, segmentation
from app.database import supabase

router = APIRouter()
logger = logging.getLogger("xeno-routes")

# ─── Agent ────────────────────────────────────────────────────────────────────

@router.post("/agent/chat")
async def chat(req: ChatRequest):
    try:
        result = await agent.run(req.message, req.session_id)
        return result
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")

# ─── Customers ────────────────────────────────────────────────────────────────

@router.get("/customers")
async def list_customers(tier: Optional[str] = None, city: Optional[str] = None, channel: Optional[str] = None, joined_last_days: Optional[int] = None, limit: int = 100):
    """
    Returns customers joined with computed order aggregates: total spend, order count, latest order date.
    """
    query = """
        SELECT c.*,
               COUNT(o.id) as order_count,
               COALESCE(SUM(o.total_amount), 0) as total_spend,
               MAX(o.ordered_at) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
    """
    conditions = []
    if tier:
        conditions.append(f"c.tier = '{tier}'")
    if city:
        conditions.append(f"c.city = '{city}'")
    if channel:
        conditions.append(f"LOWER(c.channel) = LOWER('{channel}')")
    if joined_last_days is not None:
        conditions.append(f"c.created_at >= NOW() - INTERVAL '{joined_last_days} days'")
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " GROUP BY c.id ORDER BY c.created_at DESC"
    
    if limit:
        query += f" LIMIT {limit}"
        
    try:
        res = supabase.rpc("exec_sql", {"sql": query}).execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Failed to query customers via exec_sql RPC: {e}. Falling back to simple query.")
        # Fallback to simple table query without joined order stats
        tbl_query = supabase.table("customers").select("*")
        if tier:
            tbl_query = tbl_query.eq("tier", tier)
        if city:
            tbl_query = tbl_query.eq("city", city)
        if channel:
            tbl_query = tbl_query.eq("channel", channel.lower())
        # Supabase Python client doesn't easily support dynamic date inequalities without strings
        # so joined_last_days is ignored in fallback query for simplicity
        data = tbl_query.limit(limit).execute().data or []
        # Return with zero values to maintain schema compatibility
        return [{**row, "order_count": 0, "total_spend": 0.0, "last_order_date": None} for row in data]

@router.get("/customers/{id}")
async def get_customer(id: str):
    try:
        customer_res = supabase.table("customers").select("*").eq("id", id).maybe_single().execute()
        if not customer_res.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        customer = customer_res.data
        
        orders = supabase.table("orders").select("*").eq("customer_id", id).order("ordered_at", desc=True).execute().data or []
        total_spend = 0
        for order in orders:
            items = supabase.table("order_items").select("*").eq("order_id", order["id"]).execute().data or []
            order["items"] = items
            total_spend += float(order.get("total_amount") or 0)
        return {**customer, "orders": orders, "total_spend": total_spend, "order_count": len(orders)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve customer: {str(e)}")

@router.post("/customers/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Bulk customer ingestion from a CSV file.
    Expected columns: name, email, phone, city, channel
    """
    try:
        contents = await file.read()
        string_data = contents.decode("utf-8")
        csv_file = io.StringIO(string_data)
        reader = csv.DictReader(csv_file)
        
        # Standardize fieldnames to lowercase
        if reader.fieldnames:
            reader.fieldnames = [name.strip().lower() for name in reader.fieldnames]
        else:
            raise HTTPException(status_code=400, detail="Invalid CSV format: Missing headers")
            
        inserted = 0
        skipped = 0
        errors = []
        
        # Load existing emails to avoid duplicates
        existing_res = supabase.table("customers").select("email").execute()
        existing_emails = {row["email"] for row in (existing_res.data or [])}
        
        customers_to_insert = []
        for idx, row in enumerate(reader):
            name = row.get("name", "").strip() if row.get("name") else ""
            email = row.get("email", "").strip() if row.get("email") else ""
            phone = row.get("phone", "").strip() if row.get("phone") else ""
            city = row.get("city", "").strip() if row.get("city") else ""
            channel = row.get("channel", "whatsapp").strip() if row.get("channel") else "whatsapp"
            
            if not name or not email:
                errors.append(f"Row {idx+1}: Missing required fields 'name' or 'email'.")
                skipped += 1
                continue
                
            if email in existing_emails:
                skipped += 1
                continue
                
            customers_to_insert.append({
                "name": name,
                "email": email,
                "phone": phone,
                "city": city,
                "channel": channel.lower(),
                "tier": "lapsed"  # New customer default
            })
            existing_emails.add(email) # Avoid duplicates within the uploaded batch
            
        if customers_to_insert:
            # Batch insertion in blocks of 100
            for offset in range(0, len(customers_to_insert), 100):
                supabase.table("customers").insert(customers_to_insert[offset:offset+100]).execute()
            inserted = len(customers_to_insert)
            
        return {
            "inserted": inserted,
            "skipped": skipped,
            "errors": errors
        }
    except Exception as e:
        logger.error(f"CSV Ingestion Error: {e}")
        raise HTTPException(status_code=500, detail=f"CSV upload failed: {str(e)}")

# ─── Campaigns ────────────────────────────────────────────────────────────────

@router.get("/campaigns")
async def list_campaigns():
    """
    Returns all campaigns with aggregated delivery counts.
    """
    query = """
        SELECT c.*,
               COUNT(comm.id) as total,
               COUNT(comm.id) FILTER (WHERE comm.status = 'delivered') as delivered,
               COUNT(comm.id) FILTER (WHERE comm.status = 'failed') as failed,
               COUNT(comm.id) FILTER (WHERE comm.status = 'opened') as opened,
               COUNT(comm.id) FILTER (WHERE comm.status = 'clicked') as clicked
        FROM campaigns c
        LEFT JOIN communications comm ON comm.campaign_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    """
    try:
        res = supabase.rpc("exec_sql", {"sql": query}).execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Failed to query campaigns with aggregates: {e}. Falling back to list query.")
        campaigns = supabase.table("campaigns").select("*").order("created_at", desc=True).execute().data or []
        return [{**c, "total": 0, "delivered": 0, "failed": 0, "opened": 0, "clicked": 0} for c in campaigns]

@router.get("/campaigns/{id}")
async def get_campaign(id: str):
    try:
        result = supabase.table("campaigns").select("*").eq("id", id).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign details: {str(e)}")

@router.delete("/campaigns/{id}")
async def delete_campaign(id: str):
    try:
        supabase.table("communications").delete().eq("campaign_id", id).execute()
        supabase.table("campaigns").delete().eq("id", id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign: {str(e)}")

@router.put("/campaigns/{id}/archive")
async def archive_campaign(id: str):
    try:
        supabase.table("campaigns").update({"is_archived": True}).eq("id", id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to archive: {str(e)}")

@router.put("/campaigns/{id}/unarchive")
async def unarchive_campaign(id: str):
    try:
        supabase.table("campaigns").update({"is_archived": False}).eq("id", id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unarchive: {str(e)}")

@router.get("/campaigns/{id}/stats")
async def campaign_stats(id: str):
    """
    Returns real-time aggregated stats and detail records for a campaign.
    """
    try:
        campaign_res = supabase.table("campaigns").select("*").eq("id", id).maybe_single().execute()
        if not campaign_res.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        campaign = campaign_res.data

        # Get communications list joined with customer attributes
        comms_query = f"""
            SELECT comm.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM communications comm
            JOIN customers c ON comm.customer_id = c.id
            WHERE comm.campaign_id = '{id}'
            ORDER BY comm.sent_at DESC
        """
        try:
            comms_res = supabase.rpc("exec_sql", {"sql": comms_query}).execute()
            comms = comms_res.data or []
        except Exception as e:
            logger.warning(f"Failed to fetch communication details joined: {e}. Falling back to database select.")
            comms = supabase.table("communications").select("*").eq("campaign_id", id).execute().data or []
            for comm in comms:
                comm["customer_name"] = "Unknown Customer"
                comm["customer_email"] = ""
                comm["customer_phone"] = ""

        total = len(comms)
        sent = total
        delivered = sum(1 for c in comms if c["status"] in ["delivered", "opened", "clicked"])
        failed = sum(1 for c in comms if c["status"] == "failed")
        opened = sum(1 for c in comms if c["status"] in ["opened", "clicked"])
        clicked = sum(1 for c in comms if c["status"] == "clicked")

        open_rate = round((opened / max(delivered, 1)) * 100, 1)
        click_rate = round((clicked / max(delivered, 1)) * 100, 1)
        delivery_rate = round((delivered / max(total, 1)) * 100, 1)

        return {
            "campaign_id": id,
            "name": campaign.get("name"),
            "status": campaign.get("status"),
            "channel": campaign.get("channel"),
            "message": campaign.get("message"),
            "created_at": campaign.get("created_at"),
            "sent_at": campaign.get("sent_at"),
            "total": total,
            "sent": sent,
            "delivered": delivered,
            "failed": failed,
            "opened": opened,
            "clicked": clicked,
            "open_rate": open_rate,
            "click_rate": click_rate,
            "delivery_rate": delivery_rate,
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "communications": comms
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate campaign statistics: {str(e)}")

# ─── Callback receipt from channel service ────────────────────────────────────

@router.post("/campaigns/receipt")
async def receipt(req: CampaignReceiptRequest):
    """
    Receipt callback invoked by the channel-service to record simulated deliveries.
    """
    try:
        update = {"status": req.status}
        iso_timestamp = req.timestamp.isoformat().replace('+00:00', 'Z')
        if not iso_timestamp.endswith('Z'):
            iso_timestamp += 'Z'
        
        if req.status == "delivered": 
            update["delivered_at"] = iso_timestamp
        elif req.status == "opened":    
            update["opened_at"] = iso_timestamp
        elif req.status == "clicked":   
            update["clicked_at"] = iso_timestamp
        elif req.status == "failed":
            update["failed_at"] = iso_timestamp
            update["failure_reason"] = req.failure_reason
            update["failure_type"] = req.failure_type
            update["retry_count"] = req.retry_count
        elif req.status == "retrying":
            update["failure_reason"] = req.failure_reason
            update["failure_type"] = req.failure_type
            update["retry_count"] = req.retry_count
            
        supabase.table("communications").update(update).eq("id", req.communication_id).execute()
        
        # Check if the campaign is fully processed
        comm_res = supabase.table("communications").select("campaign_id").eq("id", req.communication_id).maybe_single().execute()
        if comm_res.data:
            campaign_id = comm_res.data["campaign_id"]
            
            # If there are no more 'sent' messages (initial dispatch state), campaign is completed.
            remaining = supabase.table("communications").select("id").eq("campaign_id", campaign_id).eq("status", "sent").execute()
            if not remaining.data:
                supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
                
        return {"ok": True}
    except Exception as e:
        logger.error(f"Callback error: {e}")
        raise HTTPException(status_code=500, detail=f"Callback execution failed: {str(e)}")

# ─── Segment preview ──────────────────────────────────────────────────────────

@router.post("/segment/preview")
async def preview_segment(filters: dict):
    try:
        return segmentation.query_segment(filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview segment: {str(e)}")

# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics/overview")
async def get_analytics_overview(days: int = 30):
    try:
        comms_res = supabase.table("communications").select("*").execute()
        comms = comms_res.data or []
        
        orders_res = supabase.table("orders").select("*").execute()
        orders = orders_res.data or []
        
        if not comms:
            return {"total_revenue": "₹0", "delivery_rate": "0%", "open_rate": "0%", "conversion_rate": "0%"}
            
        total_sent = len([c for c in comms if c.get("status") != "scheduled"])
        if total_sent == 0:
             return {"total_revenue": "₹0", "delivery_rate": "0%", "open_rate": "0%", "conversion_rate": "0%"}
            
        delivered = [c for c in comms if c.get("status") in ["delivered", "opened", "clicked"]]
        opened = [c for c in comms if c.get("status") in ["opened", "clicked"]]
        
        customer_comm_time = {}
        for c in comms:
            if c.get("status") != "scheduled" and c.get("sent_at"):
                cid = c["customer_id"]
                try:
                    dt = datetime.fromisoformat(c["sent_at"].replace("Z", "+00:00"))
                    if cid not in customer_comm_time or dt < customer_comm_time[cid]:
                        customer_comm_time[cid] = dt
                except ValueError:
                    pass
                    
        attributed_revenue = 0
        converted_customers = set()
        
        for o in orders:
            cid = o["customer_id"]
            if cid in customer_comm_time:
                try:
                    o_dt = datetime.fromisoformat(o["created_at"].replace("Z", "+00:00"))
                    if o_dt >= customer_comm_time[cid]:
                        attributed_revenue += o["total_amount"]
                        converted_customers.add(cid)
                except ValueError:
                    pass
                    
        unique_delivered_customers = len(set(c["customer_id"] for c in delivered))
        
        open_rate = (len(opened) / len(delivered) * 100) if delivered else 0
        delivery_rate = (len(delivered) / total_sent * 100) if total_sent else 0
        conversion_rate = (len(converted_customers) / unique_delivered_customers * 100) if unique_delivered_customers else 0
        
        def format_currency(val):
            if val >= 1000000:
                return f"₹{val/1000000:.2f}M"
            elif val >= 1000:
                return f"₹{val/1000:.1f}k"
            return f"₹{val}"
            
        return {
            "total_revenue": format_currency(attributed_revenue),
            "delivery_rate": f"{delivery_rate:.1f}%",
            "open_rate": f"{open_rate:.1f}%",
            "conversion_rate": f"{conversion_rate:.1f}%"
        }
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
