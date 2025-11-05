from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Role, Permission


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'name', 'username', 'role', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'role')
    search_fields = ('email', 'name', 'username')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {
            'fields': ('name', 'username', 'address', 'phone_number', 'image')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'role', 'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'username', 'role', 'password1', 'password2', 'is_staff', 'is_superuser', 'is_active'),
        }),
    )

    readonly_fields = ('date_joined', 'last_login')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    ordering = ('name',)
    fieldsets = (
        (None, {'fields': ('name', 'description')}),
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    list_filter = ('role', 'page')
    search_fields = ('role__name', 'page')
    ordering = ('role', 'page')
    fieldsets = (
        (None, {'fields': ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')}),
    )