import os
import smtplib
import ssl
import string
import secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SYSTEM_EMAIL = "chohtabihari@gmail.com"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def send_password_reset_email(recipient_email: str, new_password: str, user_type: str) -> None:
    smtp_password = os.getenv("SMTP_APP_PASSWORD")
    if not smtp_password:
        raise RuntimeError("SMTP_APP_PASSWORD is not configured")

    message = MIMEMultipart("alternative")
    message["Subject"] = "Fleet Safety Monitoring - Temporary Password"
    message["From"] = SYSTEM_EMAIL
    message["To"] = recipient_email

    html = f"""
    <html>
      <body style='font-family: Arial, sans-serif; color: #111;'>
        <h2>Fleet Safety Monitoring System</h2>
        <p>Hello {user_type.title()} User,</p>
        <p>Your temporary password has been generated successfully.</p>
        <p><strong>Temporary Password:</strong> {new_password}</p>
        <p>Please login and update your password as soon as possible.</p>
      </body>
    </html>
    """

    message.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SYSTEM_EMAIL, smtp_password)
        server.sendmail(SYSTEM_EMAIL, recipient_email, message.as_string())
