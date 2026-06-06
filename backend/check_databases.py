import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()
from django.conf import settings
print("DATABASES: ", settings.DATABASES)
