"""
Simple test script to verify PDF generation works
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from quotation.models import Quotation
from quotation.pdf_generator import generate_quotation_pdf

def test_pdf_generation():
    """Test PDF generation for the first quotation in the database"""
    try:
        # Get the first quotation
        quotation = Quotation.objects.select_related('survey', 'currency').first()
        
        if not quotation:
            print("❌ No quotations found in the database")
            return False
        
        print(f"✅ Found quotation: {quotation.quotation_id}")
        print(f"   Survey: {quotation.survey.survey_id if quotation.survey else 'N/A'}")
        
        # Generate PDF
        print("\n🔄 Generating PDF with Playwright...")
        filepath, filename = generate_quotation_pdf(quotation)
        
        # Check if file exists
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath) / 1024  # Size in KB
            print(f"\n✅ PDF Generated Successfully!")
            print(f"   File: {filename}")
            print(f"   Path: {filepath}")
            print(f"   Size: {file_size:.2f} KB")
            return True
        else:
            print(f"\n❌ PDF file not found at: {filepath}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Playwright PDF Generation")
    print("=" * 60)
    success = test_pdf_generation()
    sys.exit(0 if success else 1)
