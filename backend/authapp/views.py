import random
import string
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import CustomUser, Role, Permission, UserPermission
from .serializers import (
    LoginSerializer,
    RequestOTPSerializer,
    ResetPasswordSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    RoleSerializer,
    RoleCreateSerializer,
    PermissionSerializer,
    UserSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserPermissionSerializer,
    CustomTokenObtainPairSerializer,
)
from authapp.permissions import HasPagePermission

class EffectivePermissionMixin:
    """
    Reusable mixin to check effective permissions (role + user overrides)
    """

    def check_permission(self, request, page, action):
        if request.user.is_superuser:
            return True
        return request.user.has_effective_permission(page, action)


class EffectivePermissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perms = request.user.get_effective_permissions()
        return Response(perms)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            user = authenticate(request, email=email, password=password)

            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = CustomUser.objects.get(email=email)
                otp = "".join(random.choices(string.digits, k=6))
                user.otp = otp 
                user.save()
                send_mail(
                    subject="Your OTP for Password Reset",
                    message=f"Your OTP is {otp}. It is valid for 10 minutes.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response(
                    {"message": "OTP sent to your email"}, status=status.HTTP_200_OK
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]
            new_password = serializer.validated_data["new_password"]
            try:
                user = CustomUser.objects.get(email=email)
                if user.otp == otp:
                    user.set_password(new_password)
                    user.otp = None
                    user.save()
                    return Response(
                        {"message": "Password reset successfully"},
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated, HasPagePermission]
    required_page = "Profile"

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, HasPagePermission]
    required_page = "Profile"

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleListCreateView(APIView, EffectivePermissionMixin):
    def get(self, request):
        if not self.check_permission(request, "roles", "view"):
            return Response({"error": "Permission denied"}, status=403)
        roles = Role.objects.all()
        if not request.user.is_superuser:
            roles = roles.exclude(name="Superadmin")
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not self.check_permission(request, "roles", "add"):
            return Response({"error": "Permission denied"}, status=403)
        serializer = RoleCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleDetailView(APIView, EffectivePermissionMixin):
    def get_object(self, pk):
        try:
            return Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return None

    def get(self, request, pk):
        is_own_role = (request.user.role and request.user.role.id == pk)
        
        if not (is_own_role or self.check_permission(request, "roles", "view")):
            return Response({"error": "Permission denied"}, status=403)
        role = self.get_object(pk)
        if not role:
            return Response({"error": "Role not found"}, status=404)
        
        if role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        serializer = RoleSerializer(role)
        return Response(serializer.data)

    def put(self, request, pk):
        role = self.get_object(pk)
        if not role:
            return Response({"error": "Role not found"}, status=404)

        if role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        if not self.check_permission(request, "roles", "edit"):
            return Response({"error": "Permission denied"}, status=403)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = self.get_object(pk)
        if not role:
            return Response({"error": "Role not found"}, status=404)

        if role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        if not self.check_permission(request, "roles", "delete"):
            return Response({"error": "Permission denied"}, status=403)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PermissionListCreateView(APIView, EffectivePermissionMixin):
    def get(self, request):
        if not self.check_permission(request, "permissions", "view"):
            return Response({"error": "Permission denied"}, status=403)
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not self.check_permission(request, "permissions", "add"):
            return Response({"error": "Permission denied"}, status=403)
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PermissionDetailView(APIView, EffectivePermissionMixin):
    def get_object(self, pk):
        try:
            return Permission.objects.get(pk=pk)
        except Permission.DoesNotExist:
            return None

    def put(self, request, pk):
        if not self.check_permission(request, "permissions", "edit"):
            return Response({"error": "Permission denied"}, status=403)
        permission = self.get_object(pk)
        if not permission:
            return Response({"error": "Permission not found"}, status=404)
        serializer = PermissionSerializer(permission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not self.check_permission(request, "permissions", "delete"):
            return Response({"error": "Permission denied"}, status=403)
        permission = self.get_object(pk)
        if not permission:
            return Response({"error": "Permission not found"}, status=404)
        permission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserListCreateView(APIView, EffectivePermissionMixin):
    def get(self, request):
        users = CustomUser.objects.all()
        if not request.user.is_superuser:
            users = users.exclude(role__name="Superadmin")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not self.check_permission(request, "users", "add"):
            return Response({"error": "Permission denied"}, status=403)
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView, EffectivePermissionMixin):
    def get_object(self, pk):
        try:
            return CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return None

    def get(self, request, pk):
        if not self.check_permission(request, "users", "view"):
            return Response({"error": "Permission denied"}, status=403)
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=404)

        if user.role and user.role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        serializer = UserDetailSerializer(user)  
        return Response(serializer.data)

    def put(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=404)

        if user.role and user.role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        if not self.check_permission(request, "users", "edit"):
            return Response({"error": "Permission denied"}, status=403)
        user = self.get_object(pk)
        serializer = UserDetailSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=404)

        if user.role and user.role.name == "Superadmin" and not request.user.is_superuser:
            return Response({"error": "Permission denied"}, status=403)

        if not self.check_permission(request, "users", "delete"):
            return Response({"error": "Permission denied"}, status=403)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserPermissionListCreateView(APIView, EffectivePermissionMixin):
    """
    GET: List all permission overrides for a user
    POST: Create or update (upsert) a permission override
    """

    def get(self, request, user_id):
        """
        List all overrides for the given user
        """
        if not self.check_permission(request, "users", "view"):
            return Response({"error": "Permission denied"}, status=403)

        try:
            user = CustomUser.objects.get(pk=user_id)
            
            if user.role and user.role.name == "Superadmin" and not request.user.is_superuser:
                return Response({"error": "Permission denied"}, status=403)

            overrides = (
                user.permission_overrides.all()
            )
            serializer = UserPermissionSerializer(overrides, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, user_id):
        """
        Create a new override or update existing one (upsert)
        """
        if not self.check_permission(request, "users", "edit"):
            return Response({"error": "Permission denied"}, status=403)

        try:
            user = CustomUser.objects.get(pk=user_id)
            page = request.data.get("page")
            if not page:
                return Response({"page": "This field is required."}, status=400)

            existing = UserPermission.objects.filter(user=user, page=page).first()
            serializer_data = request.data.copy()
            serializer_data["user"] = user.id  

            if existing:
                serializer = UserPermissionSerializer(
                    existing, data=serializer_data, partial=True
                )
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                serializer = UserPermissionSerializer(data=serializer_data)
                if serializer.is_valid():
                    serializer.save(user=user)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class UserPermissionDetailView(APIView, EffectivePermissionMixin):
    def get_object(self, user_id, perm_id):
        try:
            user = CustomUser.objects.get(pk=user_id)
            return user.permission_overrides.get(pk=perm_id)
        except (CustomUser.DoesNotExist, UserPermission.DoesNotExist):
            return None

    def put(self, request, user_id, perm_id):
        if not self.check_permission(request, "users", "edit"):
            return Response({"error": "Permission denied"}, status=403)
        perm = self.get_object(user_id, perm_id)
        if not perm:
            return Response({"error": "Permission override not found"}, status=404)
        serializer = UserPermissionSerializer(perm, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id, perm_id):
        if not self.check_permission(request, "users", "delete"):
            return Response({"error": "Permission denied"}, status=403)
        perm = self.get_object(user_id, perm_id)
        if not perm:
            return Response({"error": "Permission override not found"}, status=404)
        perm.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
