from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import ENV

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
PUBLIC_ENDPOINTS = {
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/check-email",
    "/patients",  # POST /patients for registration
}

# Endpoints that need special CSRF handling
SPECIAL_ENDPOINTS = {
    "/patients",  # Base endpoint
}


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        # Skip safe methods
        if request.method in SAFE_METHODS:
            return await call_next(request)

        # Skip CSRF for Swagger UI in development only
        referer = request.headers.get("referer", "")
        if ENV == "development" and "/docs" in referer:
            return await call_next(request)

        # Check if this is a special endpoint that needs custom handling
        path = request.url.path
        base_path = "/" + path.split("/")[1]  # Get the base path (e.g., /patients)

        if base_path in SPECIAL_ENDPOINTS:
            # For PUT/DELETE requests to /patients/{id}, validate CSRF
            if request.method in {"PUT", "DELETE"} and len(path.split("/")) > 2:
                header_token = request.headers.get("X-CSRF-Token")
                cookie_token = request.cookies.get("csrf_token")

                if not header_token or not cookie_token or header_token != cookie_token:
                    raise HTTPException(
                        status_code=403, detail="Invalid or missing CSRF token"
                    )

            return await call_next(request)

        # For all other endpoints, apply standard CSRF protection
        if path not in PUBLIC_ENDPOINTS:
            header_token = request.headers.get("X-CSRF-Token")
            cookie_token = request.cookies.get("csrf_token")

            if not header_token or not cookie_token or header_token != cookie_token:
                raise HTTPException(
                    status_code=403, detail="Invalid or missing CSRF token"
                )

        return await call_next(request)
