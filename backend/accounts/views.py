
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
def admin_login(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"message": "Invalid request data."}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not isinstance(password, str) or not password:
        return JsonResponse(
            {"message": "Username and password are required."},
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"message": "Invalid username or password."},
            status=401,
        )

    if not user.is_active or not user.is_staff:
        return JsonResponse(
            {"message": "Admin access is not permitted."},
            status=403,
        )

    login(request, user)

    return JsonResponse({
        "message": "Login successful.",
        "username": user.username,
    })


@require_POST
def admin_logout(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"message": "You are not logged in."},
            status=401,
        )

    logout(request)
    return JsonResponse({"message": "Logout successful."})

from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def auth_check(request):
    is_authenticated = (
        request.user.is_authenticated
        and request.user.is_active
        and request.user.is_staff
    )

    return JsonResponse({
        "authenticated": is_authenticated
    })

from .models import AdminProfile
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET", "POST"])
def admin_profile(request):
    if not request.user.is_authenticated or not request.user.is_active or not request.user.is_staff:
        return JsonResponse({"message": "Admin access required."}, status=403)

    profile, _ = AdminProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return JsonResponse({
            "name": request.user.first_name or request.user.username,
            "email": request.user.email,
            "phone": profile.phone,
            "role": "Institute Admin",
        })

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"message": "Invalid request data."}, status=400)

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not email:
        return JsonResponse({"message": "Name and email are required."}, status=400)

    request.user.first_name = name
    request.user.email = email
    request.user.save(update_fields=["first_name", "email"])

    profile.phone = phone
    profile.save(update_fields=["phone"])

    return JsonResponse({
        "message": "Profile saved successfully.",
        "name": request.user.first_name,
        "email": request.user.email,
        "phone": profile.phone,
        "role": "Institute Admin",
    })
