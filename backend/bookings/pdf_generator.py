from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from django.conf import settings
import os
from datetime import datetime


def generate_booking_pdf(booking):
    """
    Generate a professional PDF for booking confirmation
    Returns: (filepath, filename)
    """
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'booking_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    filename = f"Booking_{booking.booking_id}.pdf"
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
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#4c7085'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8
    )
    
    story.append(Paragraph("BOOKING CONFIRMATION", title_style))
    story.append(Paragraph(
        "ALMAS MOVERS INTERNATIONAL",
        ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12,
                       alignment=TA_CENTER, textColor=colors.HexColor('#666666'), spaceAfter=20)
    ))
    story.append(Spacer(1, 20))
    
    info_data = [
        ['Booking ID:', booking.booking_id or 'N/A'],
        ['Generated On:', datetime.now().strftime('%d %B %Y, %I:%M %p')],
        ['Status:', booking.status.upper() if booking.status else 'CONFIRMED']
    ]
    info_table = Table(info_data, colWidths=[2.2*inch, 3.8*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 30))
    
    story.append(Paragraph("Client Details", heading_style))
    client_name = booking.quotation.survey.full_name if booking.quotation.survey else "N/A"
    client_data = [['Client Name:', client_name]]
    client_table = Table(client_data, colWidths=[2.2*inch, 3.8*inch])
    client_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 25))
    
    story.append(Paragraph("Move Schedule", heading_style))
    schedule_data = [
        ['Move Date:', str(booking.move_date) if booking.move_date else 'TBA'],
        ['Start Time:', booking.start_time.strftime('%I:%M %p') if booking.start_time else 'TBA'],
        ['Estimated End Time:', booking.estimated_end_time.strftime('%I:%M %p') if booking.estimated_end_time else 'TBA'],
    ]
    schedule_table = Table(schedule_data, colWidths=[2.2*inch, 3.8*inch])
    schedule_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(schedule_table)
    story.append(Spacer(1, 25))
    
    if booking.supervisor:
        story.append(Paragraph("Assigned Supervisor", heading_style))
        sup_data = [
            ['Name:', booking.supervisor.name or 'N/A'],
            ['Phone:', booking.supervisor.phone_number or 'N/A'],
        ]
        sup_table = Table(sup_data, colWidths=[2.2*inch, 3.8*inch])
        sup_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e3f2fd')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sup_table)
        story.append(Spacer(1, 25))
    
    labours = booking.labours.all()
    if labours.exists():
        labour_data = [['Staff Member', 'Quantity']]
        for labour in labours:
            labour_data.append([
                labour.staff_member.name if labour.staff_member else '—',
                str(labour.quantity or 1)
            ])
        
        labour_table = Table(labour_data, colWidths=[4.2*inch, 1.8*inch])
        labour_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        manpower_section = [
            Paragraph("Assigned Manpower", heading_style),
            labour_table,
            Spacer(1, 25)
        ]
        story.append(KeepTogether(manpower_section))
    
    trucks = booking.trucks.all()
    if trucks.exists():
        truck_data = [['Truck Type', 'Quantity']]
        for truck in trucks:
            truck_data.append([
                truck.truck_type.name if truck.truck_type else 'N/A',
                str(truck.quantity or 1)
            ])
        
        truck_table = Table(truck_data, colWidths=[4.2*inch, 1.8*inch])
        truck_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        trucks_section = [
            Paragraph("Trucks Required", heading_style),
            truck_table,
            Spacer(1, 25)
        ]
        story.append(KeepTogether(trucks_section))
    
    materials = booking.materials.all()
    if materials.exists():
        material_data = [['Material', 'Quantity']]
        for material in materials:
            material_data.append([
                material.material.name if material.material else 'N/A',
                str(material.quantity or 1)
            ])
        
        material_table = Table(material_data, colWidths=[4.2*inch, 1.8*inch])
        material_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c7085')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        materials_section = [
            Paragraph("Packing Materials", heading_style),
            material_table,
            Spacer(1, 25)
        ]
        story.append(KeepTogether(materials_section))
    
    if booking.notes:
        story.append(Paragraph("Internal Notes", heading_style))
        notes_para = Paragraph(booking.notes.replace('\n', '<br/>'), normal_style)
        story.append(notes_para)
        story.append(Spacer(1, 25))
    
    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "Thank you for choosing Almas Movers International",
        ParagraphStyle('Footer', alignment=TA_CENTER, fontSize=12,
                       textColor=colors.HexColor('#4c7085'), spaceAfter=6)
    ))
    story.append(Paragraph(
        "Your move is in safe hands.",
        ParagraphStyle('Footer', alignment=TA_CENTER, fontSize=10, textColor=colors.grey)
    ))
    
    doc.build(story)
    
    return filepath, filename