import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
import requests
from authapp.models import CustomUser
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Enquiry
from .serializers import EnquirySerializer

logger = logging.getLogger(__name__)

SERVICE_TYPE_DISPLAY = {
    "localMove": "Local Move",
    "internationalMove": "International Move",
    "carExport": "Car Import and Export",
    "storageServices": "Storage Services",
    "logistics": "Logistics",
}

def send_enquiry_emails(enquiry_data):
    service_type_display = SERVICE_TYPE_DISPLAY.get(
        enquiry_data["serviceType"], enquiry_data["serviceType"]
    )
    from_email = settings.DEFAULT_FROM_EMAIL

    try:
        # Customer email
        if enquiry_data["email"]:
            user_subject = "Thank You for Your Enquiry"
            user_message = f"""
Dear {enquiry_data['fullName']},

Thank you for reaching out to Almas Movers International regarding our {service_type_display} services. We have received your enquiry and will contact you soon.

Enquiry Details:
- Name: {enquiry_data["fullName"]}
- Service Type: {service_type_display}
- Email: {enquiry_data["email"]}
- Phone: {enquiry_data["phoneNumber"]}
- Message: {enquiry_data.get("message", "N/A")}

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            user_html_content = f"""
<html>
    <body>
        <h2>Thank You for Your Enquiry</h2>
        <p>Dear {enquiry_data['fullName']},</p>
        <p>Thank you for reaching out to Almas Movers International regarding our {service_type_display} services. We have received your enquiry and will contact you soon.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data["fullName"]}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data["email"]}</p>
        <p><strong>Phone:</strong> {enquiry_data["phoneNumber"]}</p>
        <p><strong>Message:</strong> {enquiry_data.get("message", "N/A")}</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>
        <p>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            try:
                customer_email = EmailMultiAlternatives(
                    subject=user_subject,
                    body=user_message,
                    from_email=from_email,
                    to=[enquiry_data["email"]],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                customer_email.attach_alternative(user_html_content, "text/html")
                customer_email.send(fail_silently=True)
                logger.info(f"User enquiry email sent to {enquiry_data['email']}")
            except Exception as e:
                logger.error(
                    f"Failed to send user email to {enquiry_data['email']}: {str(e)}",
                    exc_info=True,
                )

        # Admin email
        bcc_recipients = []
        if hasattr(settings, "BCC_CONTACT_EMAILS"):
            if isinstance(settings.BCC_CONTACT_EMAILS, str):
                bcc_recipients = [
                    email.strip()
                    for email in settings.BCC_CONTACT_EMAILS.split(",")
                    if email.strip()
                ]
            elif isinstance(settings.BCC_CONTACT_EMAILS, (list, tuple)):
                bcc_recipients = list(settings.BCC_CONTACT_EMAILS)

        admin_subject = f"New Enquiry: {service_type_display} from {enquiry_data['fullName']}"
        admin_message = f"""
Dear Team,

A new enquiry has been received.

Enquiry Details:
- Name: {enquiry_data["fullName"]}
- Service Type: {service_type_display}
- Email: {enquiry_data["email"]}
- Phone: {enquiry_data["phoneNumber"]}
- Message: {enquiry_data.get("message", "N/A")}
- Referer URL: {enquiry_data.get("refererUrl", "N/A")}
- Submitted URL: {enquiry_data.get("submittedUrl", "N/A")}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
        admin_html_content = f"""
<html>
    <body>
        <h2>New Enquiry Received</h2>
        <p>Dear Team,</p>
        <p>A new enquiry has been received.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data["fullName"]}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data["email"]}</p>
        <p><strong>Phone:</strong> {enquiry_data["phoneNumber"]}</p>
        <p><strong>Message:</strong> {enquiry_data.get("message", "N/A")}</p>
        <p><strong>Referer URL:</strong> {enquiry_data.get("refererUrl", "N/A")}</p>
        <p><strong>Submitted URL:</strong> {enquiry_data.get("submittedUrl", "N/A")}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
        try:
            email = EmailMultiAlternatives(
                subject=admin_subject,
                body=admin_message,
                from_email=from_email,
                to=[settings.CONTACT_EMAIL],
                bcc=bcc_recipients,
                reply_to=[enquiry_data["email"]] if enquiry_data["email"] else [],
            )
            email.attach_alternative(admin_html_content, "text/html")
            email.send(fail_silently=True)
            logger.info(
                f"Admin email sent to {settings.CONTACT_EMAIL} with BCC to {bcc_recipients}"
            )
        except Exception as e:
            logger.error(
                f"Failed to send admin email to {settings.CONTACT_EMAIL}: {str(e)}",
                exc_info=True,
            )
    except Exception as e:
        logger.error(f"Failed to send enquiry emails: {str(e)}", exc_info=True)

def send_survey_email(enquiry, action, survey_date=None, reason=None, contact_status=None, contact_status_note=None, reached_out_whatsapp=None, reached_out_email=None):
    from_email = settings.DEFAULT_FROM_EMAIL
    service_type_display = SERVICE_TYPE_DISPLAY.get(
        enquiry.serviceType, enquiry.serviceType
    )
    superadmin_email = settings.CONTACT_EMAIL
    recipients = []

    # Admin and salesperson recipients
    recipients.append(superadmin_email)
    if enquiry.assigned_user and enquiry.assigned_user.email:
        if enquiry.assigned_user.email != superadmin_email:
            recipients.append(enquiry.assigned_user.email)

    # Set assigned_name based on whether superadmin_email is in recipients
    assigned_name = "Team" if superadmin_email in recipients else (
        f"{enquiry.assigned_user.name} ({enquiry.assigned_user.role.name})"
        if enquiry.assigned_user and enquiry.assigned_user.name and enquiry.assigned_user.role
        else "Team"
    )

    logger.debug(f"Processing survey email for action: {action}, enquiry ID: {enquiry.id}, customer email: {enquiry.email}, survey_date: {survey_date}")

    try:
        if action == "assign":
            subject = f"Enquiry Assignment: {enquiry.fullName}"
            message = f"""
Dear {assigned_name},

An enquiry from {enquiry.fullName} has been assigned to you.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Message: {enquiry.message or 'N/A'}
- Note: {enquiry.note or 'N/A'}
- Assigned To: {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            html_content = f"""
<html>
    <body>
        <h2>Enquiry Assignment Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>An enquiry from {enquiry.fullName} has been assigned to you.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Message:</strong> {enquiry.message or 'N/A'}</p>
        <p><strong>Note:</strong> {enquiry.note or 'N/A'}</p>
        <p><strong>Assigned To:</strong> {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipients,
                reply_to=[enquiry.email] if enquiry.email else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")

        elif action in ("schedule", "reschedule"):
            # Admin and Salesperson email
            subject = f"Survey {action.capitalize()}: {enquiry.fullName}"
            message = f"""
Dear {assigned_name},

A survey for {enquiry.fullName} has been {action}d.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Message: {enquiry.message or 'N/A'}
- Note: {enquiry.note or 'N/A'}
- Survey Date: {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}
- Contact Status: {enquiry.contact_status or 'Not Attended'}
- Contact Status Note: {enquiry.contact_status_note or 'N/A'}
- Assigned To: {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            html_content = f"""
<html>
    <body>
        <h2>Survey {action.capitalize()} Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>A survey for {enquiry.fullName} has been {action}d.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Message:</strong> {enquiry.message or 'N/A'}</p>
        <p><strong>Note:</strong> {enquiry.note or 'N/A'}</p>
        <p><strong>Survey Date:</strong> {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}</p>
        <p><strong>Contact Status:</strong> {enquiry.contact_status or 'Not Attended'}</p>
        <p><strong>Contact Status Note:</strong> {enquiry.contact_status_note or 'N/A'}</p>
        <p><strong>Assigned To:</strong> {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            admin_email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipients,
                reply_to=[enquiry.email] if enquiry.email else [],
            )
            admin_email.attach_alternative(html_content, "text/html")
            admin_email.send(fail_silently=False)
            logger.info(f"Survey {action} admin email sent to {', '.join(recipients)}")

            # Customer confirmation email
            if enquiry.email:
                customer_subject = f"Your Survey Has Been {action.capitalize()}d"
                customer_message = f"""
Dear {enquiry.fullName},

We have {action}d a survey for your {service_type_display} enquiry.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Survey Date: {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}
- Contact Email: {settings.CONTACT_EMAIL}

We look forward to assisting you. Please contact us at {settings.CONTACT_EMAIL} for any questions.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
                customer_html_content = f"""
<html>
    <body>
        <h2>Survey {action.capitalize()} Confirmation</h2>
        <p>Dear {enquiry.fullName},</p>
        <p>We have {action}d a survey for your {service_type_display} enquiry.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Survey Date:</strong> {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a></p>
        <p>We look forward to assisting you. Please contact us at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any questions.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
                customer_email = EmailMultiAlternatives(
                    subject=customer_subject,
                    body=customer_message,
                    from_email=from_email,
                    to=[enquiry.email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                customer_email.attach_alternative(customer_html_content, "text/html")
                try:
                    customer_email.send(fail_silently=False)
                    logger.info(f"Survey {action} confirmation email sent to customer {enquiry.email}")
                except Exception as e:
                    logger.error(f"Failed to send survey {action} confirmation email to {enquiry.email}: {str(e)}", exc_info=True)

                # Customer reminder email
                reminder_subject = f"Reminder: Your Upcoming Survey for {service_type_display}"
                reminder_message = f"""
Dear {enquiry.fullName},

This is a reminder of your upcoming survey for your {service_type_display} enquiry.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Survey Date: {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}
- Contact Email: {settings.CONTACT_EMAIL}

Please ensure you are available for the survey. Contact us at {settings.CONTACT_EMAIL} if you need to reschedule or have any questions.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
                reminder_html_content = f"""
<html>
    <body>
        <h2>Reminder: Your Upcoming Survey</h2>
        <p>Dear {enquiry.fullName},</p>
        <p>This is a reminder of your upcoming survey for your {service_type_display} enquiry.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Survey Date:</strong> {survey_date.strftime('%Y-%m-%d %H:%M') if survey_date else 'N/A'}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a></p>
        <p>Please ensure you are available for the survey. Contact us at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> if you need to reschedule or have any questions.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
                reminder_email = EmailMultiAlternatives(
                    subject=reminder_subject,
                    body=reminder_message,
                    from_email=from_email,
                    to=[enquiry.email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                reminder_email.attach_alternative(reminder_html_content, "text/html")
                try:
                    reminder_email.send(fail_silently=False)
                    logger.info(f"Survey {action} reminder email sent to customer {enquiry.email}")
                except Exception as e:
                    logger.error(f"Failed to send survey {action} reminder email to {enquiry.email}: {str(e)}", exc_info=True)

        elif action == "contact_status_update":
            subject = f"Contact Status Updated: {enquiry.fullName}"
            message = f"""
Dear {assigned_name},

The contact status for the enquiry from {enquiry.fullName} has been updated.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Message: {enquiry.message or 'N/A'}
- Note: {enquiry.note or 'N/A'}
- Survey Date: {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}
- Contact Status: {contact_status or enquiry.contact_status or 'Not Attended'}
- Contact Status Note: {contact_status_note or enquiry.contact_status_note or 'N/A'}
- Reached Out via WhatsApp: {'Yes' if reached_out_whatsapp else 'No'}
- Reached Out via Email: {'Yes' if reached_out_email else 'No'}
- Assigned To: {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            html_content = f"""
<html>
    <body>
        <h2>Contact Status Update Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>The contact status for the enquiry from {enquiry.fullName} has been updated.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Message:</strong> {enquiry.message or 'N/A'}</p>
        <p><strong>Note:</strong> {enquiry.note or 'N/A'}</p>
        <p><strong>Survey Date:</strong> {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}</p>
        <p><strong>Contact Status:</strong> {contact_status or enquiry.contact_status or 'Not Attended'}</p>
        <p><strong>Contact Status Note:</strong> {contact_status_note or enquiry.contact_status_note or 'N/A'}</p>
        <p><strong>Reached Out via WhatsApp:</strong> {'Yes' if reached_out_whatsapp else 'No'}</p>
        <p><strong>Reached Out via Email:</strong> {'Yes' if reached_out_email else 'No'}</p>
        <p><strong>Assigned To:</strong> {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipients,
                reply_to=[enquiry.email] if enquiry.email else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")

        elif action == "cancel":
            # Admin and Salesperson email
            subject = f"Survey Cancelled: {enquiry.fullName}"
            message = f"""
Dear {assigned_name},

The survey for {enquiry.fullName} has been cancelled.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Message: {enquiry.message or 'N/A'}
- Note: {enquiry.note or 'N/A'}
- Survey Date: Previously {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}
- Reason for Cancellation: {reason or 'N/A'}
- Contact Status: {enquiry.contact_status or 'Not Attended'}
- Contact Status Note: {enquiry.contact_status_note or 'N/A'}
- Assigned To: {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            html_content = f"""
<html>
    <body>
        <h2>Survey Cancellation Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>The survey for {enquiry.fullName} has been cancelled.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Message:</strong> {enquiry.message or 'N/A'}</p>
        <p><strong>Note:</strong> {enquiry.note or 'N/A'}</p>
        <p><strong>Survey Date:</strong> Previously {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}</p>
        <p><strong>Reason for Cancellation:</strong> {reason or 'N/A'}</p>
        <p><strong>Contact Status:</strong> {enquiry.contact_status or 'Not Attended'}</p>
        <p><strong>Contact Status Note:</strong> {enquiry.contact_status_note or 'N/A'}</p>
        <p><strong>Assigned To:</strong> {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipients,
                reply_to=[enquiry.email] if enquiry.email else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")

            # Customer email
            if enquiry.email:
                customer_subject = f"Your Survey Has Been Cancelled"
                customer_message = f"""
Dear {enquiry.fullName},

We regret to inform you that the survey for your {service_type_display} enquiry has been cancelled.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Reason for Cancellation: {reason or 'N/A'}
- Contact Email: {settings.CONTACT_EMAIL}

Please contact us at {settings.CONTACT_EMAIL} to discuss further or reschedule if needed.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
                customer_html_content = f"""
<html>
    <body>
        <h2>Survey Cancellation Confirmation</h2>
        <p>Dear {enquiry.fullName},</p>
        <p>We regret to inform you that the survey for your {service_type_display} enquiry has been cancelled.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Reason for Cancellation:</strong> {reason or 'N/A'}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a></p>
        <p>Please contact us at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> to discuss further or reschedule if needed.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
                customer_email = EmailMultiAlternatives(
                    subject=customer_subject,
                    body=customer_message,
                    from_email=from_email,
                    to=[enquiry.email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                customer_email.attach_alternative(customer_html_content, "text/html")
                customer_email.send(fail_silently=False)
                logger.info(f"Survey {action} email sent to customer {enquiry.email}")

        else:
            subject = f"Survey Notification: {enquiry.fullName}"
            message = f"""
Dear {assigned_name},

The survey status for {enquiry.fullName} has changed.

Enquiry Details:
- Name: {enquiry.fullName}
- Service Type: {service_type_display}
- Email: {enquiry.email}
- Phone: {enquiry.phoneNumber}
- Message: {enquiry.message or 'N/A'}
- Note: {enquiry.note or 'N/A'}
- Survey Date: {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}
- Contact Status: {enquiry.contact_status or 'Not Attended'}
- Assigned To: {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""
            html_content = f"""
<html>
    <body>
        <h2>Survey Status Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>The survey status for {enquiry.fullName} has changed.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry.fullName}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry.email}</p>
        <p><strong>Phone:</strong> {enquiry.phoneNumber}</p>
        <p><strong>Message:</strong> {enquiry.message or 'N/A'}</p>
        <p><strong>Note:</strong> {enquiry.note or 'N/A'}</p>
        <p><strong>Survey Date:</strong> {enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if enquiry.survey_date else 'Not scheduled'}</p>
        <p><strong>Contact Status:</strong> {enquiry.contact_status or 'Not Attended'}</p>
        <p><strong>Assigned To:</strong> {enquiry.assigned_user.email if enquiry.assigned_user else 'Unassigned'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipients,
                reply_to=[enquiry.email] if enquiry.email else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")

    except Exception as e:
        logger.error(f"Failed to send survey {action} email for enquiry {enquiry.id}: {str(e)}", exc_info=True)
        raise

class EnquiryListCreate(generics.ListCreateAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        logger.debug(f"User: {user}, Authenticated: {user.is_authenticated}, Is Superadmin: {user.is_superuser or (hasattr(user, 'role') and user.role.name == 'Superadmin')}")
        
        if not user.is_authenticated:
            logger.warning("User not authenticated, returning empty queryset")
            return queryset.none()

        # Superadmin sees all enquiries
        if user.is_superuser or (hasattr(user, 'role') and user.role.name == "Superadmin"):
            logger.debug("Superadmin access: returning all enquiries")
            return queryset

        has_survey = self.request.query_params.get("has_survey")
        contact_status = self.request.query_params.get("contact_status")
        unassigned = self.request.query_params.get("unassigned")
        assigned_user_email = self.request.query_params.get("assigned_user_email")

        logger.debug(f"Query Params: has_survey={has_survey}, assigned_user_email={assigned_user_email}, contact_status={contact_status}, unassigned={unassigned}")

        # For non-Superadmins, filter by assigned_user_email or logged-in user
        if assigned_user_email:
            queryset = queryset.filter(assigned_user__email__iexact=assigned_user_email)
        else:
            queryset = queryset.filter(assigned_user=user)

        if contact_status:
            queryset = queryset.filter(contact_status=contact_status)
        if unassigned == "true":
            queryset = queryset.filter(assigned_user__isnull=True)
        if has_survey == "true":
            queryset = queryset.filter(survey_date__isnull=False)
        elif has_survey == "false":
            queryset = queryset.filter(survey_date__isnull=True)

        logger.debug(f"Queryset count: {queryset.count()}")
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            recaptcha_token = request.data.get("recaptchaToken")
            if not recaptcha_token:
                return Response(
                    {"error": "reCAPTCHA token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            recaptcha_response = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_token,
                },
            )
            recaptcha_result = recaptcha_response.json()

            if (
                not recaptcha_result.get("success")
                or recaptcha_result.get("score", 0) < 0.5
            ):
                return Response(
                    {"error": "Invalid reCAPTCHA. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            enquiry = serializer.save()
            send_enquiry_emails(serializer.data)
            return Response(
                self.serializer_class(enquiry).data, status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Failed to create enquiry: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EnquiryRetrieveUpdate(generics.RetrieveUpdateAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        return queryset

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        previous_assigned_user_email = instance.assigned_user.email if instance.assigned_user else None
        previous_contact_status = instance.contact_status
        serializer.save()
        if 'assigned_user_email' in request.data and request.data['assigned_user_email'] != previous_assigned_user_email:
            send_survey_email(instance, "assign")
        if 'contact_status' in request.data and request.data['contact_status'] != previous_contact_status:
            send_survey_email(
                instance,
                "contact_status_update",
                contact_status=request.data.get('contact_status'),
                contact_status_note=request.data.get('contact_status_note'),
                reached_out_whatsapp=request.data.get('reached_out_whatsapp'),
                reached_out_email=request.data.get('reached_out_email')
            )
        return Response(serializer.data, status=status.HTTP_200_OK)

class EnquiryDelete(generics.DestroyAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def perform_destroy(self, instance):
        instance.delete()

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Enquiry deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

class EnquiryDeleteAll(generics.GenericAPIView):

    def delete(self, request, *args, **kwargs):
        count, _ = Enquiry.objects.all().delete()
        return Response(
            {"message": f"Successfully deleted {count} enquiries"},
            status=status.HTTP_204_NO_CONTENT,
        )

class EnquirySchedule(generics.GenericAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            enquiry = self.get_queryset().get(pk=pk)
            survey_date = request.data.get("survey_date")
            if not survey_date:
                logger.error(f"Survey date is missing for enquiry {pk}")
                return Response(
                    {"error": "Survey date is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            logger.debug(f"Received survey_date for enquiry {pk}: {survey_date}")
            serializer = self.get_serializer(
                enquiry, data={"survey_date": survey_date}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            # Check if survey_date was previously null to determine schedule vs reschedule
            action = "schedule" if enquiry.survey_date is None else "reschedule"
            serializer.save()
            logger.info(f"Scheduling action determined: {action} for enquiry {pk}")
            send_survey_email(enquiry, action, survey_date=enquiry.survey_date)
            logger.info(f"Survey {action} email triggered for enquiry {pk}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Enquiry.DoesNotExist:
            logger.error(f"Enquiry {pk} not found")
            return Response(
                {"error": "Enquiry not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(
                f"Failed to schedule survey for enquiry {pk}: {str(e)}",
                exc_info=True
            )
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EnquiryCancelSurvey(generics.GenericAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            enquiry = self.get_queryset().get(pk=pk)
            reason = request.data.get("reason")
            if not reason:
                return Response(
                    {"error": "Reason for cancellation is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer = self.get_serializer(
                enquiry, data={"survey_date": None}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            send_survey_email(enquiry, "cancel", reason=reason)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Enquiry.DoesNotExist:
            return Response(
                {"error": "Enquiry not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(
                f"Failed to cancel survey for enquiry {pk}: {str(e)}", exc_info=True
            )
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)