from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class CustomUser(AbstractUser):
    name = models.CharField(max_length=255, blank=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    address = models.TextField(blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    image = models.ImageField(upload_to="profile_images/", null=True, blank=True)
    role = models.ForeignKey(
        "Role", on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    def get_effective_permissions(self):
        """
        Returns a dictionary of effective permissions for this user:
        - Superuser → full access to all pages
        - Role permissions (base) + User-specific overrides (overrides take priority)
        Format: {'page_name': {'can_view': bool, 'can_add': bool, 'can_edit': bool, 'can_delete': bool}}
        """
        # Superuser gets full access to everything
        if self.is_superuser:
            all_pages = [
                "Dashboard",
                "Profile",
                "enquiries",
                "new_enquiries",
                "scheduled_surveys",
                "survey_summary",
                "quotation",
                "booking",
                "inventory",
                "pricing",
                "local_move",
                "international_move",
                "types",
                "units",
                "currency",
                "tax",
                "handyman",
                "manpower",
                "room",
                "additional-services",
                "labours",
                "materials",
                "users",
                "roles",
                "permissions",
            ]
            return {
                page: {
                    "can_view": True,
                    "can_add": True,
                    "can_edit": True,
                    "can_delete": True,
                }
                for page in all_pages
            }

        effective = {}

        # 1. Role permissions (base/default)
        if self.role:
            for perm in self.role.permissions.all():
                effective[perm.page] = {
                    "can_view": perm.can_view,
                    "can_add": perm.can_add,
                    "can_edit": perm.can_edit,
                    "can_delete": perm.can_delete,
                }

        # 2. Apply user-specific overrides (these override role permissions)
        for uperm in self.user_permissions.all():  # ← Consistent related_name
            effective[uperm.page] = {
                "can_view": uperm.can_view,
                "can_add": uperm.can_add,
                "can_edit": uperm.can_edit,
                "can_delete": uperm.can_delete,
            }

        return effective

    def has_effective_permission(self, page, action):
        """
        Check if the user has permission for a specific page and action.
        Usage: user.has_effective_permission('quotation', 'add')
        """
        if self.is_superuser:
            return True

        perms = self.get_effective_permissions()
        page_perm = perms.get(page, {})
        return page_perm.get(f"can_{action}", False)


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class Permission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions")
    page = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_add = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("role", "page")
        verbose_name = "Role Permission"
        verbose_name_plural = "Role Permissions"

    def __str__(self):
        return f"{self.role.name} - {self.page}"


class UserPermission(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="permission_overrides"
    )  # ← Safe new name
    page = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_add = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "page")
        verbose_name = "User Permission Override"
        verbose_name_plural = "User Permission Overrides"

    def __str__(self):
        return f"{self.user.email} - {self.page}"


# In CustomUser:
def get_effective_permissions(self):
    if self.is_superuser:
        all_pages = [...]  # your list
        return {
            page: {
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            }
            for page in all_pages
        }

    effective = {}
    if self.role:
        for perm in self.role.permissions.all():
            effective[perm.page] = {
                "can_view": perm.can_view,
                "can_add": perm.can_add,
                "can_edit": perm.can_edit,
                "can_delete": perm.can_delete,
            }

    for uperm in self.permission_overrides.all():  # ← Matches new related_name
        effective[uperm.page] = {
            "can_view": uperm.can_view,
            "can_add": uperm.can_add,
            "can_edit": uperm.can_edit,
            "can_delete": uperm.can_delete,
        }

    return effective


# Signal to set default role permissions when a new role is created
@receiver(post_save, sender=Role)
def set_default_permissions(sender, instance, created, **kwargs):
    if created:
        default_permissions = [
            # Core / Always Visible
            {
                "page": "Dashboard",
                "can_view": True,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "Profile",
                "can_view": True,
                "can_add": False,
                "can_edit": True,
                "can_delete": False,
            },
            # Enquiries & Survey Flow
            {
                "page": "enquiries",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": False,
            },
            {
                "page": "new_enquiries",
                "can_view": True,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "scheduled_surveys",
                "can_view": True,
                "can_add": False,
                "can_edit": True,
                "can_delete": False,
            },
            {
                "page": "survey_summary",
                "can_view": True,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            # Quotation & Booking (core revenue modules)
            {
                "page": "quotation",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "booking",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": False,
            },
            # Inventory & Execution
            {
                "page": "inventory",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            # Pricing (rate cards - sensitive)
            {
                "page": "pricing",
                "can_view": True,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "local_move",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "international_move",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            # Additional Settings (masters)
            {
                "page": "types",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "units",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "currency",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "tax",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "handyman",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "manpower",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "room",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "additional-services",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "labours",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "materials",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            # Admin / RBAC
            {
                "page": "users",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "roles",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": True,
            },
            {
                "page": "permissions",
                "can_view": True,
                "can_add": True,
                "can_edit": True,
                "can_delete": False,
            },
        ]

        for perm in default_permissions:
            Permission.objects.get_or_create(
                role=instance,
                page=perm["page"],
                defaults={
                    "can_view": perm.get("can_view", False),
                    "can_add": perm.get("can_add", False),
                    "can_edit": perm.get("can_edit", False),
                    "can_delete": perm.get("can_delete", False),
                },
            )
