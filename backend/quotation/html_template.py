"""
HTML Template Generator for Quotation PDFs
Mirrors the QuotationLocalMove.jsx component's HTML/CSS structure
"""
import os
from datetime import datetime
from django.conf import settings


def get_certification_logos():
    """Return paths to certification logo files"""
    logos = ['iam.webp', 'iamx.webp', 'iso.webp', 'pcg.webp', 'trusted.webp']
    base_path = os.path.join(settings.BASE_DIR, 'quotation', 'static', 'quotation', 'images')
    return [os.path.join(base_path, logo) for logo in logos]


import base64

def get_base64_image(file_path):
    """Encode image file to base64 data URI"""
    if not file_path or not os.path.exists(file_path):
        return ""
    try:
        ext = os.path.splitext(file_path)[1].lower().replace('.', '')
        mime_type = f"image/{ext}" if ext != 'jpg' else "image/jpeg"
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return f"data:{mime_type};base64,{encoded_string}"
    except Exception:
        return ""


def format_currency(amount):
    """Format amount as currency with 2 decimal places"""
    try:
        return f"{float(amount or 0):,.2f}"
    except (ValueError, TypeError):
        return "0.00"


def build_html_template(quotation):
    """
    Build complete HTML template with inline CSS for PDF generation
    Matches the design from QuotationLocalMove.jsx
    """
    survey = quotation.survey
    currency = quotation.currency.code if quotation.currency else "QAR"

    customer_name = getattr(survey, 'full_name', 'Valued Customer') if survey else 'Valued Customer'
    phone = getattr(survey, 'phone_number', 'N/A') if survey else 'N/A'
    email = getattr(survey, 'email', 'N/A') if survey else 'N/A'
    
    service_type_map = {
        'localMove': 'Local Move',
        'internationalMove': 'International Move',
        'carExport': 'Car Import and Export',
        'storageServices': 'Storage Services',
        'logistics': 'Logistics',
    }
    service_type = service_type_map.get(
        getattr(survey, 'service_type', 'localMove') if survey else 'localMove',
        'Local Move'
    )
    
    origin = 'Doha, Qatar'
    if survey:
        origin = getattr(survey, 'origin_city', None) or getattr(survey, 'origin_address', 'Doha, Qatar')
    
    destination = 'Doha, Qatar'
    if survey and hasattr(survey, 'destination_addresses') and survey.destination_addresses.exists():
        dest = survey.destination_addresses.first()
        destination = getattr(dest, 'city', None) or getattr(dest, 'address', 'Doha, Qatar')
    
    move_date = 'TBA'
    if survey and survey.packing_date_from:
        move_date = survey.packing_date_from.strftime('%d %B %Y')
    
    volume = 'TBA'
    if survey and hasattr(survey, 'articles'):
        try:
            total_volume = sum(
                float(article.volume or 0) * (article.quantity or 1) 
                for article in survey.articles.all()
            )
            if total_volume > 0:
                volume = f"{total_volume:.2f} CBM"
        except:
            volume = 'TBA'
    
    amount = float(quotation.amount or 0)
    discount = float(quotation.discount or 0)
    final_amount = float(quotation.final_amount or (amount - discount))
    advance = float(quotation.advance or 0)
    balance = float(quotation.balance or (final_amount - advance))
    
    total_price = format_currency(amount)
    discount_amt = format_currency(discount)
    final_amt = format_currency(final_amount)
    advance_amt = format_currency(advance)
    balance_amt = format_currency(balance)
    
    quote_number = quotation.quotation_id or "AMS/2600001"
    today_formatted = datetime.now().strftime('%d %B %Y')
    
    breakdown_rows = ""
    
    if quotation.additional_charges:
        for charge in quotation.additional_charges:
            service_name = charge.get('service_name', 'Additional Service')
            qty = int(charge.get('quantity', 1))
            per_unit_base = float(charge.get('per_unit_quantity', 1))
            price = float(charge.get('price_per_unit', 0))
            total = (price / per_unit_base) * qty
            
            breakdown_rows += f"""
                <div class="summary-line">
                    <span class="label">{service_name} x {qty}:</span>
                    <span class="value">{format_currency(total)}</span>
                </div>
            """
    
    discount_row = ""
    if discount > 0:
        discount_row = f"""
            <div class="summary-line">
                <span class="label">Discount:</span>
                <span class="value text-red">-{discount_amt}</span>
            </div>
        """
    
    from additional_settings.models import SurveyAdditionalService
    
    included_services = []
    if quotation.included_services:
        for service_id in quotation.included_services:
            try:
                service = SurveyAdditionalService.objects.get(id=service_id)
                included_services.append(service.name)
            except SurveyAdditionalService.DoesNotExist:
                pass
    
    excluded_services = []
    if quotation.excluded_services:
        for service_id in quotation.excluded_services:
            try:
                service = SurveyAdditionalService.objects.get(id=service_id)
                excluded_services.append(service.name)
            except SurveyAdditionalService.DoesNotExist:
                pass
    
    inclusions_html = ""
    for item in included_services:
        inclusions_html += f'<li><span class="check-icon">✓</span> {item}</li>'
    
    if not inclusions_html:
        inclusions_html = '<li><span class="check-icon">✓</span> Standard Packing</li><li><span class="check-icon">✓</span> Transport</li>'
    
    exclusions_html = ""
    for item in excluded_services:
        exclusions_html += f'<li><span class="cross-icon">✗</span> {item}</li>'
    
    if not exclusions_html:
        exclusions_html = '<li><span class="cross-icon">✗</span> Customs Duties</li><li><span class="cross-icon">✗</span> Storage</li>'
    
    from pricing.models import PaymentTerm
    payment_terms = PaymentTerm.objects.filter(is_active=True).order_by('order')
    
    payment_terms_html = ""
    for term in payment_terms:
        payment_terms_html += f'<div class="term-item"><div class="term-desc">{term.description or ""}</div></div>'
    
    if not payment_terms_html:
        payment_terms_html = '<div>Standard Payment Terms Apply</div>'

    from pricing.models import QuoteNote
    quote_notes = QuoteNote.objects.filter(is_active=True).order_by('order')
    
    notes_html = ""
    for note in quote_notes:
        notes_html += f'<div class="note-item">{note.content}</div>'
    
    notes_section = f'<div class="terms-box"><h3>IMPORTANT NOTES</h3><div class="text-content">{notes_html}</div></div>' if notes_html else ''
    
    from quotation.models import QuotationRemark
    survey_remarks_html = ""
    if quotation.remarks:
        remarks = QuotationRemark.objects.filter(id__in=quotation.remarks, is_active=True)
        for remark in remarks:
            survey_remarks_html += f'<div class="remark-item">{remark.description}</div>'
    
    remarks_section = f"""
        <section class="remarks-section" style="margin-bottom: 30px;">
            <div class="terms-box">
                <h3>REMARKS</h3>
                <div class="text-content">{survey_remarks_html}</div>
            </div>
        </section>
    """ if survey_remarks_html else ''
    
    survey_signature_img = ""
    if survey and hasattr(survey, 'signature') and survey.signature:
        try:
            signature_path = survey.signature.path
            if os.path.exists(signature_path):
                b64_sig = get_base64_image(signature_path)
                if b64_sig:
                    survey_signature_img = f'<img src="{b64_sig}" class="signature-img" />'
        except:
            pass
    
    quotation_signature_img = ""
    if quotation.signature:
        try:
            signature_path = quotation.signature.path
            if os.path.exists(signature_path):
                b64_sig = get_base64_image(signature_path)
                if b64_sig:
                    quotation_signature_img = f'<img src="{b64_sig}" class="signature-img" />'
        except:
            pass
    
    logo_path = os.path.join(settings.BASE_DIR, 'quotation', 'static', 'quotation', 'images', 'logo-quotation.webp')
    logo_b64 = get_base64_image(logo_path)
    
    cert_logos = ['iam.webp', 'iamx.webp', 'iso.webp', 'pcg.webp', 'trusted.webp']
    cert_logos_html = ""
    for logo in cert_logos:
        logo_file_path = os.path.join(settings.BASE_DIR, 'quotation', 'static', 'quotation', 'images', logo)
        logo_b64_item = get_base64_image(logo_file_path)
        if logo_b64_item:
            cert_logos_html += f'<img src="{logo_b64_item}" class="footer-cert-logo" />'
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Quotation {quote_number}</title>
        <style>
            {get_styles()}
        </style>
    </head>
    <body>
        <div class="page-container">
            <table class="print-wrapper">
                <thead>
                    <tr><td><div class="page-header-space"></div></td></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="print-actual-content">
                                <!-- HEADER -->
                                <header class="header">
                                    <div class="brand-col">
                                        <img src="{logo_b64}" alt="Almas Movers" class="logo"/>
                                        <div class="company-address">
                                            P.O. Box 24665, Doha, Qatar<br>
                                            Freight@almasint.com | +974 5013 6999
                                        </div>
                                    </div>
                                    <div class="meta-col">
                                        <h1 class="doc-title">QUOTATION</h1>
                                        <div class="meta-details">
                                            <p><strong>Quote No:</strong> {quote_number}</p>
                                            <p><strong>Date:</strong> {today_formatted}</p>
                                            <p><strong>Valid Until:</strong> 30 Days</p>
                                        </div>
                                    </div>
                                </header>

                                <!-- RATE SECTION -->
                                <section class="rate-section">
                                    <div class="info-box rate-box">
                                        <h1 class="rate-display">Your Rate is {final_amt} {currency}</h1>
                                    </div>
                                </section>

                                <!-- WELCOME MESSAGE -->
                                <section class="welcome-section">
                                    <div class="welcome-content">
                                        <p><strong>Dear {customer_name},</strong></p>
                                        <p>Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for 60 days from date of quotation. You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions or require additional information.</p>
                                    </div>
                                </section>

                                <!-- INFO GRID -->
                                <section class="info-section">
                                    <div class="info-box client-box">
                                        <h3>CLIENT DETAILS</h3>
                                        <div class="content">
                                            <p><strong>Name:</strong> {customer_name}</p>
                                            <p><strong>Phone:</strong> {phone}</p>
                                            <p><strong>Email:</strong> {email}</p>
                                        </div>
                                    </div>
                                    <div class="info-box move-box">
                                        <h3>MOVE DETAILS</h3>
                                        <div class="content">
                                            <p><strong>Service:</strong> {service_type}</p>
                                            <p><strong>Origin:</strong> {origin}</p>
                                            <p><strong>Destination:</strong> {destination}</p>
                                            <p><strong>Commodity:</strong> Used Household Goods</p>
                                            <p><strong>Move Date:</strong> {move_date}</p>
                                        </div>
                                    </div>
                                </section>

                                <!-- PRICING BREAKDOWN -->
                                <section class="pricing-section">
                                    <div class="breakdown-container">
                                        <h3 class="breakdown-title">Breakdown of Charges (All prices in {currency})</h3>
                                        <div class="summary-content">
                                            {breakdown_rows}
                                            {discount_row}
                                            
                                            <div class="summary-line total-line">
                                                <span class="label">Lump sum moving charges:</span>
                                                <span class="value">{final_amt}</span>
                                            </div>
                                            <div class="summary-line">
                                                <span class="label">Advance:</span>
                                                <span class="value">{advance_amt}</span>
                                            </div>
                                            <div class="summary-line">
                                                <span class="label">Balance:</span>
                                                <span class="value">{balance_amt}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {remarks_section}

                                <!-- SERVICE SCOPE (INCLUDES / EXCLUDES) -->
                                <section class="service-scope-section">
                                    <div class="scope-container">
                                        <div class="scope-header">
                                            <div class="header-col include-header">Service Includes</div>
                                            <div class="header-col exclude-header">Service Excludes</div>
                                        </div>
                                        <div class="scope-body">
                                            <div class="body-col include-body">
                                                <ul class="scope-list">
                                                    {inclusions_html}
                                                </ul>
                                            </div>
                                            <div class="body-col exclude-body">
                                                <ul class="scope-list">
                                                    {exclusions_html}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <!-- TERMS & NOTES -->
                                <section class="terms-section" style="margin-top: 20px;">
                                    <div class="terms-box"><h3>INSURANCE</h3><div class="text-content"><p>Comprehensive transit insurance is available upon request. Standard liability is limited as per terms.</p></div></div>
                                    <div class="terms-box"><h3>PAYMENT TERMS</h3><div class="text-content">{payment_terms_html}</div></div>
                                    {notes_section}
                                </section>

                                <!-- FOOTER -->
                                <footer class="footer-section">
                                    <div class="signature-block">
                                        <div class="sign-box client-sign">
                                            <p><strong>Accepted By (Client):</strong></p>
                                            <div class="sign-area">{survey_signature_img}</div>
                                            <div class="sign-line"></div>
                                            <p class="sign-name">{customer_name}</p>
                                            <p class="sign-date">Date: {today_formatted}</p>
                                        </div>
                                        <div class="sign-box company-sign">
                                            <p><strong>For Almas Movers:</strong></p>
                                            <div class="sign-area">{quotation_signature_img}</div>
                                            <div class="sign-line"></div>
                                            <p class="sign-name">Authorized Signatory</p>
                                            <p class="sign-date">Date: {today_formatted}</p>
                                        </div>
                                    </div>
                                    <div class="footer-bottom">
                                        <p>Thank you for choosing Almas Movers International. We look forward to serving you.</p>
                                    </div>
                                </footer>
                            </div>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td>
                            <div class="page-footer-space"></div>
                            <div class="footer-certification-logos">
                                {cert_logos_html}
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </body>
    </html>
    """
    
    return html


def get_styles():
    """Return CSS styles matching QuotationLocalMove.jsx"""
    return """
    @page { size: A4; margin: 0; }
    body { 
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #757575; background: #fff; margin: 0; padding: 0; 
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    
    .page-container { width: 100%; margin: 0; position: relative; background: white; }
    .print-wrapper { width: 100%; border-collapse: collapse; }
    .page-header-space { height: 30px; width: 100%; }
    .page-footer-space { height: 80px; width: 100%; }

    .print-actual-content { padding: 0 10mm; }

    @media print {
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .page-container { padding: 0; }
        .page-header-space::after { content: ""; display: block; height: 1px; }
    }

    /* HEADER */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; margin-bottom: 25px; page-break-inside: avoid; }
    .logo { height: 70px; width: auto; margin-bottom: 8px; }
    .company-address { font-size: 9pt; color: #555; line-height: 1.4; }
    .doc-title { font-size: 24pt; color: #003087; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .meta-details { float: right; text-align: left; }
    .meta-details p { margin: 2px 0; font-size: 10pt; }
    .meta-details strong { color: #666; margin-right: 5px; font-weight: 600; }

    .info-section { display: flex; gap: 20px; margin-bottom: 30px; page-break-inside: avoid; }
    .info-box { flex: 1; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #003087; padding: 12px 15px; page-break-inside: avoid; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 10pt; color: #003087; text-transform: uppercase; }
    .info-box .content p { margin: 3px 0; font-size: 10pt; }
    .info-box .content strong { color: #555; display: inline-block; margin-right: 5px; }

    .rate-section { margin-bottom: 25px; page-break-inside: avoid; }
    .rate-box { padding: 15px 25px !important; }
    .rate-display { font-size: 16pt; color: #757575; margin: 0; text-align: center; font-weight: bold; }
    
    .welcome-section { margin-bottom: 25px; page-break-inside: avoid; }
    .welcome-content { font-size: 11pt; color: #757575; line-height: 1.5; }
    .welcome-content p { margin-bottom: 8px; }
    .welcome-content strong { font-size: 12pt; color: #000; display: block; margin-bottom: 5px; }

    .pricing-section { margin-bottom: 30px; display: flex; justify-content: center; page-break-inside: avoid; }
    .breakdown-container { width: 80%; }
    .breakdown-title { color: #003087; font-size: 11pt; margin-bottom: 10px; padding-bottom: 5px; }
    .summary-content { font-size: 10pt; }
    .summary-line { padding: 4px 0; display: flex; justify-content: space-between; align-items: center; }
    .summary-line .label { color: #757575; }
    .summary-line .value { font-weight: bold; color: #757575; text-align: right; }
    .total-line { font-weight: bold; color: #000 !important; font-size: 11pt; margin-top: 5px; padding-top: 10px; }
    .total-line .label, .total-line .value { color: #000; }
    .text-red { color: #d32f2f !important; }

    .selected-services-section { margin-bottom: 20px; page-break-inside: avoid; }
    .service-scope-section { margin-bottom: 30px; page-break-inside: avoid; }
    .scope-container { border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }
    .scope-header { display: flex; color: white; }
    .header-col { flex: 1; padding: 10px; font-weight: bold; font-size: 11pt; }
    .include-header { background-color: #456475; }
    .exclude-header { background-color: #b71c1c; }
    .scope-body { display: flex; }
    .body-col { flex: 1; padding: 15px 20px; }
    .include-body { background-color: #f1f5f8; }
    .exclude-body { background-color: #fdf2f2; }
    .scope-list { list-style: none; padding: 0; margin: 0; font-size: 10pt; }
    .scope-list li { margin-bottom: 8px; display: flex; align-items: flex-start; }
    .check-icon { color: #456475; margin-right: 10px; font-weight: bold; }
    .cross-icon { color: #b71c1c; margin-right: 10px; font-weight: bold; }

    .terms-section { margin-bottom: 30px; }
    .terms-box { page-break-inside: avoid; margin-bottom: 15px; }
    .terms-box h3 { font-size: 10pt; background: #eee; padding: 6px 10px; margin: 0; font-weight: bold; }
    .terms-box .text-content { padding: 10px; border: 1px solid #eee; border-top: none; font-size: 9pt; }
    .term-item { margin-bottom: 10px; }
    .term-title { font-weight: bold; }
    .remark-item { margin-bottom: 10px; }
    .note-item { margin-bottom: 10px; }

    .footer-section { page-break-inside: avoid; margin-top: 30px; }
    .signature-block { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .sign-box { width: 45%; }
    .sign-area { height: 60px; display: flex; align-items: flex-end; justify-content: center; }
    .signature-img { max-height: 50px; }
    .sign-line { border-bottom: 1px solid #757575; margin: 5px 0; }
    .sign-name, .sign-date { font-size: 9pt; color: #555; }
    .footer-bottom { text-align: center; font-size: 8pt; color: #999; padding-top: 10px; }

    .footer-certification-logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        padding: 10px 0;
        background: transparent;
    }
    .footer-cert-logo {
        height: 35px;
        width: auto;
        object-fit: contain;
    }
    
    @media print {
        .footer-certification-logos {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            width: 100%;
        }
    }
    """
