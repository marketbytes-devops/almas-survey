from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.conf import settings
import os
from datetime import datetime

def generate_quotation_pdf(quotation):
    """
    Generate a professional PDF for quotation
    Returns: (filepath, filename)
    """
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'quotation_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    filename = f"Quotation_{quotation.quotation_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
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
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8
    )

    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold'
    )
    
    story.append(Paragraph("QUOTATION", title_style))
    story.append(Paragraph("ALMAS MOVERS INTERNATIONAL", subtitle_style))
    story.append(Spacer(1, 10))
    
    info_data = [
        [Paragraph("Quotation ID:", label_style), quotation.quotation_id or 'N/A', 
         Paragraph("Date:", label_style), quotation.date.strftime('%d %B %Y') if quotation.date else datetime.now().strftime('%d %B %Y')],
    ]
    info_table = Table(info_data, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f2f2f2')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f2f2f2')),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    survey = quotation.survey
    client_name = getattr(survey, 'full_name', 'N/A') if survey else 'N/A'
    client_phone = getattr(survey, 'phone_number', 'N/A') if survey else 'N/A'
    service_type = getattr(survey, 'service_type', 'N/A') if survey else 'N/A'
    origin = getattr(survey, 'origin_city', '') or getattr(survey, 'origin_address', 'N/A') if survey else 'N/A'
    
    destination = "N/A"
    if survey and hasattr(survey, 'destination_addresses') and survey.destination_addresses.exists():
        dest = survey.destination_addresses.first()
        destination = getattr(dest, 'city', '') or getattr(dest, 'address', 'N/A')

    details_data = [
        [Paragraph("Client Name:", label_style), client_name, Paragraph("Phone:", label_style), client_phone],
        [Paragraph("Service Type:", label_style), service_type, Paragraph("Move Date:", label_style), "As per request"],
        [Paragraph("Origin:", label_style), origin, Paragraph("Destination:", label_style), destination],
    ]
    details_table = Table(details_data, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f2f2f2')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f2f2f2')),
    ]))
    story.append(Paragraph("Client & Move Details", heading_style))
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    amount = float(quotation.amount or 0)
    discount = float(quotation.discount or 0)
    final_amount = float(quotation.final_amount or (amount - discount))
    advance = float(quotation.advance or 0)
    balance = float(quotation.balance or (final_amount - advance))
    currency = quotation.currency.code if quotation.currency else "QAR"

    financial_data = [
        ["Description", "Amount"],
        ["Quotation Amount", f"{amount:.2f} {currency}"],
        ["Discount", f"- {discount:.2f} {currency}"],
        ["Total Amount", f"{final_amount:.2f} {currency}"],
        ["Advance Payment", f"- {advance:.2f} {currency}"],
        ["Balance Due", f"{balance:.2f} {currency}"],
    ]
    
    fin_table = Table(financial_data, colWidths=[4.2*inch, 1.8*inch])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 3), (0, 3), 'Helvetica-Bold'),
        ('FONTNAME', (1, 3), (1, 3), 'Helvetica-Bold'),
        ('FONTNAME', (0, 5), (0, 5), 'Helvetica-Bold'),
        ('FONTNAME', (1, 5), (1, 5), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 5), (1, 5), colors.HexColor('#e3f2fd')),
    ]))
    story.append(Paragraph("Financial Summary", heading_style))
    story.append(fin_table)
    story.append(Spacer(1, 20))
    
    if quotation.included_services or quotation.excluded_services:
        story.append(Paragraph("Service Inclusions & Exclusions", heading_style))
        serv_data = []
        if quotation.included_services:
            serv_data.append([Paragraph("<b>Included:</b>", normal_style), Paragraph(", ".join(map(str, quotation.included_services)), normal_style)])
        if quotation.excluded_services:
            serv_data.append([Paragraph("<b>Excluded:</b>", normal_style), Paragraph(", ".join(map(str, quotation.excluded_services)), normal_style)])
        
        if serv_data:
            serv_table = Table(serv_data, colWidths=[1.2*inch, 4.8*inch])
            serv_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(serv_table)

    if quotation.notes:
        story.append(Paragraph("Notes & Terms", heading_style))
        story.append(Paragraph(quotation.notes.replace('\n', '<br/>'), normal_style))
        story.append(Spacer(1, 20))
    
    if quotation.signature:
        try:
            story.append(Paragraph("Client Signature", heading_style))
            sig_path = quotation.signature.path
            if os.path.exists(sig_path):
                img = Image(sig_path, width=2*inch, height=1*inch)
                img.hAlign = 'LEFT'
                story.append(img)
        except Exception:
            pass

    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "Thank you for choosing Almas Movers International",
        ParagraphStyle('Footer', alignment=TA_CENTER, fontSize=12,
                       textColor=colors.HexColor('#4c7085'), spaceAfter=6)
    ))
    story.append(Paragraph(
        "For any queries, please contact us at info@almasmovers.com",
        ParagraphStyle('FooterSm', alignment=TA_CENTER, fontSize=9, textColor=colors.grey)
    ))
    
    doc.build(story)
    
    return filepath, filename
