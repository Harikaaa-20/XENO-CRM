import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import init_tables

app = FastAPI(title="Xeno Mini CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

from app.worker import scheduler_worker
import asyncio

@app.on_event("startup")
async def startup():
    await init_tables()
    asyncio.create_task(scheduler_worker())

@app.get("/health")
def health():
    return {"status": "ok"}
