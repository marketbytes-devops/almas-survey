# backend/backend/celery.py
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# This line tells Celery where your Django settings are
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Namespace='CELERY' means all celery-related settings in settings.py
# should be prefixed with 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all apps (contact, quotation, survey, etc.)
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Celery is working! Request: {self.request!r}')