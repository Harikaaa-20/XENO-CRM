def build_segment_query(filters: dict) -> str:
    """
    Build dynamic SQL query based on filters.
    """
    base = """
        SELECT c.*,
               COUNT(o.id) as order_count,
               COALESCE(SUM(o.total_amount), 0) as total_spend,
               MAX(o.ordered_at) as last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        HAVING 1=1
    """
    conditions = []
    
    if "inactive_days" in filters and filters["inactive_days"] is not None:
        conditions.append(
            f"(MAX(o.ordered_at) < NOW() - INTERVAL '{filters['inactive_days']} days' "
            f"OR MAX(o.ordered_at) IS NULL)"
        )

    if "active_days" in filters and filters["active_days"] is not None:
        conditions.append(
            f"MAX(o.ordered_at) >= NOW() - INTERVAL '{filters['active_days']} days'"
        )

    if "min_spend" in filters and filters["min_spend"] is not None:
        conditions.append(f"COALESCE(SUM(o.total_amount), 0) >= {filters['min_spend']}")

    if "max_spend" in filters and filters["max_spend"] is not None:
        conditions.append(f"COALESCE(SUM(o.total_amount), 0) <= {filters['max_spend']}")

    if "min_orders" in filters and filters["min_orders"] is not None:
        conditions.append(f"COUNT(o.id) >= {filters['min_orders']}")

    if "max_orders" in filters and filters["max_orders"] is not None:
        conditions.append(f"COUNT(o.id) <= {filters['max_orders']}")

    if "city" in filters and filters["city"] is not None and filters["city"] != "":
        conditions.append(f"LOWER(c.city) = LOWER('{filters['city']}')")

    if "tier" in filters and filters["tier"] is not None and filters["tier"] != "":
        conditions.append(f"LOWER(c.tier) = LOWER('{filters['tier']}')")

    if "channel" in filters and filters["channel"] is not None and filters["channel"] != "":
        conditions.append(f"LOWER(c.channel) = LOWER('{filters['channel']}')")
        
    if "min_avg_order" in filters and filters["min_avg_order"] is not None:
        conditions.append(f"COALESCE(SUM(o.total_amount), 0) / NULLIF(COUNT(o.id), 0) >= {filters['min_avg_order']}")
        
    if "product" in filters and filters["product"] is not None and filters["product"] != "":
        # Escape single quotes in the product string to prevent SQL injection issues
        product_safe = filters['product'].replace("'", "''")
        conditions.append(
            f"EXISTS (SELECT 1 FROM orders o2 JOIN order_items oi ON o2.id = oi.order_id "
            f"WHERE o2.customer_id = c.id AND oi.product ILIKE '%{product_safe}%')"
        )

    if "joined_last_days" in filters and filters["joined_last_days"] is not None:
        conditions.append(f"c.created_at >= NOW() - INTERVAL '{filters['joined_last_days']} days'")

    if "never_bought_product" in filters and filters["never_bought_product"] is not None and filters["never_bought_product"] != "":
        product_safe = filters['never_bought_product'].replace("'", "''")
        conditions.append(
            f"NOT EXISTS (SELECT 1 FROM orders o2 JOIN order_items oi ON o2.id = oi.order_id "
            f"WHERE o2.customer_id = c.id AND oi.product ILIKE '%{product_safe}%')"
        )

    if "min_total_items" in filters and filters["min_total_items"] is not None:
        conditions.append(
            f"COALESCE((SELECT SUM(oi.quantity) FROM orders o2 JOIN order_items oi ON o2.id = oi.order_id "
            f"WHERE o2.customer_id = c.id), 0) >= {filters['min_total_items']}"
        )

    if "single_order_value_over" in filters and filters["single_order_value_over"] is not None:
        conditions.append(
            f"EXISTS (SELECT 1 FROM orders o2 WHERE o2.customer_id = c.id AND o2.total_amount > {filters['single_order_value_over']})"
        )

    if "email_domain" in filters and filters["email_domain"] is not None and filters["email_domain"] != "":
        domain_safe = filters['email_domain'].replace("'", "''")
        conditions.append(f"c.email ILIKE '%@{domain_safe}'")

    if "opened_last_campaign" in filters and filters["opened_last_campaign"] is False:
        conditions.append(
            "c.id IN ("
            "  SELECT customer_id FROM ("
            "    SELECT customer_id, status, ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY sent_at DESC) as rn"
            "    FROM communications"
            "  ) sub WHERE sub.rn = 1 AND sub.status NOT IN ('opened', 'clicked')"
            ")"
        )
    elif "opened_last_campaign" in filters and filters["opened_last_campaign"] is True:
        conditions.append(
            "c.id IN ("
            "  SELECT customer_id FROM ("
            "    SELECT customer_id, status, ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY sent_at DESC) as rn"
            "    FROM communications"
            "  ) sub WHERE sub.rn = 1 AND sub.status IN ('opened', 'clicked')"
            ")"
        )

    if conditions:
        base += " AND " + " AND ".join(conditions)

    return base

def query_segment(filters: dict) -> dict:
    """
    Execute segment query via Supabase exec_sql RPC and format the aggregated metrics.
    """
    from app.database import supabase
    
    query = build_segment_query(filters)
    try:
        res = supabase.rpc("exec_sql", {"sql": query}).execute()
        customers = res.data or []
    except Exception as e:
        print(f"Error executing segment query: {e}")
        customers = []

    count = len(customers)
    total_spend = sum(float(c.get("total_spend", 0)) for c in customers)
    avg_spend = round(total_spend / count, 2) if count > 0 else 0.0
    
    # Channel counts
    channels_breakdown = {}
    for c in customers:
        ch = c.get("channel", "whatsapp")
        channels_breakdown[ch] = channels_breakdown.get(ch, 0) + 1
        
    # City counts
    cities_map = {}
    for c in customers:
        city = c.get("city", "Other")
        cities_map[city] = cities_map.get(city, 0) + 1
        
    # Sort and take top 3, rest is 'Other'
    sorted_cities = sorted(cities_map.items(), key=lambda x: x[1], reverse=True)
    cities_breakdown = {}
    other_count = 0
    for idx, (city, val) in enumerate(sorted_cities):
        if idx < 3:
            cities_breakdown[city] = val
        else:
            other_count += val
    if other_count > 0:
        cities_breakdown["Other"] = other_count
        
    # Sample names
    sample_names = [c.get("name") for c in customers[:5] if c.get("name")]
    
    return {
        "count": count,
        "avg_spend": avg_spend,
        "total_spend": total_spend,
        "channels": channels_breakdown,
        "cities": cities_breakdown,
        "sample": sample_names,
        "segment_rule": filters
    }
