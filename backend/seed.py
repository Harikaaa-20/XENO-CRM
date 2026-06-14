import os
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from app.database import supabase

CITIES = (
    ["Mumbai"] * 55 +
    ["Delhi"] * 45 +
    ["Bangalore"] * 40 +
    ["Pune"] * 25 +
    ["Chennai"] * 20 +
    ["Hyderabad"] * 15
)

CHANNELS = (
    ["whatsapp"] * 130 +
    ["email"] * 50 +
    ["sms"] * 20
)

TIERS = (
    ["high_value"] * 30 +
    ["regular"] * 80 +
    ["at_risk"] * 50 +
    ["lapsed"] * 40
)

PRODUCTS = {
    "Cold Brew Pack": 899,
    "Single Origin Beans 250g": 649,
    "Espresso Blend 500g": 1199,
    "Brew Kit Starter": 1899,
    "Filter Coffee Powder": 449,
    "Monthly Subscription Box": 2499,
    "Cold Brew Concentrate": 749,
    "Pour Over Kit": 1299
}

PRODUCT_NAMES = list(PRODUCTS.keys())

FIRST_NAMES_MALE = ["Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Atharv", "Amit", "Rahul", "Rohan", "Vikram", "Sanjay", "Rajesh", "Kiran", "Vijay", "Deepak", "Anil", "Ravi", "Suresh", "Karan", "Alok", "Manoj"]
FIRST_NAMES_FEMALE = ["Aanya", "Diya", "Priya", "Ananya", "Kiara", "Ira", "Myra", "Sara", "Kavya", "Riya", "Sneha", "Neha", "Pooja", "Aditi", "Sunita", "Meera", "Jyoti", "Aisha", "Divya", "Ritu", "Nisha", "Harika", "Priyanka", "Swati", "Anjali"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Mehta", "Sen", "Joshi", "Rao", "Nair", "Patel", "Reddy", "Iyer", "Choudhury", "Singh", "Kumar", "Mishra", "Das", "Banerjee", "Pillai", "Naidu", "Bose", "Jadhav", "Kulkarni", "Deshmukh", "Nair", "Pillai"]

def generate_random_name():
    first_list = FIRST_NAMES_MALE if random.random() > 0.5 else FIRST_NAMES_FEMALE
    return f"{random.choice(first_list)} {random.choice(LAST_NAMES)}"

def last_order_date_for_tier(tier):
    now = datetime.utcnow()
    if tier == "high_value":
        return now - timedelta(days=random.randint(1, 25))
    elif tier == "regular":
        return now - timedelta(days=random.randint(10, 40))
    elif tier == "at_risk":
        return now - timedelta(days=random.randint(45, 85))
    elif tier == "lapsed":
        return now - timedelta(days=random.randint(90, 180))
    return now - timedelta(days=random.randint(1, 30))

def generate_orders_for_customer(customer_id, tier, city, last_order_dt):
    order_counts = {
        "high_value": random.randint(4, 8),
        "regular": random.randint(2, 4),
        "at_risk": random.randint(1, 3),
        "lapsed": random.randint(1, 2),
    }
    n = order_counts.get(tier, 2)
    orders = []
    order_items = []
    current_dt = last_order_dt
    
    for i in range(n):
        order_id = str(uuid.uuid4())
        
        # Determine number of items for this order (1-4)
        num_items = random.randint(1, 4)
        items_for_this_order = []
        total_amount = 0.0
        
        # Pick distinct products for the order
        chosen_products = random.sample(PRODUCT_NAMES, min(num_items, len(PRODUCT_NAMES)))
        
        for product in chosen_products:
            quantity = random.randint(1, 3)
            price = PRODUCTS[product] * quantity
            total_amount += price
            
            items_for_this_order.append({
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "product": product,
                "quantity": quantity,
                "price": price,
                "created_at": current_dt.isoformat() + "Z",
            })
            
        orders.append({
            "id": order_id,
            "customer_id": customer_id,
            "total_amount": float(total_amount),
            "ordered_at": current_dt.isoformat() + "Z",
            "created_at": current_dt.isoformat() + "Z",
        })
        order_items.extend(items_for_this_order)
        
        # Multiple orders on the same day allowed occasionally
        if random.random() > 0.2:
            current_dt -= timedelta(days=random.randint(20, 60))
        
    return orders, order_items

def seed_db():
    print("Seeding database...")
    
    # Reload schema cache
    try:
        supabase.rpc("exec_sql", {"sql": "NOTIFY pgrst, 'reload schema';"}).execute()
        import time
        time.sleep(2)
    except Exception as e:
        print(f"Failed to reload schema: {e}")
        
    # 1. Clear existing data
    print("Clearing tables: order_items, orders, communications, campaigns, customers...")
    for table in ["order_items", "orders", "communications", "campaigns", "customers"]:
        try:
            supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            print(f"Error clearing {table}: {e}")

    # 2. Shuffle lists to distribute properties randomly
    cities = list(CITIES)
    channels = list(CHANNELS)
    tiers = list(TIERS)
    
    random.shuffle(cities)
    random.shuffle(channels)
    random.shuffle(tiers)
    
    # 3. Create customers and orders
    customers_to_insert = []
    orders_to_insert = []
    order_items_to_insert = []
    
    used_emails = set()
    used_phones = set()
    
    for i in range(200):
        name = generate_random_name()
        email = f"{name.lower().replace(' ', '.')}@example.com"
        counter = 1
        while email in used_emails:
            email = f"{name.lower().replace(' ', '.')}{counter}@example.com"
            counter += 1
        used_emails.add(email)
        
        phone = f"+91-9{random.randint(10000000, 99999999)}"
        while phone in used_phones:
            phone = f"+91-9{random.randint(10000000, 99999999)}"
        used_phones.add(phone)
        
        customer_id = str(uuid.uuid4())
        tier = tiers[i]
        city = cities[i]
        channel = channels[i]
        
        last_order_dt = last_order_date_for_tier(tier)
        cust_orders, cust_items = generate_orders_for_customer(customer_id, tier, city, last_order_dt)
        
        oldest_order_dt = min([datetime.fromisoformat(o["ordered_at"].replace("Z", "+00:00")).replace(tzinfo=None) for o in cust_orders]) if cust_orders else datetime.utcnow()
        created_at_dt = oldest_order_dt - timedelta(days=random.randint(1, 30))
        
        customers_to_insert.append({
            "id": customer_id,
            "name": name,
            "email": email,
            "phone": phone,
            "city": city,
            "channel": channel,
            "tier": tier,
            "created_at": created_at_dt.isoformat() + "Z"
        })
        
        orders_to_insert.extend(cust_orders)
        order_items_to_insert.extend(cust_items)
        
    print(f"Generated {len(customers_to_insert)} customers, {len(orders_to_insert)} orders, {len(order_items_to_insert)} order items.")
    
    # 4. Insert customers in batches
    print("Inserting customers...")
    for j in range(0, len(customers_to_insert), 100):
        supabase.table("customers").insert(customers_to_insert[j:j+100]).execute()
        
    # 5. Insert orders in batches
    print("Inserting orders...")
    for k in range(0, len(orders_to_insert), 100):
        supabase.table("orders").insert(orders_to_insert[k:k+100]).execute()
        
    # 6. Insert order items in batches
    print("Inserting order items...")
    for m in range(0, len(order_items_to_insert), 100):
        supabase.table("order_items").insert(order_items_to_insert[m:m+100]).execute()
        
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
