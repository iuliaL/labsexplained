import requests
from app.config import MAILGUN_DOMAIN, EMAIL_FROM, MAILGUN_API_KEY


def send_password_reset_email(
    to_email: str, name: str, expires_hours: int, reset_link: str
):
    """
    Sends a password reset email via Mailgun.
    """
    # Mailgun API endpoint for sending emails
    url = f"https://api.eu.mailgun.net/v3/{MAILGUN_DOMAIN}/messages"

    # Data to send in the POST request
    data = {
        "from": EMAIL_FROM,
        "to": to_email,
        "subject": "Reset your password",
        "html": f"""
        <p>Hi {name},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in {expires_hours} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The LabsExplained Team</p>
        """,
    }

    # Authentication for Mailgun (using API key)
    auth = ("api", MAILGUN_API_KEY)

    try:
        # Send the request to Mailgun API
        response = requests.post(url, auth=auth, data=data)

        if response.status_code == 200:
            print(f"Password reset email sent to {to_email}")
        else:
            # Raise an exception if Mailgun returns a non-200 status code
            raise Exception(f"{response.status_code} - {response.text}")

    except Exception as e:
        print(f"Error sending email: {e}")
        # Raise the exception to notify the caller that something went wrong
        raise Exception(e)
