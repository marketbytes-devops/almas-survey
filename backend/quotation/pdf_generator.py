"""
PDF Generator using Playwright for beautiful HTML-to-PDF conversion
Replaces the old ReportLab-based PDF generation
"""
import os
import logging
from django.conf import settings
from playwright.sync_api import sync_playwright

from .html_template import build_html_template

logger = logging.getLogger(__name__)


import threading

def generate_quotation_pdf(quotation):
    """
    Generate a beautiful PDF from HTML template using Playwright
    """
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'quotation_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    filename = f"Quotation_{quotation.quotation_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    result = {
        'success': False,
        'filepath': filepath,
        'filename': filename,
        'error': None,
        'traceback': None
    }

    def worker():
        try:
            logger.info(f"Building HTML template for quotation: {quotation.quotation_id}")
            html_content = build_html_template(quotation)
            logger.info(f"HTML template built successfully. Length: {len(html_content)}")
            
            logger.info(f"About to enter sync_playwright() for: {quotation.quotation_id}")
            with sync_playwright() as p:
                logger.info(f"Launching browser for PDF generation: {quotation.quotation_id}")
                browser = p.chromium.launch(headless=True)
                logger.info("Browser launched successfully.")
                
                context = browser.new_context()
                page = context.new_page()
                
                logger.info("Setting page content...")
                page.set_content(html_content, wait_until='networkidle')
                
                logger.info(f"Saving PDF to: {filepath}")
                page.pdf(
                    path=filepath,
                    format='A4',
                    print_background=True,
                    margin={'top': '0mm', 'right': '0mm', 'bottom': '0mm', 'left': '0mm'}
                )
                
                browser.close()
                logger.info(f"PDF generated successfully: {filepath}")
                result['success'] = True
        except Exception as e:
            import traceback
            error_str = str(e).encode('ascii', 'replace').decode('ascii')
            result['error'] = f"{type(e).__name__}: {error_str}"
            result['traceback'] = traceback.format_exc().encode('ascii', 'replace').decode('ascii')
            logger.error(f"Error in PDF worker thread: {result['error']}")
            logger.error(result['traceback'])

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join()

    if result['success']:
        return result['filepath'], result['filename']
    else:
        error_msg = result.get('error', 'Unknown error in PDF generation thread')
        raise Exception(f"Failed to generate PDF: {error_msg}")