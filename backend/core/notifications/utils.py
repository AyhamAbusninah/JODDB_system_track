# core/notifications/utils.py

from core.models import Notification
from django.db import IntegrityError



def create_notification(user_id: int, type: str, message: str, payload: dict = None):
    """
    Helper function to create a new notification record.
    
    Args:
        user_id (int): The ID of the user to notify.
        type (str): The type of notification (must match Notification.TYPE_CHOICES).
        message (str): The human-readable notification message.
        payload (dict, optional): Any extra JSON data to include (e.g., Task ID).
    """
    if payload is None:
        payload = {}
        
    try:
        Notification.objects.create(
            user_id=user_id,
            type=type,
            message=message,
            payload=payload
        )
        return True
    except IntegrityError as e:
        print(f"Error creating notification for user {user_id}: {e}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False