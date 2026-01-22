"""
Work Order (Booking) PDF Generator using Playwright
Mirrors the beautiful HTML-to-PDF conversion used for Quotations
"""
import os
import logging
import threading
from django.conf import settings
from playwright.sync_api import sync_playwright

from .html_template import build_work_order_template

logger = logging.getLogger(__name__)


def generate_booking_pdf(booking):
    """
    Generate a professional Work Order PDF from HTML template using Playwright
    """
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'booking_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Filename changed to WorkOrder
    filename = f"WorkOrder_{booking.booking_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    result = {
        'success': False,
        'filepath': filepath,
        'filename': filename,
        'error': None
    }

    def worker():
        try:
            logger.info(f"Building HTML template for work order: {booking.booking_id}")
            html_content = build_work_order_template(booking)
            
            with sync_playwright() as p:
                logger.info("Launching browser for Work Order generation...")
                browser = p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                )
                
                context = browser.new_context()
                page = context.new_page()
                
                page.set_content(html_content, wait_until='networkidle')
                
                logger.info(f"Saving Work Order PDF to: {filepath}")
                page.pdf(
                    path=filepath,
                    format='A4',
                    print_background=True,
                    margin={'top': '0mm', 'right': '0mm', 'bottom': '0mm', 'left': '0mm'}
                )
                
                browser.close()
                result['success'] = True
        except Exception as e:
            logger.error(f"Error in Work Order PDF worker: {str(e)}", exc_info=True)
            result['error'] = str(e)

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join()

    if result['success']:
        return result['filepath'], result['filename']
    else:
        raise Exception(f"Failed to generate Work Order PDF: {result.get('error')}")