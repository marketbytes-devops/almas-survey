import os
from datetime import datetime

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)

from additional_settings.models import SurveyAdditionalService 


def get_service_name(service_id):
    """Convert service ID to human-readable name"""
    try:
        service = SurveyAdditionalService.objects.get(id=service_id)
        return service.name
    except SurveyAdditionalService.DoesNotExist:
        return f"Service {service_id}"


def generate_quotation_pdf(quotation):
    """
    Updated PDF Generator - Exact order & format you want:
    1. Header
    2. Client & Move Details
    3. Additional Services & Charges (with qty, price, total)
    4. Financial Summary
    5. Included & Excluded Services (table format like quote view)
    6. Single Client Signature area (no authorized signature)
    """
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'quotation_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)

    filename = f"Quotation_{quotation.quotation_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=60,
        bottomMargin=50
    )

    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#4c7085'),
        alignment=TA_CENTER,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )

    company_style = ParagraphStyle(
        'Company',
        parent=styles['Normal'],
        fontSize=16,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )

    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#4c7085'),
        spaceBefore=18,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )

    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8
    )

    story.append(Paragraph("ALMAS MOVERS INTERNATIONAL", company_style))
    story.append(Paragraph("QUOTATION", title_style))
    story.append(Spacer(1, 20))

    currency_code = quotation.currency.code if quotation.currency else "QAR"
    info_data = [
        ["Quotation ID:", quotation.quotation_id or "N/A", "Date:", quotation.date.strftime('%d %B %Y') if quotation.date else datetime.now().strftime('%d %B %Y')],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8f9fa')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 25))

    survey = quotation.survey
    if survey:
        client_name = getattr(survey, 'full_name', 'N/A')
        client_phone = getattr(survey, 'phone_number', 'N/A')
        service_type = getattr(survey, 'service_type', 'N/A')
        origin = getattr(survey, 'origin_city', '') or getattr(survey, 'origin_address', 'N/A')
        move_date = survey.packing_date_from.strftime('%d %B %Y') if survey.packing_date_from else "As per request"

        destination = "N/A"
        if hasattr(survey, 'destination_addresses') and survey.destination_addresses.exists():
            dest = survey.destination_addresses.first()
            destination = getattr(dest, 'city', '') or getattr(dest, 'address', 'N/A')
    else:
        client_name = client_phone = service_type = origin = destination = move_date = "N/A"

    details_data = [
        ["Client Name:", client_name],
        ["Phone:", client_phone],
        ["Service Type:", service_type],
        ["Move Date:", move_date],
        ["Origin:", origin],
        ["Destination:", destination],
    ]

    details_table = Table(details_data, colWidths=[1.8*inch, 4.2*inch])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(Paragraph("Client & Move Details", heading_style))
    story.append(details_table)
    story.append(Spacer(1, 25))

    if quotation.additional_charges:
        story.append(Paragraph("Additional Services & Charges", heading_style))

        add_data = [["Service", "Quantity", "Price/Unit", "Total"]]
        total_additional = 0

        for charge in quotation.additional_charges:
            name = charge.get('service_name', 'N/A')
            qty = int(charge.get('quantity', 1))
            price = float(charge.get('price_per_unit', 0))
            subtotal = price * qty
            total_additional += subtotal

            add_data.append([
                name,
                str(qty),
                f"{price:,.2f} {currency_code}",
                f"{subtotal:,.2f} {currency_code}"
            ])

        add_table = Table(add_data, colWidths=[2.8*inch, 1*inch, 1.2*inch, 1*inch])
        add_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e3f2fd')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ]))

        add_data.append([
            Paragraph("<b>Total Additional Charges</b>", label_style),
            "", "", f"{total_additional:,.2f} {currency_code}"
        ])

        story.append(add_table)
        story.append(Spacer(1, 25))

    amount = float(quotation.amount or 0)
    discount = float(quotation.discount or 0)
    final_amount = float(quotation.final_amount or (amount - discount))
    advance = float(quotation.advance or 0)
    balance = float(quotation.balance or (final_amount - advance))

    financial_data = [
        ["Description", "Amount"],
        ["Quotation Amount", f"{amount:,.2f} {currency_code}"],
        ["Discount", f"-{discount:,.2f} {currency_code}"],
        ["Total Amount", f"{final_amount:,.2f} {currency_code}"],
        ["Advance Payment", f"{advance:,.2f} {currency_code}"],
        ["Balance Due", f"{balance:,.2f} {currency_code}"],
    ]

    fin_table = Table(financial_data, colWidths=[4.2*inch, 1.8*inch])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 5), (1, 5), colors.HexColor('#e3f2fd')),
        ('FONTNAME', (0, 5), (0, 5), 'Helvetica-Bold'),
        ('FONTNAME', (1, 5), (1, 5), 'Helvetica-Bold'),
    ]))
    story.append(Paragraph("Financial Summary", heading_style))
    story.append(fin_table)
    story.append(Spacer(1, 25))

    included = [get_service_name(sid) for sid in (quotation.included_services or [])]
    excluded = [get_service_name(sid) for sid in (quotation.excluded_services or [])]

    if included or excluded:
        story.append(Paragraph("Services Inclusions & Exclusions", heading_style))

        services_table_data = [["Included Services", "Excluded Services"]]

        max_rows = max(len(included), len(excluded))
        included_padded = included + [""] * (max_rows - len(included))
        excluded_padded = excluded + [""] * (max_rows - len(excluded))

        for inc, exc in zip(included_padded, excluded_padded):
            services_table_data.append([inc or "—", exc or "—"])

        services_table = Table(services_table_data, colWidths=[3.5*inch, 3.5*inch])
        services_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f0f8ff')),
            ('BACKGROUND', (1, 1), (1, -1), colors.HexColor('#fff5f5')),
        ]))

        story.append(services_table)
        story.append(Spacer(1, 25))

    story.append(Paragraph("Client Signature", heading_style))

    sig_data = [
        [Spacer(1, 1.2*inch)],
        ["_________________________"],
        [client_name]
    ]

    sig_table = Table(sig_data, colWidths=[7*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.transparent),  # No border
    ]))

    if quotation.signature and os.path.exists(quotation.signature.path):
        sig_img = Image(quotation.signature.path, width=3*inch, height=1.2*inch)
        sig_img.hAlign = 'LEFT'
        sig_data[0][0] = sig_img

    story.append(sig_table)
    story.append(Spacer(1, 40))

    story.append(Paragraph("Thank you for choosing Almas Movers International!", normal_style))

    doc.build(story)
    return filepath, filename