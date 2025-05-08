from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
PUBLIC_ENDPOINTS = {
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/check-email",
}


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip safe methods and public endpoints
        if request.method in SAFE_METHODS or request.url.path in PUBLIC_ENDPOINTS:
            return await call_next(request)

        # CSRF validation for protected routes
        header_token = request.headers.get("X-CSRF-Token")
        cookie_token = request.cookies.get("csrf_token")

        if not header_token or not cookie_token or header_token != cookie_token:
            raise HTTPException(status_code=403, detail="Invalid or missing CSRF token")

        return await call_next(request)
