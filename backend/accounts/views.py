
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from .models import AdminProfile


def read_json_body(request):
    try:
        data = json.loads(request.body or b"{}")
        if not isinstance(data, dict):
            return None
        return data
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
def admin_login(request):
    data = read_json_body(request)

    if data is None:
        return JsonResponse(
            {"message": "Invalid request data."},
            status=400,
        )

    username = data.get("username", "")
    password = data.get("password", "")

    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse(
            {"message": "Username and password must be text."},
            status=400,
        )

    username = username.strip()

    if not username or not password:
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

    # Ensure the session is saved before returning the response.
    request.session.save()

    return JsonResponse({
        "message": "Login successful.",
        "username": user.username,
        "authenticated": True,
    })


@require_POST
def admin_logout(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"message": "You are not logged in."},
            status=401,
        )

    logout(request)

    return JsonResponse({
        "message": "Logout successful.",
        "authenticated": False,
    })


@require_GET
def auth_check(request):
    user = request.user

    authenticated = (
        user.is_authenticated
        and user.is_active
        and user.is_staff
    )

    return JsonResponse({
        "authenticated": authenticated,
        "username": user.username if authenticated else None,
    })


@require_http_methods(["GET", "POST"])
def admin_profile(request):
    user = request.user

    if not (
        user.is_authenticated
        and user.is_active
        and user.is_staff
    ):
        return JsonResponse(
            {"message": "Admin access required. Please log in again."},
            status=403,
        )

    profile, _ = AdminProfile.objects.get_or_create(user=user)

    if request.method == "GET":
        return JsonResponse({
            "name": user.first_name or user.username,
            "email": user.email,
            "phone": profile.phone,
            "role": "Institute Admin",
        })

    data = read_json_body(request)

    if data is None:
        return JsonResponse(
            {"message": "Invalid request data."},
            status=400,
        )

    name = data.get("name", "")
    email = data.get("email", "")
    phone = data.get("phone", "")

    if not all(isinstance(value, str) for value in [name, email, phone]):
        return JsonResponse(
            {"message": "Name, email and phone must be text."},
            status=400,
        )

    name = name.strip()
    email = email.strip()
    phone = phone.strip()

    if not name or not email:
        return JsonResponse(
            {"message": "Name and email are required."},
            status=400,
        )

    user.first_name = name
    user.email = email
    user.save(update_fields=["first_name", "email"])

    profile.phone = phone
    profile.save(update_fields=["phone"])

    return JsonResponse({
        "message": "Profile saved successfully.",
        "name": user.first_name,
        "email": user.email,
        "phone": profile.phone,
        "role": "Institute Admin",
    })
