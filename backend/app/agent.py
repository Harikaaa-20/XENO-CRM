import os
import json
import uuid
import httpx
import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel

from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferMemory
from langchain.tools import tool
from langchain.callbacks.base import BaseCallbackHandler

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("xeno-agent")

# Set up API Keys
API_KEY = os.getenv("GROQ_API_KEY", "")

# Memory management: session_id -> ConversationBufferMemory
sessions: Dict[str, ConversationBufferMemory] = {}

def get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in sessions:
        sessions[session_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    return sessions[session_id]

# ─── Tools definitions ────────────────────────────────────────────────────────

class SearchSegmentInput(BaseModel):
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

@tool(args_schema=SearchSegmentInput)
def search_segment(**filters) -> str:
    """
    Find customers matching given filters.
    Returns: count, avg_spend, channel breakdown, sample names
    """
    from app import segmentation
    try:
        parsed = {k: v for k, v in filters.items() if v is not None}
    except Exception as e:
        return json.dumps({"error": f"Invalid format for filters input: {str(e)}"})
    
    result = segmentation.query_segment(parsed)
    return json.dumps(result)

class DraftMessageInput(BaseModel):
    channel: Optional[str] = "whatsapp"
    brand: Optional[str] = "Brew & Co"
    segment_summary: Optional[str] = "our customers"
    tone: Optional[str] = "warm"
    instructions: Optional[str] = "Write a compelling marketing campaign."

@tool(args_schema=DraftMessageInput)
def draft_message(**kwargs) -> str:
    """
    Draft a marketing message based on specific instructions from the user.
    """
    channel = kwargs.get("channel", "whatsapp")
    brand = kwargs.get("brand", "Brew & Co")
    segment_summary = kwargs.get("segment_summary", "our customers")
    tone = kwargs.get("tone", "warm")
    instructions = kwargs.get("instructions", "Write a compelling marketing campaign.")

    prompt_text = f"""You are an elite copywriter for {brand}, a premium consumer brand.
Write a multi-channel marketing campaign targeting this audience: {segment_summary}.
Campaign Objective & Instructions: {instructions}
Tone: {tone}, engaging, and highly professional.

CRITICAL INSTRUCTION: You MUST use the exact tag [Customer Name] in every single message so the system can dynamically personalize it.
You MUST follow the Campaign Objective & Instructions exactly. Provide creative, high-quality copy.

Please write 3 distinct versions of the message:
1. WhatsApp: 2-3 short sentences, conversational, warm, include 1-2 emojis, no markdown.
2. Email: Catchy Subject line + engaging Body text (2 short paragraphs). Make it feel personal and premium.
3. SMS: max 160 chars, punchy, urgent, include a clear short CTA link.

Return ONLY a valid JSON object with the exact keys: "whatsapp", "email", and "sms". Do not wrap it in markdown block quotes."""
    
    try:
        temp_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7, api_key=API_KEY)
        res = temp_llm.invoke(prompt_text)
        
        content = res.content.strip()
        
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            content = json_match.group(0)

        content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', content)
            
        parsed = json.loads(content)
        return json.dumps(parsed)
    except Exception as e:
        return json.dumps({"error": f"Error drafting message: {str(e)}", "raw_output": content if 'content' in locals() else ""})


class SendCampaignInput(BaseModel):
    name: Optional[str] = "Campaign"
    segment_rule: Optional[dict] = None
    message: Optional[typing.Any] = ""
    channel: Optional[str] = "whatsapp"
    scheduled_at: Optional[str] = None

import typing

@tool(args_schema=SendCampaignInput)
def send_campaign(**kwargs) -> str:
    """
    Send a campaign to a segment.
    """
    from app.database import supabase
    from app.segmentation import build_segment_query

    name = kwargs.get("name", "Campaign")
    segment_rule = kwargs.get("segment_rule") or {}
    message = kwargs.get("message", "")
    channel = kwargs.get("channel", "whatsapp")
    scheduled_at = kwargs.get("scheduled_at")
    
    campaign_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat() + "Z"
    is_scheduled = bool(scheduled_at)
    
    # 1. Insert Campaign into DB
    campaign_row = {
        "id": campaign_id,
        "name": name,
        "segment_rule": segment_rule,
        "message": message,
        "channel": "mixed", # Channel is now mixed across customers
        "status": "scheduled" if is_scheduled else "sending",
        "created_at": now_str,
        "sent_at": None if is_scheduled else now_str,
        "scheduled_at": scheduled_at
    }
    
    try:
        supabase.table("campaigns").insert(campaign_row).execute()
    except Exception as e:
        return json.dumps({"error": f"Failed to insert campaign: {str(e)}"})
        
    # 2. Query target customers matching the segment rules
    sql_query = build_segment_query(segment_rule)
    try:
        cust_res = supabase.rpc("exec_sql", {"sql": sql_query}).execute()
        customers = cust_res.data or []
    except Exception as e:
        supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return json.dumps({"error": f"Failed to query customer segment: {str(e)}"})
        
    if not customers:
        supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
        return json.dumps({
            "campaign_id": campaign_id,
            "count": 0,
            "message": "No customers found matching segment rule"
        })
        
    # 3. Create communications
    comms_to_insert = []
    for c in customers:
        # determine channel based on preference
        pref_channel = c.get("channel") or "whatsapp"
        
        # extract specific message for that channel
        if isinstance(message, dict):
            final_message = message.get(pref_channel, message.get("whatsapp", str(message)))
        elif isinstance(message, str):
            try:
                parsed_msg = json.loads(message)
                final_message = parsed_msg.get(pref_channel, parsed_msg.get("whatsapp", message))
            except Exception:
                final_message = message
        else:
            final_message = str(message)
            
        comm_id = str(uuid.uuid4())
        first_name = c.get("name", "").split()[0] if c.get("name") else "there"
        personalized_message = final_message.replace("[Customer Name]", first_name)
        cust_channel = pref_channel

        comms_to_insert.append({
            "id": comm_id,
            "campaign_id": campaign_id,
            "customer_id": c["id"],
            "channel": cust_channel,
            "message": personalized_message,
            "status": "scheduled" if is_scheduled else "sent",
            "sent_at": None if is_scheduled else now_str
        })
        
    try:
        # Batch insert communications in chunks of 100
        for offset in range(0, len(comms_to_insert), 100):
            supabase.table("communications").insert(comms_to_insert[offset:offset+100]).execute()
    except Exception as e:
        supabase.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return json.dumps({"error": f"Failed to create communication entries: {str(e)}"})
        
    if not is_scheduled:
        # 4. Update campaign status to 'sent'
        try:
            supabase.table("campaigns").update({"status": "sent"}).eq("id", campaign_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update campaign status to sent: {e}")
            
        # 5. Dispatch simulation internally to avoid missing channel-service deployments
        from app.simulator import simulate_communication
        
        def start_simulation():
            try:
                loop = asyncio.get_running_loop()
                for comm in comms_to_insert:
                    loop.create_task(simulate_communication(comm["id"], comm["channel"], campaign_id))
            except RuntimeError:
                import threading
                def run_sim():
                    async def sim_all():
                        tasks = [simulate_communication(c["id"], c["channel"], campaign_id) for c in comms_to_insert]
                        await asyncio.gather(*tasks)
                    asyncio.run(sim_all())
                threading.Thread(target=run_sim, daemon=True).start()
                
        start_simulation()
        
    return json.dumps({
        "campaign_id": campaign_id,
        "count": len(customers)
    })

@tool
def get_campaign_stats(campaign_id: str = "") -> str:
    """Retrieves real-time analytics for a specific campaign ID. If no campaign ID is known, pass an empty string to get the most recent campaign's stats."""
    from app.database import supabase
    import re
    
    # Check if campaign_id is a valid UUID
    is_valid_uuid = bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', str(campaign_id).lower()))
    
    if not is_valid_uuid:
        # Fetch the most recent campaign ID
        res = supabase.table("campaigns").select("id").order("created_at", desc=True).limit(1).execute()
        if not res.data:
            return json.dumps({"error": "No campaigns found in the database."})
        campaign_id = res.data[0]["id"]

    try:
        res = supabase.table("communications").select("status").eq("campaign_id", campaign_id).execute()
        comms = res.data or []
        
        total = len(comms)
        if total == 0:
            return json.dumps({"error": f"No communications found for campaign {campaign_id}"})
            
        delivered = sum(1 for c in comms if c["status"] in ["delivered", "opened", "clicked"])
        opened = sum(1 for c in comms if c["status"] in ["opened", "clicked"])
        clicked = sum(1 for c in comms if c["status"] == "clicked")
        failed = sum(1 for c in comms if c["status"] == "failed")
        
        return json.dumps({
            "campaign_id": campaign_id,
            "total_sent": total,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "failed": failed,
            "open_rate_percent": round((opened / delivered * 100) if delivered > 0 else 0, 1),
            "click_rate_percent": round((clicked / delivered * 100) if delivered > 0 else 0, 1)
        })
    except Exception as e:
        return json.dumps({"error": f"Failed to retrieve stats from database: {str(e)}"})

@tool
def get_brand_health_reviews() -> str:
    """
    Get the latest customer feedback, sentiment, and pain points from App Store, Play Store, and Twitter reviews.
    Returns: JSON string containing recent customer reviews.
    """
    reviews = [
        {"source": "App Store", "rating": 5, "content": "Absolutely love the new cold brew options! The app is super fast and ordering ahead is a breeze."},
        {"source": "Play Store", "rating": 2, "content": "The app crashed right when I was trying to apply my loyalty discount at checkout. Very frustrating."},
        {"source": "App Store", "rating": 4, "content": "Great coffee as always. Really wish you guys would bring back the summer cold brew blend though!"},
        {"source": "Twitter", "rating": 3, "content": "Love the physical stores but the mobile app sometimes doesn't show my updated points balance immediately."},
        {"source": "Play Store", "rating": 5, "content": "Best espresso blend in the city. Delivery was on time and packaging was perfect."},
        {"source": "App Store", "rating": 2, "content": "Why did you remove the option to customize the sugar level for the iced lattes? Please bring it back."}
    ]
    return json.dumps(reviews)

@tool
def get_customer_insights() -> str:
    """
    Get customer insights like top 10 by spend, count by city/channel, new customers this month.
    """
    from app.database import supabase
    
    try:
        sql = "SELECT c.name, SUM(o.total_amount) as spend FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY spend DESC LIMIT 10"
        res = supabase.rpc("exec_sql", {"sql": sql}).execute()
        top_spenders = res.data or []
        
        sql = "SELECT city, COUNT(*) as count FROM customers GROUP BY city ORDER BY count DESC"
        res = supabase.rpc("exec_sql", {"sql": sql}).execute()
        cities = res.data or []
        
        sql = "SELECT channel, COUNT(*) as count FROM customers GROUP BY channel ORDER BY count DESC"
        res = supabase.rpc("exec_sql", {"sql": sql}).execute()
        channels = res.data or []
        
        sql = "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM customers GROUP BY month ORDER BY month DESC LIMIT 2"
        res = supabase.rpc("exec_sql", {"sql": sql}).execute()
        new_custs = res.data or []

        return json.dumps({
            "top_10_spenders": top_spenders,
            "count_by_city": cities,
            "count_by_channel": channels,
            "new_customers_by_month": new_custs,
            "summary": "Customer insights generated successfully. Present this data in a conversational format."
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_revenue_insights() -> str:
    """
    Get revenue insights including this month vs last month, MOM change, top 5 cities by revenue, and average order value.
    """
    from app.database import supabase
    
    try:
        sql_this_month = "SELECT SUM(total_amount) as rev FROM orders WHERE ordered_at >= date_trunc('month', CURRENT_DATE)"
        res_tm = supabase.rpc("exec_sql", {"sql": sql_this_month}).execute()
        rev_this_month = res_tm.data[0]['rev'] if res_tm.data and res_tm.data[0]['rev'] else 0
        
        sql_last_month = "SELECT SUM(total_amount) as rev FROM orders WHERE ordered_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND ordered_at < date_trunc('month', CURRENT_DATE)"
        res_lm = supabase.rpc("exec_sql", {"sql": sql_last_month}).execute()
        rev_last_month = res_lm.data[0]['rev'] if res_lm.data and res_lm.data[0]['rev'] else 0
        
        mom_change = 0
        if rev_last_month > 0:
            mom_change = round(((rev_this_month - rev_last_month) / rev_last_month) * 100, 2)
            
        sql_cities = "SELECT c.city, SUM(o.total_amount) as rev FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.city ORDER BY rev DESC NULLS LAST LIMIT 5"
        res_cities = supabase.rpc("exec_sql", {"sql": sql_cities}).execute()
        top_cities = res_cities.data or []
        
        sql_aov = "SELECT AVG(total_amount) as aov FROM orders"
        res_aov = supabase.rpc("exec_sql", {"sql": sql_aov}).execute()
        aov = round(res_aov.data[0]['aov'], 2) if res_aov.data and res_aov.data[0]['aov'] else 0
        
        return json.dumps({
            "revenue_this_month": rev_this_month,
            "revenue_last_month": rev_last_month,
            "mom_change_percent": mom_change,
            "top_5_cities_by_revenue": top_cities,
            "average_order_value": aov
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_campaign_overview() -> str:
    """
    Get an overview of all campaigns, including status, open rates, and best performing channels/campaigns.
    """
    from app.database import supabase
    try:
        c_res = supabase.table("campaigns").select("*").execute()
        campaigns = c_res.data or []
        
        comm_res = supabase.table("communications").select("*").execute()
        comms = comm_res.data or []
        
        results = []
        overall_opened = 0
        overall_delivered = 0
        channel_stats = {}
        
        for c in campaigns:
            c_comms = [cm for cm in comms if cm["campaign_id"] == c["id"]]
            total = len(c_comms)
            delivered = sum(1 for cm in c_comms if cm["status"] in ["delivered", "opened", "clicked"])
            opened = sum(1 for cm in c_comms if cm["status"] in ["opened", "clicked"])
            clicked = sum(1 for cm in c_comms if cm["status"] == "clicked")
            
            open_rate = (opened / delivered * 100) if delivered > 0 else 0
            
            overall_opened += opened
            overall_delivered += delivered
            
            results.append({
                "name": c["name"],
                "status": c["status"],
                "total_sent": total,
                "delivered": delivered,
                "opened": opened,
                "clicked": clicked,
                "open_rate": round(open_rate, 1)
            })
            
            for cm in c_comms:
                ch = cm["channel"]
                if ch not in channel_stats:
                    channel_stats[ch] = {"delivered": 0, "opened": 0}
                if cm["status"] in ["delivered", "opened", "clicked"]:
                    channel_stats[ch]["delivered"] += 1
                if cm["status"] in ["opened", "clicked"]:
                    channel_stats[ch]["opened"] += 1
                    
        overall_avg_open_rate = round((overall_opened / overall_delivered * 100), 1) if overall_delivered > 0 else 0
        best_campaign = max(results, key=lambda x: x["open_rate"]) if results else {}
        
        best_channel = ""
        best_channel_rate = 0
        for ch, stats in channel_stats.items():
            rate = (stats["opened"] / stats["delivered"] * 100) if stats["delivered"] > 0 else 0
            if rate > best_channel_rate:
                best_channel_rate = rate
                best_channel = ch
                
        return json.dumps({
            "campaigns": results,
            "overall_avg_open_rate": overall_avg_open_rate,
            "best_campaign": best_campaign,
            "best_channel": best_channel,
            "best_channel_open_rate": round(best_channel_rate, 1),
            "summary": "Campaign overview generated successfully."
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_at_risk_customers() -> str:
    """
    Get at-risk customers across different segments to target for retention.
    """
    from app.database import supabase
    try:
        sql1 = "SELECT c.id, c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id GROUP BY o.customer_id HAVING SUM(o.total_amount) > 3000) AND (SELECT MAX(ordered_at) FROM orders o WHERE o.customer_id = c.id) BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'"
        res1 = supabase.rpc("exec_sql", {"sql": sql1}).execute()
        high_val_inactive = res1.data or []
        
        sql2 = "SELECT COUNT(*) as c FROM customers c WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) = 1 AND (SELECT MAX(ordered_at) FROM orders o WHERE o.customer_id = c.id) BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '30 days'"
        res2 = supabase.rpc("exec_sql", {"sql": sql2}).execute()
        one_time_buyers = res2.data[0]['c'] if res2.data else 0
        
        sql3 = "SELECT COUNT(*) as c FROM customers c WHERE (SELECT MAX(ordered_at) FROM orders o WHERE o.customer_id = c.id) BETWEEN NOW() - INTERVAL '75 days' AND NOW() - INTERVAL '45 days'"
        res3 = supabase.rpc("exec_sql", {"sql": sql3}).execute()
        lapsing = res3.data[0]['c'] if res3.data else 0
        
        return json.dumps({
            "high_value_inactive_30_60_days": {
                "count": len(high_val_inactive),
                "names": [c["name"] for c in high_val_inactive][:5],
                "suggestion": "Send a highly personalized VIP 'We miss you' offer with a significant discount."
            },
            "one_time_buyers_30_90_days": {
                "count": one_time_buyers,
                "suggestion": "Send a product education sequence or an incentive for their second purchase."
            },
            "lapsing_45_75_days": {
                "count": lapsing,
                "suggestion": "Trigger a re-engagement workflow highlighting new arrivals or a limited-time coupon."
            }
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

# ─── Agent Run entrypoint ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI marketing assistant for Brew & Co, a premium DTC coffee brand.
Xeno CRM helps brands intelligently segment shoppers, generate personalized campaigns, and analyze engagement across WhatsApp, Email, SMS, and RCS.

RULES:
- ONLY answer questions about customer data, segments, campaigns, revenue, brand health, and creating/sending campaigns.
- NEVER make up customer names, numbers, or stats. Every data answer must come from a tool call.
- NEVER call draft_message unless the user explicitly asks to draft or create a message.
- NEVER call send_campaign unless the user has reviewed the draft and explicitly confirmed to send.
- After search_segment, report the count and ask if they want to draft a campaign.
- After draft_message, show the copy and ask for confirmation before sending.
- Be concise and conversational.
- Always use [Customer Name] tag in drafted messages so it gets personalized per recipient.
- Preferred channels: whatsapp first, then email, then sms.
- When naming a campaign for send_campaign, use a SHORT punchy name of 4-5 words max (e.g. "Mumbai Win-Back Campaign", "Lapsed VIP Offer"). NEVER use a long sentence as the campaign name.

Customer Segment Types:
- High-Value: VIP Coffee Subscribers, Top 10% Spend, Premium Loyalty Members
- Behavioral: Cold Brew Lovers, Morning Rush Customers, Seasonal Drink Buyers
- Geo: Mumbai Premium, Bangalore Café Visitors, Delhi Delivery, Chennai Loyalty
- Retention: At Risk, Lapsed Loyalty, Inactive 30+ Days"""

TOOLS_LIST = [
    search_segment, draft_message, send_campaign, get_campaign_stats,
    get_brand_health_reviews, get_customer_insights, get_revenue_insights,
    get_campaign_overview, get_at_risk_customers
]
TOOLS_MAP = {t.name: t for t in TOOLS_LIST}


async def run(message: str, session_id: str) -> dict:
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        api_key=API_KEY
    ).bind_tools(TOOLS_LIST)

    memory = get_memory(session_id)
    chat_history = memory.chat_memory.messages if memory.chat_memory.messages else []

    messages = [SystemMessage(content=SYSTEM_PROMPT)] + chat_history + [HumanMessage(content=message)]

    actions = []
    final_reply = ""

    for _ in range(8):  # max iterations
        response = await llm.ainvoke(messages)
        messages.append(response)

        if not response.tool_calls:
            final_reply = response.content
            break

        # Execute each tool call
        for tc in response.tool_calls:
            tool_name = tc["name"]
            tool_args = tc["args"]
            tool_id = tc["id"]

            logger.info(f"Calling tool: {tool_name} with args: {tool_args}")

            tool_fn = TOOLS_MAP.get(tool_name)
            if tool_fn:
                try:
                    tool_result = tool_fn.invoke(tool_args)
                except Exception as e:
                    tool_result = json.dumps({"error": str(e)})
            else:
                tool_result = json.dumps({"error": f"Unknown tool: {tool_name}"})

            actions.append({
                "tool": tool_name,
                "result": json.loads(tool_result) if isinstance(tool_result, str) else tool_result
            })

            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_id))

    # Save to memory
    memory.chat_memory.add_user_message(message)
    memory.chat_memory.add_ai_message(final_reply or response.content)

    return {
        "reply": final_reply or response.content,
        "actions": actions,
        "session_id": session_id
    }
