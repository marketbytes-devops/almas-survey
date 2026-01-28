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
        Returns dictionary of effective permissions: role base + user overrides.
        No automatic full access here — superadmin bypass is only in has_effective_permission.
        """
        effective = {}

        if self.role:
            for perm in self.role.permissions.all():
                effective[perm.page] = {
                    "can_view": perm.can_view,
                    "can_add": perm.can_add,
                    "can_edit": perm.can_edit,
                    "can_delete": perm.can_delete,
                }

        overrides = self.permission_overrides.all()
        for uperm in overrides:
            effective[uperm.page] = {
                "can_view": uperm.can_view,
                "can_add": uperm.can_add,
                "can_edit": uperm.can_edit,
                "can_delete": uperm.can_delete,
            }

        return effective

    def has_effective_permission(self, page, action):
        """
        Check if user has permission for page + action.
        Superadmin role and Django superusers always pass.
        """
        if self.is_superuser or (self.role and self.role.name == "Superadmin"):
            return True

        perms = self.get_effective_permissions()
        page_perm = perms.get(page, {})
        allowed = page_perm.get(f"can_{action}", False)
        return allowed


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
    )
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


@receiver(post_save, sender=Role)
def set_default_permissions(sender, instance, created, **kwargs):
    if created:
        is_superadmin = instance.name.strip().lower() == "superadmin"

        all_pages = [
            "Dashboard",
            "Profile",
            "enquiries",
            "new_enquiries",
            "follow_ups",
            "processing_enquiries",
            "scheduled_surveys",
            "survey_details",
            "survey_summary",
            "quotation",
            "booking",
            "inventory",
            "pricing",
            "local_move",
            "international_move",
            "additional_settings",
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

        for page in all_pages:
            allowed = is_superadmin or (page in ["Dashboard", "Profile"])

            Permission.objects.update_or_create(
                role=instance,
                page=page,
                defaults={
                    "can_view": allowed,
                    "can_add": allowed,
                    "can_edit": allowed,
                    "can_delete": allowed,
                },
            )