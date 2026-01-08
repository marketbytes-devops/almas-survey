from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.conf import settings
import os
from datetime import datetime

def generate_booking_pdf(booking):
    """
    Generate a professional PDF for booking confirmation
    Returns: filepath of generated PDF
    """
    # Create directory if not exists
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'booking_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # File path
    filename = f"Booking_{booking.booking_id}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    # Create PDF document
    doc = SimpleDocTemplate(filepath, pagesize=A4,
                           rightMargin=40, leftMargin=40,
                           topMargin=40, bottomMargin=40)
    
    # Container for PDF elements
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Title
    story.append(Paragraph("BOOKING CONFIRMATION", title_style))
    story.append(Paragraph("ALMAS MOVERS INTERNATIONAL", ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20
    )))
    story.append(Spacer(1, 12))
    
    # Booking ID and Date
    info_data = [
        ['Booking ID:', booking.booking_id or 'N/A'],
        ['Generated On:', datetime.now().strftime('%d %B %Y, %I:%M %p')],
        ['Status:', booking.status.upper() if booking.status else 'CONFIRMED']
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    # Client Details
    story.append(Paragraph("Client Details", heading_style))
    
    client_name = "N/A"
    contact_number = "N/A"
    if booking.quotation and hasattr(booking.quotation, 'survey') and booking.quotation.survey:
        survey = booking.quotation.survey
        client_name = getattr(survey, 'full_name', 'N/A') or 'N/A'
        contact_number = getattr(survey, 'phone_number', 'N/A') or 'N/A'
    
    client_data = [
        ['Client Name:', client_name],
        ['Contact Number:', contact_number],
    ]
    
    client_table = Table(client_data, colWidths=[2*inch, 4*inch])
    client_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 20))
    
    # Move Schedule
    story.append(Paragraph("Move Schedule", heading_style))
    
    move_type = "N/A"
    origin = "N/A"
    destination = "N/A"
    
    if booking.quotation and hasattr(booking.quotation, 'survey') and booking.quotation.survey:
        survey = booking.quotation.survey
        move_type = getattr(survey, 'service_type', 'N/A') or 'N/A'
        origin = getattr(survey, 'origin_city', 'N/A') or 'N/A'
        if hasattr(survey, 'destination_addresses'):
            dest_qs = survey.destination_addresses.first()
            if dest_qs and hasattr(dest_qs, 'city'):
                destination = dest_qs.city or 'N/A'
    
    schedule_data = [
        ['Move Date:', str(booking.move_date) if booking.move_date else 'TBA'],
        ['Start Time:', booking.start_time.strftime('%I:%M %p') if booking.start_time else 'TBA'],
        ['Estimated End Time:', booking.estimated_end_time.strftime('%I:%M %p') if booking.estimated_end_time else 'TBA'],
        ['Move Type:', move_type],
        ['From:', origin],
        ['To:', destination],
    ]
    
    schedule_table = Table(schedule_data, colWidths=[2*inch, 4*inch])
    schedule_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(schedule_table)
    story.append(Spacer(1, 20))
    
    # Supervisor Details
    if booking.supervisor:
        story.append(Paragraph("Assigned Supervisor", heading_style))
        
        supervisor_data = [
            ['Name:', booking.supervisor.name],
            ['Category:', booking.supervisor.category or 'Supervisor'],
            ['Phone:', booking.supervisor.phone_number or 'N/A'],
            ['Employer:', booking.supervisor.employer or 'Almas Movers'],
        ]
        
        supervisor_table = Table(supervisor_data, colWidths=[2*inch, 4*inch])
        supervisor_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(supervisor_table)
        story.append(Spacer(1, 20))
    
    #  CORRECTED: Use 'labours' instead of 'booking_labours'
    labours = booking.labours.all()
    if labours.exists():
        story.append(Paragraph("Labour Assignment", heading_style))
        
        labour_data = [['Labour Type', 'Assigned Staff', 'Quantity']]
        for labour in labours:
            labour_data.append([
                labour.labour_type.name if labour.labour_type else 'N/A',
                labour.staff_member.name if labour.staff_member else '—',
                str(labour.quantity)
            ])
        
        labour_table = Table(labour_data, colWidths=[2.5*inch, 2.5*inch, 1*inch])
        labour_table.setStyle(TableStyle([
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
        story.append(labour_table)
        story.append(Spacer(1, 20))
    
    #  CORRECTED: Use 'trucks' instead of 'booking_trucks'
    trucks = booking.trucks.all()
    if trucks.exists():
        story.append(Paragraph("Trucks Required", heading_style))
        
        truck_data = [['Truck Type', 'Quantity']]
        for truck in trucks:
            truck_data.append([
                truck.truck_type.name if truck.truck_type else 'N/A',
                str(truck.quantity)
            ])
        
        truck_table = Table(truck_data, colWidths=[4*inch, 2*inch])
        truck_table.setStyle(TableStyle([
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
        story.append(truck_table)
        story.append(Spacer(1, 20))
    
    materials = booking.materials.all()
    if materials.exists():
        story.append(Paragraph("Packing Materials", heading_style))
        
        material_data = [['Material', 'Quantity']]
        for material in materials:
            material_data.append([
                material.material.name if material.material else 'N/A',
                str(material.quantity)
            ])
        
        material_table = Table(material_data, colWidths=[4*inch, 2*inch])
        material_table.setStyle(TableStyle([
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
        story.append(material_table)
        story.append(Spacer(1, 20))
    
    # Notes
    if booking.notes:
        story.append(Paragraph("Internal Notes", heading_style))
        notes_para = Paragraph(booking.notes.replace('\n', '<br/>'), normal_style)
        notes_table = Table([[notes_para]], colWidths=[6*inch])
        notes_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff9e6')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(notes_table)
        story.append(Spacer(1, 20))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=6
    )
    story.append(Paragraph("<b>Thank you for choosing Almas Movers International</b>", footer_style))
    story.append(Paragraph("Your move is in safe hands.", footer_style))
    story.append(Spacer(1, 10))
    
    contact_style = ParagraphStyle(
        'Contact',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph("P.O. Box 24665, Doha, Qatar", contact_style))
    story.append(Paragraph("For queries, contact your assigned supervisor", contact_style))
    
    # Build PDF
    doc.build(story)
    
    return filepath, filename