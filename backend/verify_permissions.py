import os
import django
import sys

# Setup Django environment
sys.path.append(r'd:\MarketBytes\web-works\almas-survey\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authapp.models import CustomUser, Role
from contact.models import Enquiry
from django.test import RequestFactory
from contact.views import EnquiryListCreate

def verify_isolation():
    print("--- Starting Verification ---")
    
    # 1. Setup Roles and Users
    admin_role, _ = Role.objects.get_or_create(name="Superadmin")
    
    user1, _ = CustomUser.objects.get_or_create(
        email="user1@example.com", 
        defaults={"username": "user1", "role": admin_role}
    )
    user1.set_password("pass123")
    user1.save()
    
    user2, _ = CustomUser.objects.get_or_create(
        email="user2@example.com", 
        defaults={"username": "user2", "role": admin_role}
    )
    user2.set_password("pass123")
    user2.save()
    
    # Setup a genuine Django superuser
    superuser, _ = CustomUser.objects.get_or_create(
        email="admin@example.com",
        defaults={"username": "admin", "is_superuser": True, "is_staff": True}
    )
    
    # 2. Setup Data
    Enquiry.objects.filter(email__in=["e1@test.com", "e2@test.com"]).delete()
    e1 = Enquiry.objects.create(fullName="Enquiry 1", email="e1@test.com", assigned_user=user1)
    e2 = Enquiry.objects.create(fullName="Enquiry 2", email="e2@test.com", assigned_user=user2)
    
    factory = RequestFactory()
    
    def test_view_for_user(user, expected_count, label):
        request = factory.get('/api/contact/enquiries/')
        request.user = user
        view = EnquiryListCreate.as_view()
        response = view(request)
        count = len(response.data)
        print(f"[{label}] Expected: {expected_count}, Got: {count}")
        return count == expected_count

    success = True
    success &= test_view_for_user(user1, 1, "User 1 (Superadmin Role)")
    success &= test_view_for_user(user2, 1, "User 2 (Superadmin Role)")
    success &= test_view_for_user(superuser, Enquiry.objects.count(), "Django Superuser (All access)")
    
    # Check role deletion (The bug fix)
    from authapp.views import RoleDetailView
    def test_role_deletion(user, label):
        temp_role = Role.objects.create(name=f"TempRole_{label}")
        request = factory.delete(f'/api/auth/roles/{temp_role.id}/')
        request.user = user
        view = RoleDetailView.as_view()
        response = view(request, pk=temp_role.id)
        
        still_exists = Role.objects.filter(id=temp_role.id).exists()
        print(f"[{label} Role Delete] Status: {response.status_code}, Still exists: {still_exists}")
        return response.status_code == 204 and not still_exists

    success &= test_role_deletion(user1, "User 1 (Superadmin Role)")
    success &= test_role_deletion(superuser, "Django Superuser")
    
    if success:
        print("\nVerification SUCCESS: All administration bugs and row-level isolations are fixed!")
    else:
        print("\nVerification FAILED: check the logic above.")
    
    if success:
        print("\nVerification SUCCESS: Row-level isolation is working correctly!")
    else:
        print("\nVerification FAILED: check the logic above.")

if __name__ == "__main__":
    verify_isolation()
