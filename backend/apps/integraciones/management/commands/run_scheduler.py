from django.core.management.base import BaseCommand
from apps.integraciones.scheduler import start_scheduler
import time

class Command(BaseCommand):
    help = "Inicia el APScheduler para las tareas programadas (Background Worker)"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando scheduler en proceso en background...")
        start_scheduler(force=True)
        
        try:
            # Mantener el proceso vivo para que el scheduler de background siga ejecutándose
            while True:
                time.sleep(60)
        except (KeyboardInterrupt, SystemExit):
            self.stdout.write("Deteniendo scheduler...")
