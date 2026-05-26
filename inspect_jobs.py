import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
django.setup()

from django_apscheduler.models import DjangoJob

for j in DjangoJob.objects.all():
    print(f"ID: {j.id}, Next run: {j.next_run_time}, State size: {len(j.job_state)}")
