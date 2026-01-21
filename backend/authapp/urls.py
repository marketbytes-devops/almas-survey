from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RequestOTPView,
    ResetPasswordView,
    ProfileView,
    ChangePasswordView,
    CustomTokenObtainPairView,
    RoleListCreateView,
    RoleDetailView,
    PermissionListCreateView,
    PermissionDetailView,
    UserListCreateView,
    UserDetailView,
    UserPermissionListCreateView,
    UserPermissionDetailView,
    EffectivePermissionsView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("request-otp/", RequestOTPView.as_view(), name="request_otp"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    path("roles/", RoleListCreateView.as_view(), name="role_list_create"),
    path("roles/<int:pk>/", RoleDetailView.as_view(), name="role_detail"),

    path("permissions/", PermissionListCreateView.as_view(), name="permission_list_create"),
    path("permissions/<int:pk>/", PermissionDetailView.as_view(), name="permission_detail"),
    path("effective-permissions/", EffectivePermissionsView.as_view(), name="effective_permissions"),

    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user_detail"),

    path("users/<int:user_id>/permissions/", UserPermissionListCreateView.as_view(), name="user_permission_list_create"),
    path("users/<int:user_id>/permissions/<int:perm_id>/", UserPermissionDetailView.as_view(), name="user_permission_detail"),
]