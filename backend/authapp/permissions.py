from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)

class HasPagePermission(BasePermission):
    """
    Custom permission to check if user has permission for a specific page and action.
    
    Usage examples:
    - permission_classes = [HasPagePermission('enquiries')]                  # defaults to 'view'
    - permission_classes = [HasPagePermission('enquiries', action='edit')]
    - Or pass page in view: view.permission_page_slug = 'scheduled_surveys'
    """
    def __init__(self, page_slug=None, action=None):
        self.page_slug = page_slug
        self.required_action = action  # 'view', 'add', 'edit', 'delete', etc.

    def has_permission(self, request, view):
        user = request.user
        
        # Superadmin / superuser always allowed
        if user.is_superuser or (hasattr(user, 'role') and user.role.name == "Superadmin"):
            return True

        if not user.is_authenticated:
            return False

        # Get page_slug: from init arg → view attribute → fallback to None
        page_slug = (
            self.page_slug or 
            getattr(view, 'permission_page_slug', None)
        )

        if not page_slug:
            logger.warning(f"No page_slug defined for view {view.__class__.__name__} - allowing by default")
            return True  # or return False if you want strict mode

        # Determine required action
        action = self.required_action
        
        if not action:
            # Auto-detect from DRF action or HTTP method
            drf_action = getattr(view, 'action', None)
            method = request.method

            if drf_action in ['list', 'retrieve']:
                action = 'view'
            elif drf_action in ['create', 'create_draft', 'upload_signature']:
                action = 'add'
            elif drf_action in ['update', 'partial_update', 'schedule', 'cancel', 
                               'contact_status_update', 'assign', 'reschedule']:
                action = 'edit'
            elif drf_action in ['destroy', 'delete_quotation', 'delete']:
                action = 'delete'
            else:
                # Fallback to HTTP method
                action_map = {
                    'GET': 'view',
                    'POST': 'add',
                    'PUT': 'edit',
                    'PATCH': 'edit',
                    'DELETE': 'delete'
                }
                action = action_map.get(method, 'view')

        # Log for debugging
        logger.debug(f"Permission check: user={user.email}, page={page_slug}, action={action}")

        # Call your effective permission method
        # Make sure this method exists on CustomUser!
        if hasattr(user, 'has_effective_permission'):
            has_perm = user.has_effective_permission(page_slug, action)
            logger.debug(f"Permission result: {has_perm}")
            return has_perm
        else:
            logger.error("CustomUser missing has_effective_permission method!")
            return False