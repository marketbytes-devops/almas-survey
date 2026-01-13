# backend/quotation/pdf_generator.py

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.conf import settings
import os
from datetime import datetime

def generate_quotation_pdf(quotation):
    """
    Generate a professional PDF quotation with CENTERED headings
    Returns: (filepath, filename)
    """
    # Create directory if needed
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'quotation_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    filename = f"Quotation_{quotation.quotation_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    # PDF document setup
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # === Custom Styles ===
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666'),
        spaceAfter=30
    )
    
    # Centered Heading Style (this is the main change)
    centered_heading = ParagraphStyle(
        'CenteredHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#4c7085'),
        spaceBefore=20,
        spaceAfter=12,
        alignment=TA_CENTER,           # ← CENTERED
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    
    # === Document Content ===
    # Header / Title
    story.append(Paragraph("QUOTATION", title_style))
    story.append(Paragraph("ALMAS MOVERS INTERNATIONAL", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Quotation Info Table
    info_data = [
        ['Quotation ID:', quotation.quotation_id or 'N/A'],
        ['Date:', quotation.date.strftime('%d %B %Y') if quotation.date else 'N/A'],
        ['Valid Until:', '30 days from date of issue']
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f0f0f0')),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 30))
    
    # === Client Information (CENTERED HEADING) ===
    story.append(Paragraph("Client Information", centered_heading))
    story.append(Spacer(1, 8))
    
    client_name = "N/A"
    contact_number = "N/A"
    email = "N/A"
    
    if quotation.survey:
        survey = quotation.survey
        client_name = getattr(survey, 'full_name', 'N/A') or 'N/A'
        contact_number = getattr(survey, 'phone_number', 'N/A') or 'N/A'
        email = getattr(survey, 'email', 'N/A') or 'N/A'
    
    client_data = [
        ['Client Name:', client_name],
        ['Contact Number:', contact_number],
        ['Email:', email],
    ]
    
    client_table = Table(client_data, colWidths=[2*inch, 4*inch])
    client_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f0f0f0')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 25))
    
    # === Move Details (CENTERED HEADING) ===
    story.append(Paragraph("Move Details", centered_heading))
    story.append(Spacer(1, 8))
    
    service_type = "N/A"
    origin = "N/A"
    destination = "N/A"
    move_date = "N/A"
    
    if quotation.survey:
        survey = quotation.survey
        service_type = getattr(survey, 'service_type', 'N/A') or 'N/A'
        origin = getattr(survey, 'origin_address', 'N/A') or 'N/A'
        move_date = str(getattr(survey, 'packing_date_from', 'N/A')) if hasattr(survey, 'packing_date_from') else 'N/A'
        
        if hasattr(survey, 'destination_addresses'):
            dest_qs = survey.destination_addresses.first()
            if dest_qs and hasattr(dest_qs, 'address'):
                destination = dest_qs.address or 'N/A'
    
    move_data = [
        ['Service Type:', service_type],
        ['Moving From:', origin],
        ['Moving To:', destination],
        ['Preferred Move Date:', move_date],
    ]
    
    move_table = Table(move_data, colWidths=[2*inch, 4*inch])
    move_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f0f0f0')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(move_table)
    story.append(Spacer(1, 25))
    
    # === Additional Services (CENTERED if exists) ===
    additional_charges = quotation.additional_charges or []
    if additional_charges:
        story.append(Paragraph("Additional Services", centered_heading))
        story.append(Spacer(1, 8))
        
        service_data = [['Service', 'Unit Price', 'Quantity', 'Total']]
        
        for charge in additional_charges:
            service_name = charge.get('service_name', 'Additional Service')
            price_per_unit = float(charge.get('price_per_unit', 0))
            quantity = int(charge.get('quantity', 1))
            total = float(charge.get('total', price_per_unit * quantity))
            
            service_data.append([
                service_name,
                f"{price_per_unit:.2f} QAR",
                str(quantity),
                f"{total:.2f} QAR"
            ])
        
        service_table = Table(service_data, colWidths=[2.5*inch, 1.5*inch, 1*inch, 1*inch])
        service_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(service_table)
        story.append(Spacer(1, 25))
    
    # === Insurance Information (CENTERED HEADING) ===
    # Fetch active insurance plans
    from pricing.models import InsurancePlan, PaymentTerm
    
    active_insurance = InsurancePlan.objects.filter(is_active=True).order_by('order')
    if active_insurance.exists():
        story.append(Paragraph("Insurance Options", centered_heading))
        story.append(Spacer(1, 8))
        
        for plan in active_insurance:
            # Insurance: Description ONLY as requested
            if plan.description:
                story.append(Paragraph(plan.description, normal_style))
                story.append(Spacer(1, 6))
        story.append(Spacer(1, 25))

    # === Payment Terms (CENTERED HEADING) ===
    # Fetch active payment terms
    active_terms = PaymentTerm.objects.filter(is_active=True).order_by('order')
    if active_terms.exists():
        story.append(Paragraph("Payment Terms", centered_heading))
        story.append(Spacer(1, 8))
        
        for term in active_terms:
             # Term Name (Bold)
            if term.name:
                story.append(Paragraph(f"<b>{term.name}</b>", normal_style))
            # Description
            if term.description:
                story.append(Paragraph(term.description, normal_style))
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 25))

    # === Pricing Summary (CENTERED HEADING) ===
    story.append(Paragraph("Pricing Summary", centered_heading))
    story.append(Spacer(1, 8))
    
    amount = float(quotation.amount or 0)
    discount = float(quotation.discount or 0)
    advance = float(quotation.advance or 0)
    
    final_amount = max(0, amount - discount)
    balance = max(0, final_amount - advance)
    
    pricing_data = [
        ['Total Amount:', f"{amount:.2f} QAR"],
        ['Discount:', f"{discount:.2f} QAR"],
        ['Final Amount:', f"{final_amount:.2f} QAR"],
        ['Advance Payment:', f"{advance:.2f} QAR"],
        ['Balance Due:', f"{balance:.2f} QAR"],
    ]
    
    pricing_table = Table(pricing_data, colWidths=[4*inch, 2*inch])
    pricing_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#e3f2fd')),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor('#4c7085')),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 14),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(pricing_table)
    story.append(Spacer(1, 35))
    
    # === Terms & Conditions (CENTERED HEADING) ===
    story.append(Paragraph("Terms & Conditions", centered_heading))
    story.append(Spacer(1, 8))
    
    terms_text = """
    1. This quotation is valid for 30 days from the date of issue.<br/>
    2. Prices are subject to change based on actual volume and services required.<br/>
    3. Advance payment is required to confirm the booking.<br/>
    4. Balance payment must be settled before delivery.<br/>
    5. Insurance is recommended for valuable items.<br/>
    6. Additional charges may apply for extra services requested on moving day.
    """
    
    story.append(Paragraph(terms_text, normal_style))
    story.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=6
    )
    
    story.append(Paragraph("<b>Thank you for choosing Almas Movers International</b>", footer_style))
    story.append(Paragraph("Your trusted moving partner", footer_style))
    
    contact_style = ParagraphStyle(
        'Contact',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("P.O. Box 24665, Doha, Qatar", contact_style))
    story.append(Paragraph("For queries, please contact us via phone or email", contact_style))
    
    # Generate PDF
    doc.build(story)
    
    return filepath, filename