from django.db.models import QuerySet

class RowLevelFilterMixin:
    """
    Mixin to provide consistent row-level filtering based on user assignment.
    """
    def get_row_level_queryset(self, queryset, user, user_field='assigned_user'):
        """
        Filters the queryset based on the user's assignment.
        Superusers (Django Admin) bypass this check.
        All other users (including 'Superadmin' role) are filtered.
        """
        if user.is_superuser:
            return queryset
        
        filter_kwargs = {user_field: user}
        return queryset.filter(**filter_kwargs)
