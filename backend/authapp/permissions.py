from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role and request.user.role.name == 'Admin'

class HasPagePermission(BasePermission):
    """
    Custom permission to check if user has permission for a specific page.
    Usage: permission_classes = [HasPagePermission('quotation')]
    """
    def __init__(self, page_slug=None):
        self.page_slug = page_slug

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True

        page_slug = self.page_slug or getattr(view, 'permission_page_slug', None)
        if not page_slug:
            return True

        action_map = {
            'GET': 'view',
            'POST': 'add',
            'PUT': 'edit',
            'PATCH': 'edit',
            'DELETE': 'delete'
        }
        
        drf_action = getattr(view, 'action', None)
        action = 'view'
        if drf_action in ['create', 'create_draft', 'upload_signature', 'send_whatsapp', 'send_email']:
            action = 'add'
        elif drf_action in ['update', 'partial_update']:
            action = 'edit'
        elif drf_action in ['destroy', 'delete_quotation']:
            action = 'delete'
        else:
            action = action_map.get(request.method, 'view')

        return request.user.has_effective_permission(page_slug, action)