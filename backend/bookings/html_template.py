"""
HTML Template Generator for Work Order (Booking) PDFs
Mirrors the Quotation design but for operational work orders
"""
import os
import base64
from datetime import datetime
from django.conf import settings
from additional_settings.models import SurveyAdditionalService

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


def build_work_order_template(booking):
    """
    Build complete HTML template for Work Order PDF generation
    """
    quotation = booking.quotation
    survey = quotation.survey
    
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
    
    move_date = booking.move_date.strftime('%d %B %Y') if booking.move_date else 'TBA'
    start_time = booking.start_time.strftime('%I:%M %p') if booking.start_time else 'TBA'
    end_time = booking.estimated_end_time.strftime('%I:%M %p') if booking.estimated_end_time else 'TBA'
    
    booking_number = booking.booking_id or "N/A"
    today_formatted = datetime.now().strftime('%d %B %Y')
    
    supervisor_name = booking.supervisor.name if booking.supervisor else "N/A"
    supervisor_phone = booking.supervisor.phone_number if booking.supervisor else "N/A"
    
    included_services = []
    if quotation.included_services:
        for service_id in quotation.included_services:
            try:
                service = SurveyAdditionalService.objects.get(id=service_id)
                included_services.append(service.name)
            except (SurveyAdditionalService.DoesNotExist, ValueError):
                pass
    
    excluded_services = []
    if quotation.excluded_services:
        for service_id in quotation.excluded_services:
            try:
                service = SurveyAdditionalService.objects.get(id=service_id)
                excluded_services.append(service.name)
            except (SurveyAdditionalService.DoesNotExist, ValueError):
                pass
    
    inclusions_html = "".join([f'<li><span class="check-icon">✓</span> {item}</li>' for item in included_services])
    if not inclusions_html:
        inclusions_html = '<li><span class="check-icon">✓</span> Standard Packing</li><li><span class="check-icon">✓</span> Transport</li>'
    
    exclusions_html = "".join([f'<li><span class="cross-icon">✗</span> {item}</li>' for item in excluded_services])
    if not exclusions_html:
        exclusions_html = '<li><span class="cross-icon">✗</span> Customs Duties</li><li><span class="cross-icon">✗</span> Storage</li>'

    labours = booking.labours.all()
    manpower_rows = "".join([
        f'<tr><td>{l.staff_member.name if l.staff_member else "—"}</td><td>{l.quantity or 1}</td></tr>'
        for l in labours
    ]) if labours.exists() else '<tr><td colspan="2" style="text-align:center">No manpower assigned</td></tr>'

    trucks = booking.trucks.all()
    truck_rows = "".join([
        f'<tr><td>{t.truck_type.name if t.truck_type else "N/A"}</td><td>{t.quantity or 1}</td></tr>'
        for t in trucks
    ]) if trucks.exists() else '<tr><td colspan="2" style="text-align:center">No trucks assigned</td></tr>'

    materials = booking.materials.all()
    material_rows = "".join([
        f'<tr><td>{m.material.name if m.material else "N/A"}</td><td>{m.quantity or 1}</td></tr>'
        for m in materials
    ]) if materials.exists() else '<tr><td colspan="2" style="text-align:center">No materials assigned</td></tr>'

    gps_link = None
    if survey and hasattr(survey, 'origin_gps'):
        gps_link = survey.origin_gps.strip()
    
    gps_section = f"""
    <div class="terms-box">
        <h3>ORIGIN GPS LOCATION</h3>
        <div class="text-content">
            <a href="{gps_link}" style="color: #003087; text-decoration: underline; font-weight: bold;">Click here to open exact origin location on Google Maps</a>
        </div>
    </div>
    """ if gps_link else ""

    internal_notes = booking.notes.replace('\n', '<br/>') if booking.notes else "No internal notes provided."

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
        <title>Work Order {booking_number}</title>
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
                                            CR No 72379, Doha, Qatar<br>
                                            Freight@almasint.com | +974 5013 6999
                                        </div>
                                    </div>
                                    <div class="meta-col">
                                        <h1 class="doc-title" style="color: #b71c1c;">WORK ORDER</h1>
                                        <div class="meta-details">
                                            <p><strong>Order No:</strong> {booking_number}</p>
                                            <p><strong>Date:</strong> {today_formatted}</p>
                                            <p><strong>Status:</strong> {booking.status.upper() if booking.status else 'CONFIRMED'}</p>
                                        </div>
                                    </div>
                                </header>

                                <!-- INFO GRID -->
                                <section class="info-section">
                                    <div class="info-box client-box">
                                        <h3>CLIENT DETAILS</h3>
                                        <div class="content">
                                            <p><strong>Name</strong> <span class="colon-separator">:</span> {customer_name}</p>
                                            <p><strong>Phone</strong> <span class="colon-separator">:</span> {phone}</p>
                                            <p><strong>Email</strong> <span class="colon-separator">:</span> {email}</p>
                                        </div>
                                    </div>
                                    <div class="info-box move-box">
                                        <h3>MOVE DETAILS</h3>
                                        <div class="content">
                                            <p><strong>Service</strong> <span class="colon-separator">:</span> {service_type}</p>
                                            <p><strong>Origin</strong> <span class="colon-separator">:</span> {origin}</p>
                                            <p><strong>Destination</strong> <span class="colon-separator">:</span> {destination}</p>
                                            <p><strong>Move Date</strong> <span class="colon-separator">:</span> {move_date}</p>
                                        </div>
                                    </div>
                                </section>

                                <!-- SCHEDULE & SUPERVISOR -->
                                <section class="info-section">
                                    <div class="info-box schedule-box">
                                        <h3>MOVE SCHEDULE</h3>
                                        <div class="content">
                                            <p><strong>Start Time</strong> <span class="colon-separator">:</span> {start_time}</p>
                                            <p><strong>Est. End Time</strong> <span class="colon-separator">:</span> {end_time}</p>
                                        </div>
                                    </div>
                                    <div class="info-box supervisor-box" style="border-left-color: #456475;">
                                        <h3>SUPERVISOR</h3>
                                        <div class="content">
                                            <p><strong>Name</strong> <span class="colon-separator">:</span> {supervisor_name}</p>
                                            <p><strong>Phone</strong> <span class="colon-separator">:</span> {supervisor_phone}</p>
                                        </div>
                                    </div>
                                </section>

                                <!-- RESOURCES TABLES -->
                                <section class="resources-section">
                                    <div class="resource-grid">
                                        <div class="resource-item">
                                            <h3 class="breakdown-title">Assigned Manpower</h3>
                                            <table class="data-table">
                                                <thead><tr><th>Staff Member</th><th>Qty</th></tr></thead>
                                                <tbody>{manpower_rows}</tbody>
                                            </table>
                                        </div>
                                        <div class="resource-item">
                                            <h3 class="breakdown-title">Trucks Required</h3>
                                            <table class="data-table">
                                                <thead><tr><th>Truck Type</th><th>Qty</th></tr></thead>
                                                <tbody>{truck_rows}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div style="margin-top: 20px;">
                                        <h3 class="breakdown-title">Packing Materials</h3>
                                        <table class="data-table">
                                            <thead><tr><th>Material</th><th>Quantity</th></tr></thead>
                                            <tbody>{material_rows}</tbody>
                                        </table>
                                    </div>
                                </section>

                                <!-- SERVICE SCOPE (INCLUDES / EXCLUDES) -->
                                <section class="service-scope-section" style="margin-top: 30px;">
                                    <div class="scope-container">
                                        <div class="scope-header">
                                            <div class="header-col include-header">Work Scope (Includes)</div>
                                            <div class="header-col exclude-header">Work Scope (Excludes)</div>
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

                                <!-- GPS & NOTES -->
                                <section class="terms-section" style="margin-top: 30px;">
                                    {gps_section}
                                    <div class="terms-box">
                                        <h3>INTERNAL NOTES / INSTRUCTIONS</h3>
                                        <div class="text-content">
                                            <p>{internal_notes}</p>
                                        </div>
                                    </div>
                                </section>

                                <!-- FOOTER -->
                                <footer class="footer-section">
                                    <div class="footer-bottom">
                                        <p>ALMAS MOVERS INTERNATIONAL - Operation Department</p>
                                        <p>Ensuring a smooth relocation for our valued clients.</p>
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
    """Return CSS styles matching Quotation design"""
    return """
    @page { size: A4; margin: 0; }
    body { 
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #555; background: #fff; margin: 0; padding: 0; 
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
    }

    /* HEADER */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; margin-bottom: 25px; page-break-inside: avoid; }
    .logo { height: 70px; width: auto; margin-bottom: 8px; }
    .company-address { font-size: 9pt; color: #555; line-height: 1.4; }
    .doc-title { font-size: 24pt; color: #003087; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .meta-details { float: right; text-align: left; }
    .meta-details p { margin: 2px 0; font-size: 10pt; }
    .meta-details strong { color: #666; margin-right: 5px; font-weight: 600; }

    .info-section { display: flex; gap: 20px; margin-bottom: 20px; page-break-inside: avoid; }
    .info-box { flex: 1; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #003087; padding: 12px 15px; page-break-inside: avoid; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 10pt; color: #003087; text-transform: uppercase; }
    .info-box .content p { margin: 3px 0; font-size: 10pt; display: flex; align-items: flex-start; }
    .info-box .content strong { color: #555; display: inline-block; width: 100px; flex-shrink: 0; }
    .colon-separator { margin: 0 5px; color: #555; font-weight: bold; }

    .resources-section { margin-top: 10px; page-break-inside: avoid; }
    .resource-grid { display: flex; gap: 20px; }
    .resource-item { flex: 1; }
    .breakdown-title { color: #003087; font-size: 11pt; margin-bottom: 8px; padding-bottom: 3px; }
    
    .data-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .data-table th { background: #f1f5f8; color: #003087; text-align: left; padding: 8px; border: 1px solid #ddd; }
    .data-table td { padding: 8px; border: 1px solid #ddd; color: #444; }

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

    .terms-box { page-break-inside: avoid; margin-bottom: 15px; }
    .terms-box h3 { font-size: 10pt; background: #eee; padding: 6px 10px; margin: 0; font-weight: bold; color: #003087; border-left: 3px solid #003087; }
    .terms-box .text-content { padding: 10px; border: 1px solid #eee; border-top: none; font-size: 9pt; line-height: 1.5; }

    .footer-section { page-break-inside: avoid; margin-top: 30px; }

    .footer-bottom { text-align: center; font-size: 8pt; color: #999; padding-top: 10px; }

    .footer-certification-logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        padding: 10px 0;
        background: transparent;
    }
    .footer-cert-logo { height: 35px; width: auto; object-fit: contain; }
    
    @media print {
        .footer-certification-logos {
            position: fixed;
            bottom: 20px;
            left: 0; right: 0;
            width: 100%;
        }
    }
    """
