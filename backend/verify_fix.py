import sys
import os
import django

# Setup Django - not strictly needed if running via shell < script, but good practice
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
# django.setup()

from authapp.models import CustomUser, Role, UserPermission
from authapp.serializers import UserCreateSerializer, UserPermissionSerializer

# Cleanup previous test data
print("Cleaning up old test data...")
CustomUser.objects.filter(email='verify_fix@example.com').delete()

print("\n--- Test 1: User Creation Password Logging ---")
role = Role.objects.first()
if not role:
    print("No roles found inside DB. Cannot create user.")
else:
    data = {
        'email': 'verify_fix@example.com',
        'username': 'verify_fix',
        'name': 'Verify Fix',
        'role_id': role.id
    }
    serializer = UserCreateSerializer(data=data)
    if serializer.is_valid():
        # This calling save() triggers the print statement we added
        user = serializer.save()
        print("User created via serializer.")
    else:
        print("User creation failed:", serializer.errors)

print("\n--- Test 2: Permission Creation with User Association ---")
if 'user' in locals():
    # Simulate the logic from UserPermissionListCreateView.post (CREATE path)
    
    # Define data WITHOUT user (as it comes from request.data, since 'user' is read_only)
    perm_data = {
        'page': 'verify_page',
        'can_view': False,
        'can_add': False,
        'can_edit': False,
        'can_delete': False
    }
    
    ps = UserPermissionSerializer(data=perm_data)
    if ps.is_valid():
        try:
            # THIS IS THE FIX WE APPLIED: passing user=user
            # If we didn't pass user=user, this would fail with integrity error or validation error
            instance = ps.save(user=user)
            print(f"Permission created successfully: {instance}")
            
            # Verify it's in DB
            saved = UserPermission.objects.filter(user=user, page='verify_page').exists()
            print(f"Permission exists in DB: {saved}")
            
            # --- Test 3: Permission Update (Fix for 500 Error) ---
            print("\n--- Test 3: Permission Update Logic ---")
            # Mimic UserPermissionDetailView.get_object
            try:
                # This line was crashing before: user.user_permissions.get(...)
                # Now it should be user.permission_overrides.get(...)
                perm_obj = user.permission_overrides.get(page='verify_page')
                print(f"Successfully retrieved permission object: {perm_obj}")
                
                # Check if we can access it via the correct relation
                if perm_obj.user == user:
                    print("Relation verification PASSED.")
                else:
                    print("Relation verification FAILED.")
                    
            except Exception as e:
                print(f"CRITICAL: Failed to retrieve permission object. This would cause 500 error. Error: {e}")

        except Exception as e:
            print(f"Result: FAILED with error: {e}")
    else:
        print("Serializer invalid:", ps.errors)
