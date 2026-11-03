from .models import AdminProfile, RegistrationRequest, AdminActivityLog
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from .models import AdminProfile, RegistrationRequest



from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from .models import AdminProfile, RegistrationRequest



from django.db import transaction
from django.shortcuts import get_object_or_404

def is_super_admin(user):
    return (
        user.is_authenticated
        and user.is_active
        and user.is_staff
        and user.is_superuser
    )

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
def admin_register(request):
    data = read_json_body(request)

    if data is None:
        return JsonResponse(
            {"message": "Invalid request data."},
            status=400,
        )

    full_name = data.get("full_name", "")
    username = data.get("username", "")
    email = data.get("email", "")
    phone = data.get("phone", "")
    institute_name = data.get("institute_name", "")
    password = data.get("password", "")

    fields = [
        full_name, username, email,
        phone, institute_name, password
    ]

    if not all(isinstance(value, str) for value in fields):
        return JsonResponse(
            {"message": "All fields must be text."},
            status=400,
        )

    full_name = full_name.strip()
    username = username.strip()
    email = email.strip().lower()
    phone = phone.strip()
    institute_name = institute_name.strip()

    if not all([
        full_name, username, email,
        phone, institute_name, password
    ]):
        return JsonResponse(
            {"message": "All fields are required."},
            status=400,
        )

    if len(password) < 8:
        return JsonResponse(
            {"message": "Password must contain at least 8 characters."},
            status=400,
        )

    User = get_user_model()

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse(
            {"message": "Username already exists."},
            status=409,
        )

    if RegistrationRequest.objects.filter(
        username__iexact=username
    ).exists():
        return JsonResponse(
            {"message": "Username already requested."},
            status=409,
        )

    try:
        RegistrationRequest.objects.create(
            full_name=full_name,
            username=username,
            email=email,
            phone=phone,
            institute_name=institute_name,
            password_hash=make_password(password),
        )
    except IntegrityError:
        return JsonResponse(
            {"message": "Email or phone is already registered."},
            status=409,
        )

    return JsonResponse(
        {
            "message": "Registration submitted. Waiting for admin approval.",
            "status": "pending",
        },
        status=201,
    )
@require_GET
def pending_registrations(request):
    if not is_super_admin(request.user):
        return JsonResponse(
        {"message": "Super Admin permission required."},
        status=403,
    )
    requests = RegistrationRequest.objects.filter(
        status="pending"
    ).order_by("-created_at")

    data = [
        {
            "id": item.id,
            "full_name": item.full_name,
            "username": item.username,
            "email": item.email,
            "phone": item.phone,
            "institute_name": item.institute_name,
            "status": item.status,
            "created_at": item.created_at.isoformat(),
        }
        for item in requests
    ]

    return JsonResponse({"requests": data})


@require_POST
def approve_registration(request, request_id):
    if not is_super_admin(request.user):
        return JsonResponse(
            {"message": "Super Admin permission required."},
            status=403,
        )

    User = get_user_model()

    with transaction.atomic():
        registration = get_object_or_404(
            RegistrationRequest.objects.select_for_update(),
            id=request_id,
            status="pending",
        )

        if User.objects.filter(
            username__iexact=registration.username
        ).exists():
            return JsonResponse(
                {"message": "This username already exists."},
                status=409,
            )

        new_user = User(
            username=registration.username,
            email=registration.email,
            first_name=registration.full_name,
            is_active=True,
            is_staff=True,
        )

        new_user.password = registration.password_hash
        new_user.save()

        AdminProfile.objects.create(
            user=new_user,
            phone=registration.phone,
        )

        registration.status = "approved"
        registration.reviewed_at = timezone.now()
        registration.save(
            update_fields=["status", "reviewed_at"]
        )

    return JsonResponse({
        "message": "New admin approved successfully.",
        "username": new_user.username,
        "status": "approved",
    })
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

    AdminActivityLog.objects.create(
    user=user,
    action="login"
)

    request.session.save()

    return JsonResponse({
        "message": "Login successful.",
        "username": user.username,
        "authenticated": True,
    })
@require_POST
def reject_registration(request, request_id):
    if not is_super_admin(request.user):
        return JsonResponse(
            {"message": "Super Admin permission required."},
            status=403,
        )

    with transaction.atomic():
        registration = get_object_or_404(
            RegistrationRequest.objects.select_for_update(),
            id=request_id,
            status="pending",
        )

        registration.status = "rejected"
        registration.reviewed_at = timezone.now()
        registration.save(
            update_fields=["status", "reviewed_at"]
        )

    return JsonResponse({
        "message": "Registration rejected successfully.",
        "status": "rejected",
    })
@require_POST
def admin_logout(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"message": "You are not logged in."},
            status=401,
        )

    AdminActivityLog.objects.create(
    user=request.user,
     action="logout"
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
@require_GET
def admin_list(request):
    if not is_super_admin(request.user):
        return JsonResponse(
            {"message": "Super Admin permission required."},
            status=403,
        )

    User = get_user_model()
    admins = User.objects.filter(
        is_staff=True
    ).order_by("id")

    data = []

    for admin in admins:
        profile = getattr(admin, "admin_profile", None)

        data.append({
            "id": admin.id,
            "username": admin.username,
            "name": admin.first_name or admin.username,
            "email": admin.email,
            "phone": profile.phone if profile else "",
            "is_active": admin.is_active,
            "is_superuser": admin.is_superuser,
        })

    return JsonResponse({"admins": data})


@require_POST
def update_admin_status(request, user_id):
    if not is_super_admin(request.user):
        return JsonResponse(
            {"message": "Super Admin permission required."},
            status=403,
        )

    data = read_json_body(request)

    if data is None or not isinstance(data.get("is_active"), bool):
        return JsonResponse(
            {"message": "A valid is_active value is required."},
            status=400,
        )

    User = get_user_model()

    with transaction.atomic():
        target_admin = get_object_or_404(
            User.objects.select_for_update(),
            id=user_id,
            is_staff=True,
        )

        # Never deactivate a Super Admin.
        if target_admin.is_superuser:
            return JsonResponse(
                {"message": "Super Admin account is protected."},
                status=403,
            )

        target_admin.is_active = data["is_active"]
        target_admin.save(update_fields=["is_active"])

    return JsonResponse({
        "message": (
            "Admin activated successfully."
            if target_admin.is_active
            else "Admin deactivated successfully."
        ),
        "id": target_admin.id,
        "is_active": target_admin.is_active,
    })
@require_GET
def admin_activity_logs(request):
    if not is_super_admin(request.user):
        return JsonResponse(
            {"message": "Super Admin permission required."},
            status=403,
        )

    logs = AdminActivityLog.objects.select_related(
        "user"
    ).order_by("-created_at")[:100]

    data = []

    for log in logs:
        data.append({
            "id": log.id,
            "username": log.user.username if log.user else "Deleted Admin",
            "action": log.action,
            "created_at": log.created_at.isoformat(),
        })

    return JsonResponse({"logs": data})