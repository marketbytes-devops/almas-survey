import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authapp.models import CustomUser, Role, UserPermission

def test_permissions():
    # 1. Setup Roles
    superadmin_role, _ = Role.objects.get_or_create(name="Superadmin")
    manager_role, _ = Role.objects.get_or_create(name="Manager")

    print(f"Testing Superadmin creation...")
    user_sa = CustomUser.objects.create(
        email="sa_test@example.com",
        username="sa_test",
        name="SA Test",
        role=superadmin_role
    )
    # Check overrides
    sa_overrides = UserPermission.objects.filter(user=user_sa).count()
    print(f"Superadmin overrides count: {sa_overrides}")
    
    # Check a random page
    enquiry_perm = UserPermission.objects.filter(user=user_sa, page="enquiries").first()
    if enquiry_perm and enquiry_perm.can_view:
        print("SA Enquiry permission: OK")
    else:
        print("SA Enquiry permission: FAILED")

    print(f"\nTesting Manager creation...")
    user_mgr = CustomUser.objects.create(
        email="mgr_test@example.com",
        username="mgr_test",
        name="Mgr Test",
        role=manager_role
    )
    # Check overrides
    mgr_overrides = UserPermission.objects.filter(user=user_mgr).count()
    print(f"Manager overrides count: {mgr_overrides}")
    
    # Check Dashboard and Profile
    dash_perm = UserPermission.objects.filter(user=user_mgr, page="Dashboard").first()
    enq_perm = UserPermission.objects.filter(user=user_mgr, page="enquiries").first()
    
    if dash_perm and dash_perm.can_view:
        print("Mgr Dashboard permission: OK")
    else:
        print("Mgr Dashboard permission: FAILED")
        
    if enq_perm and not enq_perm.can_view:
        print("Mgr Enquiry override (Explicit False): OK")
    elif enq_perm is None:
        print("Mgr Enquiry override (None): FAILED - Should be explicit False")
    else:
        print("Mgr Enquiry override (True): FAILED")

    # Cleanup
    user_sa.delete()
    user_mgr.delete()

if __name__ == "__main__":
    test_permissions()
