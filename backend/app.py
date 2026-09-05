"""
Main FastAPI Application Entrypoint for SIH26032.
Smart Agricultural Procurement & Harvest Scheduling Platform.
"""

import os
import sys
from pathlib import Path


# ============================================================
# PROJECT PATH CONFIGURATION
# ============================================================

# Add project root to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


# ============================================================
# WINDOWS OR-TOOLS DLL FIX
# ============================================================
#
# OR-Tools ships native DLL files inside:
#
#     ortools/.libs/
#
# On Windows, Python may not automatically search this folder
# when loading OR-Tools native dependencies.
#
# We therefore explicitly add the .libs directory to the
# Windows DLL search path BEFORE importing any project module
# that may import OR-Tools.
#
# This is harmless on Linux/Render because os.add_dll_directory
# is only available on Windows.
# ============================================================

_ORTOOLS_DLL_DIR = None

if sys.platform == "win32":
    for site_packages in sys.path:
        if not site_packages:
            continue

        ortools_libs = (
            Path(site_packages)
            / "ortools"
            / ".libs"
        )

        if ortools_libs.is_dir():
            _ORTOOLS_DLL_DIR = os.add_dll_directory(
                str(ortools_libs)
            )
            break


# ============================================================
# FASTAPI IMPORTS
# ============================================================

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# APPLICATION IMPORTS
# ============================================================

from backend.config.settings import settings
from backend.models import Base, engine, SessionLocal, User
from backend.init_db import init_database
from backend.middleware.error_handler import (
    global_exception_handler,
    value_error_handler
)


# ============================================================
# ROUTER IMPORTS
# ============================================================

from backend.routes.auth_routes import router as auth_router
from backend.routes.farmer_routes import router as farmer_router
from backend.routes.booking_routes import router as booking_router
from backend.routes.centre_routes import router as centre_router
from backend.routes.queue_routes import router as queue_router
from backend.routes.prediction_routes import router as prediction_router
from backend.routes.optimization_routes import router as optimization_router
from backend.routes.notification_routes import router as notification_router
from backend.routes.inspection_routes import router as inspection_router
from backend.routes.weighing_routes import router as weighing_router
from backend.routes.payment_routes import router as payment_router


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.

    Startup:
        - Create database tables
        - Load seed data when required

    Shutdown:
        - No special cleanup required
    """

    print("Starting SIH26032 backend...")
    print("Initializing database...")

    init_database()

    print("Database initialization completed.")

    yield

    print("SIH26032 backend shutting down...")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="SIH26032: Smart Agricultural Procurement Platform",
    description=(
        "Government-oriented intelligent procurement planning, "
        "harvest scheduling, and mandi queue platform."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL EXCEPTION HANDLERS
# ============================================================

app.add_exception_handler(
    Exception,
    global_exception_handler
)

app.add_exception_handler(
    ValueError,
    value_error_handler
)


# ============================================================
# REGISTER API ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(farmer_router)
app.include_router(booking_router)
app.include_router(centre_router)
app.include_router(queue_router)
app.include_router(prediction_router)
app.include_router(optimization_router)
app.include_router(notification_router)
app.include_router(inspection_router)
app.include_router(weighing_router)
app.include_router(payment_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "project": (
            "SIH26032 — Smart Agricultural Procurement Platform"
        ),
        "status": "ONLINE",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs",
        "portal_name": (
            "National Agricultural Procurement & Scheduling Portal"
        )
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "demo_mode": settings.DEMO_MODE,
        "external_services": {
            "copernicus": (
                "CALIBRATED_FALLBACK"
                if settings.DEMO_MODE
                else "LIVE"
            ),
            "weather": (
                "IMD_CALIBRATED"
                if settings.DEMO_MODE
                else "LIVE"
            ),
            "bhashini": "READY",
            "or_tools_optimizer": "ACTIVE"
        }
    }


# ============================================================
# LOCAL DEVELOPMENT ENTRYPOINT
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )