#!/usr/bin/env python
import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = %s 
            AND column_name = %s
            """,
            [table_name, column_name]
        )
        return cursor.fetchone()[0] > 0

def add_missing_columns():
    """Add missing columns to tables"""
    with connection.cursor() as cursor:
        try:
            # Check and add role_id column if missing
            if not column_exists('authapp_customuser', 'role_id'):
                print("Adding missing role_id column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN role_id BIGINT NULL,
                    ADD CONSTRAINT authapp_customuser_role_fk 
                    FOREIGN KEY (role_id) REFERENCES authapp_role(id) 
                    ON DELETE SET NULL
                """)
                print("Added role_id column")
            else:
                print("role_id column already exists")
            
            # Check and add name column if missing
            if not column_exists('authapp_customuser', 'name'):
                print("Adding missing name column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN name VARCHAR(255) DEFAULT ''
                """)
                print("Added name column")
            else:
                print("name column already exists")
            
            # Check and add phone_number column if missing
            if not column_exists('authapp_customuser', 'phone_number'):
                print("Adding missing phone_number column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN phone_number VARCHAR(15) DEFAULT ''
                """)
                print("Added phone_number column")
            else:
                print("phone_number column already exists")
            
            # Check and add address column if missing
            if not column_exists('authapp_customuser', 'address'):
                print("Adding missing address column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN address TEXT
                """)
                print("Added address column")
            else:
                print("address column already exists")
            
            # Check and add image column if missing
            if not column_exists('authapp_customuser', 'image'):
                print("Adding missing image column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN image VARCHAR(100) NULL
                """)
                print("Added image column")
            else:
                print("image column already exists")
            
            # Check and add username column if missing
            if not column_exists('authapp_customuser', 'username'):
                print("Adding missing username column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN username VARCHAR(150) NULL UNIQUE
                """)
                print("Added username column")
            else:
                print("username column already exists")
            
            # Check and add otp_expiry column if missing (renamed from otp_created_at)
            if not column_exists('authapp_customuser', 'otp_expiry'):
                print("Adding missing otp_expiry column to authapp_customuser...")
                cursor.execute("""
                    ALTER TABLE authapp_customuser 
                    ADD COLUMN otp_expiry DATETIME(6) NULL
                """)
                print("Added otp_expiry column")
                
                # Check if old otp_created_at column exists and migrate data
                if column_exists('authapp_customuser', 'otp_created_at'):
                    print("Migrating data from otp_created_at to otp_expiry...")
                    cursor.execute("""
                        UPDATE authapp_customuser 
                        SET otp_expiry = otp_created_at 
                        WHERE otp_created_at IS NOT NULL
                    """)
                    print("Data migrated from otp_created_at to otp_expiry")
            else:
                print("otp_expiry column already exists")
                
            # Check if role column exists (old column that might need to be removed)
            if column_exists('authapp_customuser', 'role') and column_exists('authapp_customuser', 'role_id'):
                print("Both role and role_id columns exist. Migrating data...")
                # Check if role column has string data
                cursor.execute("DESCRIBE authapp_customuser role")
                role_type = cursor.fetchone()[1]
                
                if 'char' in role_type.lower() or 'text' in role_type.lower():
                    # Migrate string role to role_id
                    cursor.execute("""
                        UPDATE authapp_customuser cu
                        JOIN authapp_role r ON cu.role = r.name
                        SET cu.role_id = r.id
                        WHERE cu.role IS NOT NULL AND cu.role_id IS NULL
                    """)
                    print("Migrated role data to role_id")
            
            # Check and add columns to contact_enquiry if missing
            if check_table_exists('contact_enquiry'):
                # Add assigned_user_id column
                if not column_exists('contact_enquiry', 'assigned_user_id'):
                    print("Adding missing assigned_user_id column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN assigned_user_id BIGINT NULL,
                        ADD CONSTRAINT contact_enquiry_user_fk 
                        FOREIGN KEY (assigned_user_id) REFERENCES authapp_customuser(id) 
                        ON DELETE SET NULL
                    """)
                    print("Added assigned_user_id column to contact_enquiry")
                else:
                    print("assigned_user_id column already exists in contact_enquiry")
                
                # Add note column
                if not column_exists('contact_enquiry', 'note'):
                    print("Adding missing note column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN note TEXT NULL
                    """)
                    print("Added note column to contact_enquiry")
                else:
                    print("note column already exists in contact_enquiry")
                
                # Add contact_status column
                if not column_exists('contact_enquiry', 'contact_status'):
                    print("Adding missing contact_status column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN contact_status VARCHAR(50) NULL,
                        ADD INDEX contact_enq_contact_2116b9_idx (contact_status)
                    """)
                    print("Added contact_status column to contact_enquiry")
                else:
                    print("contact_status column already exists in contact_enquiry")
                
                # Add contact_status_note column
                if not column_exists('contact_enquiry', 'contact_status_note'):
                    print("Adding missing contact_status_note column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN contact_status_note TEXT NULL
                    """)
                    print("Added contact_status_note column to contact_enquiry")
                else:
                    print("contact_status_note column already exists in contact_enquiry")
                
                # Add reached_out_email column
                if not column_exists('contact_enquiry', 'reached_out_email'):
                    print("Adding missing reached_out_email column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN reached_out_email BOOLEAN DEFAULT FALSE
                    """)
                    print("Added reached_out_email column to contact_enquiry")
                else:
                    print("reached_out_email column already exists in contact_enquiry")
                
                # Add reached_out_whatsapp column
                if not column_exists('contact_enquiry', 'reached_out_whatsapp'):
                    print("Adding missing reached_out_whatsapp column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN reached_out_whatsapp BOOLEAN DEFAULT FALSE
                    """)
                    print("Added reached_out_whatsapp column to contact_enquiry")
                else:
                    print("reached_out_whatsapp column already exists in contact_enquiry")
                
                # Add survey_date column
                if not column_exists('contact_enquiry', 'survey_date'):
                    print("Adding missing survey_date column to contact_enquiry...")
                    cursor.execute("""
                        ALTER TABLE contact_enquiry 
                        ADD COLUMN survey_date DATETIME(6) NULL,
                        ADD INDEX contact_enq_survey__369145_idx (survey_date)
                    """)
                    print("Added survey_date column to contact_enquiry")
                else:
                    print("survey_date column already exists in contact_enquiry")
                    
        except Exception as e:
            print(f"Error adding columns: {e}")

def fix_role_column():
    """Fix the role column data type issue"""
    with connection.cursor() as cursor:
        try:
            # Check if old 'role' column exists (string type)
            if column_exists('authapp_customuser', 'role'):
                print("Found old 'role' column. Checking its type...")
                cursor.execute("DESCRIBE authapp_customuser role")
                role_info = cursor.fetchone()

                if role_info:
                    role_type = role_info[1]
                    is_nullable = role_info[2]  # YES or NO

                    # If it's a string column and we have role_id, we need to handle it
                    if ('char' in role_type.lower() or 'text' in role_type.lower()):
                        if column_exists('authapp_customuser', 'role_id'):
                            print("Both old 'role' and new 'role_id' columns exist")

                            # First migrate any data
                            cursor.execute("SELECT COUNT(*) FROM authapp_customuser WHERE role = 'superadmin'")
                            count = cursor.fetchone()[0]

                            if count > 0:
                                print(f"Found {count} users with 'superadmin' string in role. Fixing...")

                                # Try to create a superadmin role if it doesn't exist
                                cursor.execute("SELECT id FROM authapp_role WHERE name = 'superadmin'")
                                result = cursor.fetchone()

                                if result:
                                    role_id = result[0]
                                    print(f"Found superadmin role with id {role_id}")
                                else:
                                    print("No superadmin role found. Creating one...")
                                    cursor.execute("INSERT INTO authapp_role (name, description) VALUES ('superadmin', 'Super Administrator')")
                                    role_id = cursor.lastrowid
                                    print(f"Created superadmin role with id {role_id}")

                                # Update users to use the actual role ID
                                cursor.execute(
                                    "UPDATE authapp_customuser SET role_id = %s WHERE role = 'superadmin' AND role_id IS NULL",
                                    [role_id]
                                )
                                print(f"Updated users to use role_id {role_id}")

                            # Now drop the old role column
                            print("Dropping old 'role' string column...")
                            cursor.execute("ALTER TABLE authapp_customuser DROP COLUMN role")
                            print("Dropped old 'role' column")
                        else:
                            # Old role exists but role_id doesn't - this shouldn't happen but handle it
                            print("Old 'role' column exists but 'role_id' doesn't. Making it nullable...")
                            cursor.execute("ALTER TABLE authapp_customuser MODIFY COLUMN role VARCHAR(100) NULL")
                            print("Made old 'role' column nullable")
        except Exception as e:
            print(f"Error fixing role column: {e}")

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = %s",
            [table_name]
        )
        return cursor.fetchone()[0] > 0

def create_missing_tables():
    """Create missing tables if they don't exist"""
    with connection.cursor() as cursor:
        try:
            # Create authapp_permission table if it doesn't exist
            if not check_table_exists('authapp_permission'):
                print("Creating authapp_permission table...")
                cursor.execute("""
                    CREATE TABLE authapp_permission (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        page VARCHAR(100) NOT NULL,
                        can_view BOOLEAN NOT NULL DEFAULT FALSE,
                        can_add BOOLEAN NOT NULL DEFAULT FALSE,
                        can_edit BOOLEAN NOT NULL DEFAULT FALSE,
                        can_delete BOOLEAN NOT NULL DEFAULT FALSE,
                        role_id BIGINT NOT NULL,
                        FOREIGN KEY (role_id) REFERENCES authapp_role(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_role_page (role_id, page)
                    )
                """)
                print("Created authapp_permission table")
            else:
                print("authapp_permission table already exists")
        except Exception as e:
            print(f"Error creating tables: {e}")

def main():
    print("Starting migration fixes...")
    
    # Create missing tables first (like authapp_permission)
    create_missing_tables()
    
    # Add missing columns
    add_missing_columns()
    
    # Fix role column issues
    fix_role_column()
    
    # Check for existing tables
    tables_to_check = ['authapp_permission', 'authapp_role']
    for table in tables_to_check:
        if check_table_exists(table):
            print(f"Table {table} exists")
        else:
            print(f"Table {table} does not exist")
    
    print("Migration fixes completed")

if __name__ == "__main__":
    main()