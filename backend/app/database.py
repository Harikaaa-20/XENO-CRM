import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("xeno-database")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xxxx.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def init_tables():
    """
    Auto-initialize database tables (customers, orders, campaigns, communications) 
    using the Supabase exec_sql RPC function.
    """
    tables_sql = """
    -- Create customers table
    CREATE TABLE IF NOT EXISTS customers (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        phone       TEXT,
        city        TEXT,
        channel     TEXT DEFAULT 'whatsapp',
        tier        TEXT DEFAULT 'regular',
        created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_customers_tier    ON customers(tier);
    CREATE INDEX IF NOT EXISTS idx_customers_city    ON customers(city);
    CREATE INDEX IF NOT EXISTS idx_customers_channel ON customers(channel);

    -- Create orders table
    CREATE TABLE IF NOT EXISTS orders (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
        total_amount  NUMERIC(10, 2) NOT NULL,
        ordered_at    TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_ordered_at  ON orders(ordered_at);

    -- Create order_items table
    CREATE TABLE IF NOT EXISTS order_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
        product     TEXT NOT NULL,
        quantity    INTEGER DEFAULT 1,
        price       NUMERIC(10,2) NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

    -- Create campaigns table
    CREATE TABLE IF NOT EXISTS campaigns (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         TEXT NOT NULL,
        segment_rule JSONB NOT NULL,
        message      TEXT NOT NULL,
        channel      TEXT NOT NULL,
        status       TEXT DEFAULT 'draft',
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        sent_at      TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        is_archived  BOOLEAN DEFAULT FALSE
    );

    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

    -- Create communications table
    CREATE TABLE IF NOT EXISTS communications (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
        channel       TEXT NOT NULL,
        message       TEXT NOT NULL,
        status        TEXT DEFAULT 'sent',
        sent_at       TIMESTAMPTZ DEFAULT NOW(),
        delivered_at  TIMESTAMPTZ,
        opened_at     TIMESTAMPTZ,
        clicked_at    TIMESTAMPTZ,
        failed_at     TIMESTAMPTZ,
        failure_reason TEXT,
        failure_type  TEXT,
        retry_count   INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_comm_campaign_id  ON communications(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_comm_customer_id  ON communications(customer_id);
    CREATE INDEX IF NOT EXISTS idx_comm_status       ON communications(status);
    """
    
    try:
        logger.info("Initializing database tables using exec_sql RPC...")
        statements = [stmt.strip() for stmt in tables_sql.split(";") if stmt.strip()]
        for stmt in statements:
            supabase.rpc("exec_sql", {"sql": stmt}).execute()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(
            f"Could not auto-initialize tables using exec_sql RPC: {e}.\n"
            "This is expected if the 'exec_sql' database function has not been set up in Supabase yet.\n"
            "Please ensure the following SQL is executed in your Supabase SQL Editor:\n\n"
            "CREATE OR REPLACE FUNCTION exec_sql(sql text)\n"
            "RETURNS json AS $$\n"
            "DECLARE\n"
            "    result json;\n"
            "    trimmed_sql text;\n"
            "BEGIN\n"
            "    trimmed_sql := ltrim(sql);\n"
            "    IF upper(trimmed_sql) LIKE 'SELECT%' OR upper(trimmed_sql) LIKE 'WITH%' THEN\n"
            "        EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;\n"
            "        RETURN COALESCE(result, '[]'::json);\n"
            "    ELSE\n"
            "        EXECUTE sql;\n"
            "        RETURN '[]'::json;\n"
            "    END IF;\n"
            "END;\n"
            "$$ LANGUAGE plpgsql SECURITY DEFINER;\n"
        )
