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
        Superadmin always passes — regular users use effective permissions.
        """
        if self.is_superuser:
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
        default_permissions = [
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
            {
                "page": "enquiries",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "new_enquiries",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "scheduled_surveys",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "survey_summary",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "survey_details",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "follow_ups",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "processing_enquiries",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "quotation",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "booking",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "inventory",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "pricing",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "local_move",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "international_move",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "types",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "units",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "currency",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "tax",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "handyman",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "manpower",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "room",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "additional-services",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "labours",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "materials",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "users",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "roles",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
                "can_delete": False,
            },
            {
                "page": "permissions",
                "can_view": False,
                "can_add": False,
                "can_edit": False,
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
