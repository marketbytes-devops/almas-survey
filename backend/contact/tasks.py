from celery import shared_task
from django.core.mail import EmailMultiAlternatives, send_mail
from django.conf import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

SERVICE_TYPE_DISPLAY = {
    "localMove": "Local Move",
    "internationalMove": "International Move",
    "carExport": "Car Import and Export",
    "storageServices": "Storage Services",
    "logistics": "Logistics",
}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_enquiry_emails_task(self, enquiry_data):
    """
    Send enquiry emails matching old synchronous function
    Parameters:
        enquiry_data (dict): Full serializer data dict
    """
    print(f"CELERY TASK: Sending enquiry email for {enquiry_data.get('fullName')}")
    logger.info(f"Processing enquiry email for {enquiry_data.get('fullName')}")

    try:
        service_type_display = SERVICE_TYPE_DISPLAY.get(
            enquiry_data["serviceType"], enquiry_data["serviceType"]
        )
        from_email = settings.DEFAULT_FROM_EMAIL
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
- Message: {enquiry_data.get("message", "Nil")}
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
        <p><strong>Message:</strong> {enquiry_data.get("message", "Nil")}</p>
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
                customer_email.send(fail_silently=False)
                logger.info(f"User enquiry email sent to {enquiry_data['email']}")
            except Exception as e:
                logger.error(
                    f"Failed to send user email to {enquiry_data['email']}: {str(e)}",
                    exc_info=True,
                )
                raise  
        bcc_recipient_list = []
        if hasattr(settings, "BCC_CONTACT_EMAILS"):
            if isinstance(settings.BCC_CONTACT_EMAILS, str):
                bcc_recipient_list = [
                    email.strip()
                    for email in settings.BCC_CONTACT_EMAILS.split(",")
                    if email.strip()
                ]
            elif isinstance(settings.BCC_CONTACT_EMAILS, (list, tuple)):
                bcc_recipient_list = list(settings.BCC_CONTACT_EMAILS)
        admin_subject = f"New Enquiry: {service_type_display} from {enquiry_data['fullName']}"
        admin_message = f"""
Dear Team,
A new enquiry has been received.
Enquiry Details:
- Name: {enquiry_data["fullName"]}
- Service Type: {service_type_display}
- Email: {enquiry_data["email"]}
- Phone: {enquiry_data["phoneNumber"]}
- Message: {enquiry_data.get("message", "Nil")}
- Referer URL: {enquiry_data.get("refererUrl", "Nil")}
- Submitted URL: {enquiry_data.get("submittedUrl", "Nil")}
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
        <p><strong>Message:</strong> {enquiry_data.get("message", "Nil")}</p>
        <p><strong>Referer URL:</strong> {enquiry_data.get("refererUrl", "Nil")}</p>
        <p><strong>Submitted URL:</strong> {enquiry_data.get("submittedUrl", "Nil")}</p>
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
                bcc=bcc_recipient_list,
                reply_to=[enquiry_data["email"]] if enquiry_data["email"] else [],
            )
            email.attach_alternative(admin_html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(
                f"Admin email sent to {settings.CONTACT_EMAIL} with BCC to {bcc_recipient_list}"
            )
        except Exception as e:
            logger.error(
                f"Failed to send admin email to {settings.CONTACT_EMAIL}: {str(e)}",
                exc_info=True,
            )
            raise  

        print("ENQUIRY EMAILS SENT SUCCESSFULLY")
        logger.info(f"Enquiry emails sent successfully for {enquiry_data.get('fullName')}")

    except Exception as exc:
        print(f"EMAIL FAILED → RETRYING IN 60 SECONDS: {exc}")
        logger.error(f"Enquiry email failed: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_survey_email_task(
    self, 
    enquiry_data, 
    action, 
    survey_date=None, 
    reason=None
):
    """
    Send survey-related emails matching old synchronous function
    
    Parameters:
        enquiry_data (dict): Full serializer data dict with all fields
        action (str): 'assign', 'schedule', 'reschedule', 'cancel', 'contact_status_update'
        survey_date (str, optional): ISO format date string for schedule/reschedule
        reason (str, optional): Cancellation reason
    """
    print(f"CELERY TASK: Survey email | Action: {action} | Customer: {enquiry_data.get('fullName')}")
    logger.info(f"Processing survey {action} email for {enquiry_data.get('fullName')}")

    try:
        from_email = settings.DEFAULT_FROM_EMAIL
        service_type_display = SERVICE_TYPE_DISPLAY.get(
            enquiry_data["serviceType"], enquiry_data["serviceType"]
        )
        superadmin_email = settings.CONTACT_EMAIL
        recipients = [superadmin_email]
        if enquiry_data.get("assigned_user_email") and enquiry_data["assigned_user_email"] != superadmin_email:
            recipients.append(enquiry_data["assigned_user_email"])
        assigned_name = "Team"
        customer_email = enquiry_data.get("email")
        logger.debug(f"Processing survey email for action: {action}, enquiry ID: {enquiry_data.get('id')}, customer email: {customer_email}, survey_date: {survey_date}")

        def format_date(date_str):
            if date_str:
                try:
                    return datetime.fromisoformat(date_str).strftime('%Y-%m-%d %H:%M')
                except:
                    return 'Nil'
            return 'Nil'

        if action == "assign":
            subject = f"Enquiry Assignment: {enquiry_data['fullName']}"
            message = f"""
Dear {assigned_name},
An enquiry from {enquiry_data['fullName']} has been assigned to you.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Message: {enquiry_data.get('message', 'Nil')}
- Note: {enquiry_data.get('note', 'Nil')}
- Assigned To: {enquiry_data.get('assigned_user_email', 'Unassigned')}
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
        <p>An enquiry from {enquiry_data['fullName']} has been assigned to you.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Message:</strong> {enquiry_data.get('message', 'Nil')}</p>
        <p><strong>Note:</strong> {enquiry_data.get('note', 'Nil')}</p>
        <p><strong>Assigned To:</strong> {enquiry_data.get('assigned_user_email', 'Unassigned')}</p>
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
                reply_to=[enquiry_data['email']] if enquiry_data['email'] else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")
        elif action in ("schedule", "reschedule"):
            survey_formatted = format_date(survey_date)
            subject = f"Survey {action.capitalize()}: {enquiry_data['fullName']}"
            message = f"""
Dear {assigned_name},
A survey for {enquiry_data['fullName']} has been {action}d.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Message: {enquiry_data.get('message', 'Nil')}
- Note: {enquiry_data.get('note', 'Nil')}
- Survey Date: {survey_formatted}
- Contact Status: {enquiry_data.get('contact_status', 'Not Attended')}
- Contact Status Note: {enquiry_data.get('contact_status_note', 'Nil')}
- Assigned To: {enquiry_data.get('assigned_user_email', 'Unassigned')}
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
        <p>A survey for {enquiry_data['fullName']} has been {action}d.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Message:</strong> {enquiry_data.get('message', 'Nil')}</p>
        <p><strong>Note:</strong> {enquiry_data.get('note', 'Nil')}</p>
        <p><strong>Survey Date:</strong> {survey_formatted}</p>
        <p><strong>Contact Status:</strong> {enquiry_data.get('contact_status', 'Not Attended')}</p>
        <p><strong>Contact Status Note:</strong> {enquiry_data.get('contact_status_note', 'Nil')}</p>
        <p><strong>Assigned To:</strong> {enquiry_data.get('assigned_user_email', 'Unassigned')}</p>
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
                reply_to=[enquiry_data['email']] if enquiry_data['email'] else [],
            )
            admin_email.attach_alternative(html_content, "text/html")
            admin_email.send(fail_silently=False)
            logger.info(f"Survey {action} admin email sent to {', '.join(recipients)}")
            if customer_email:
                customer_subject = f"Your Survey Has Been {action.capitalize()}d"
                customer_message = f"""
Dear {enquiry_data['fullName']},
We have {action}d a survey for your {service_type_display} enquiry.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Survey Date: {survey_formatted}
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
        <p>Dear {enquiry_data['fullName']},</p>
        <p>We have {action}d a survey for your {service_type_display} enquiry.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Survey Date:</strong> {survey_formatted}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a></p>
        <p>We look forward to assisting you. Please contact us at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any questions.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
                customer_email_obj = EmailMultiAlternatives(
                    subject=customer_subject,
                    body=customer_message,
                    from_email=from_email,
                    to=[customer_email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                customer_email_obj.attach_alternative(customer_html_content, "text/html")
                try:
                    customer_email_obj.send(fail_silently=False)
                    logger.info(f"Survey {action} confirmation email sent to customer {customer_email}")
                except Exception as e:
                    logger.error(f"Failed to send survey {action} confirmation email to {customer_email}: {str(e)}", exc_info=True)
                    raise  
                reminder_subject = f"Reminder: Your Upcoming Survey for {service_type_display}"
                reminder_message = f"""
Dear {enquiry_data['fullName']},
This is a reminder of your upcoming survey for your {service_type_display} enquiry.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Survey Date: {survey_formatted}
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
        <p>Dear {enquiry_data['fullName']},</p>
        <p>This is a reminder of your upcoming survey for your {service_type_display} enquiry.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Survey Date:</strong> {survey_formatted}</p>
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
                    to=[customer_email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                reminder_email.attach_alternative(reminder_html_content, "text/html")
                try:
                    reminder_email.send(fail_silently=False)
                    logger.info(f"Survey {action} reminder email sent to customer {customer_email}")
                except Exception as e:
                    logger.error(f"Failed to send survey {action} reminder email to {customer_email}: {str(e)}", exc_info=True)
                    raise  
        elif action == "contact_status_update":
            survey_formatted = format_date(enquiry_data.get('survey_date'))
            subject = f"Contact Status Updated: {enquiry_data['fullName']}"
            message = f"""
Dear {assigned_name},
The contact status for the enquiry from {enquiry_data['fullName']} has been updated.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Message: {enquiry_data.get('message', 'Nil')}
- Note: {enquiry_data.get('note', 'Nil')}
- Survey Date: {survey_formatted}
- Contact Status: {enquiry_data.get('contact_status', 'Not Attended')}
- Contact Status Note: {enquiry_data.get('contact_status_note', 'Nil')}
- Reached Out via WhatsApp: {'Yes' if enquiry_data.get('reached_out_whatsapp') else 'No'}
- Reached Out via Email: {'Yes' if enquiry_data.get('reached_out_email') else 'No'}
- Assigned To: {enquiry_data.get('assigned_user_email', 'Unassigned')}
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
        <p>The contact status for the enquiry from {enquiry_data['fullName']} has been updated.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Message:</strong> {enquiry_data.get('message', 'Nil')}</p>
        <p><strong>Note:</strong> {enquiry_data.get('note', 'Nil')}</p>
        <p><strong>Survey Date:</strong> {survey_formatted}</p>
        <p><strong>Contact Status:</strong> {enquiry_data.get('contact_status', 'Not Attended')}</p>
        <p><strong>Contact Status Note:</strong> {enquiry_data.get('contact_status_note', 'Nil')}</p>
        <p><strong>Reached Out via WhatsApp:</strong> {'Yes' if enquiry_data.get('reached_out_whatsapp') else 'No'}</p>
        <p><strong>Reached Out via Email:</strong> {'Yes' if enquiry_data.get('reached_out_email') else 'No'}</p>
        <p><strong>Assigned To:</strong> {enquiry_data.get('assigned_user_email', 'Unassigned')}</p>
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
                reply_to=[enquiry_data['email']] if enquiry_data['email'] else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipient_list)}")
        elif action == "cancel":
            previous_survey_formatted = format_date(enquiry_data.get('previous_survey_date'))
            subject = f"Survey Cancelled: {enquiry_data['fullName']}"
            message = f"""
Dear {assigned_name},
The survey for {enquiry_data['fullName']} has been cancelled.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Message: {enquiry_data.get('message', 'Nil')}
- Note: {enquiry_data.get('note', 'Nil')}
- Survey Date: Previously {previous_survey_formatted}
- Reason for Cancellation: {reason or 'Nil'}
- Contact Status: {enquiry_data.get('contact_status', 'Not Attended')}
- Contact Status Note: {enquiry_data.get('contact_status_note', 'Nil')}
- Assigned To: {enquiry_data.get('assigned_user_email', 'Unassigned')}
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
        <p>The survey for {enquiry_data['fullName']} has been cancelled.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Message:</strong> {enquiry_data.get('message', 'Nil')}</p>
        <p><strong>Note:</strong> {enquiry_data.get('note', 'Nil')}</p>
        <p><strong>Survey Date:</strong> Previously {previous_survey_formatted}</p>
        <p><strong>Reason for Cancellation:</strong> {reason or 'Nil'}</p>
        <p><strong>Contact Status:</strong> {enquiry_data.get('contact_status', 'Not Attended')}</p>
        <p><strong>Contact Status Note:</strong> {enquiry_data.get('contact_status_note', 'Nil')}</p>
        <p><strong>Assigned To:</strong> {enquiry_data.get('assigned_user_email', 'Unassigned')}</p>
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
                reply_to=[enquiry_data['email']] if enquiry_data['email'] else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")
            if customer_email:
                customer_subject = f"Your Survey Has Been Cancelled"
                customer_message = f"""
Dear {enquiry_data['fullName']},
We regret to inform you that the survey for your {service_type_display} enquiry has been cancelled.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Reason for Cancellation: {reason or 'Nil'}
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
        <p>Dear {enquiry_data['fullName']},</p>
        <p>We regret to inform you that the survey for your {service_type_display} enquiry has been cancelled.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Reason for Cancellation:</strong> {reason or 'Nil'}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a></p>
        <p>Please contact us at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> to discuss further or reschedule if needed.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""
                customer_email_obj = EmailMultiAlternatives(
                    subject=customer_subject,
                    body=customer_message,
                    from_email=from_email,
                    to=[customer_email],
                    reply_to=[settings.CONTACT_EMAIL],
                )
                customer_email_obj.attach_alternative(customer_html_content, "text/html")
                customer_email_obj.send(fail_silently=False)
                logger.info(f"Survey {action} email sent to customer {customer_email}")
        else:
            survey_formatted = format_date(enquiry_data.get('survey_date'))
            subject = f"Survey Notification: {enquiry_data['fullName']}"
            message = f"""
Dear {assigned_name},
The survey status for {enquiry_data['fullName']} has changed.
Enquiry Details:
- Name: {enquiry_data['fullName']}
- Service Type: {service_type_display}
- Email: {enquiry_data['email']}
- Phone: {enquiry_data['phoneNumber']}
- Message: {enquiry_data.get('message', 'Nil')}
- Note: {enquiry_data.get('note', 'Nil')}
- Survey Date: {survey_formatted}
- Contact Status: {enquiry_data.get('contact_status', 'Not Attended')}
- Assigned To: {enquiry_data.get('assigned_user_email', 'Unassigned')}
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
        <p>The survey status for {enquiry_data['fullName']} has changed.</p>
        <h3>Enquiry Details:</h3>
        <p><strong>Name:</strong> {enquiry_data['fullName']}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {enquiry_data['email']}</p>
        <p><strong>Phone:</strong> {enquiry_data['phoneNumber']}</p>
        <p><strong>Message:</strong> {enquiry_data.get('message', 'Nil')}</p>
        <p><strong>Note:</strong> {enquiry_data.get('note', 'Nil')}</p>
        <p><strong>Survey Date:</strong> {survey_formatted}</p>
        <p><strong>Contact Status:</strong> {enquiry_data.get('contact_status', 'Not Attended')}</p>
        <p><strong>Assigned To:</strong> {enquiry_data.get('assigned_user_email', 'Unassigned')}</p>
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
                reply_to=[enquiry_data['email']] if enquiry_data['email'] else [],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Survey {action} email sent to {', '.join(recipients)}")

        print(f"SURVEY EMAIL ({action}) SENT SUCCESSFULLY")
        logger.info(f"Survey {action} email sent successfully for {enquiry_data.get('fullName')}")

    except Exception as exc:
        print(f"SURVEY EMAIL FAILED → RETRYING IN 60 SECONDS: {exc}")
        logger.error(f"Survey email failed: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_user_creation_email(self, user_data, password):
    """
    Send login credentials email when user is created
    
    Parameters:
        user_data (dict): Dictionary with name, email
        password (str): Plain text password
    """
    print(f"CELERY TASK: Sending user creation email to: {user_data['email']}")
    logger.info(f"Processing user creation email for {user_data['email']}")

    try:
        subject = "Your Almas Account - Login Credentials"
        message = f"""
Hello {user_data['name']},

Your account has been created!

Email: {user_data['email']}
Password: {password}

Please login and change your password immediately.

Login URL: http://127.0.0.1:5173/login

Best regards,
Almas Team
        """

        print(f"Sending credentials email to: {user_data['email']}")
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user_data["email"]],
            fail_silently=False,
        )

        print(f"User creation email sent to: {user_data['email']}")
        logger.info(f"User creation email sent successfully to {user_data['email']}")
        return "Email sent"

    except Exception as exc:
        print(f"USER EMAIL FAILED → RETRYING IN 60 SECONDS: {exc}")
        logger.error(f"User creation email failed: {exc}", exc_info=True)
        raise self.retry(exc=exc)