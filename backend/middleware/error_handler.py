"""
Global Error Handling Middleware.
Captures exceptions cleanly and returns structured JSON responses
without exposing internal traces or crashing the application.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("sih26032")

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. The system is operating in safe fallback mode.",
            "detail": str(exc) if "DEBUG" in globals() else None
        }
    )

async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error_code": "BAD_REQUEST",
            "message": str(exc)
        }
    )
