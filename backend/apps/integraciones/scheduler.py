# apps/integraciones/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events
from django.utils import timezone
from django.conf import settings
import sys

# Mantiene una única instancia del scheduler
scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)

def start_scheduler():
    # Evita correr el scheduler en el proceso de automigración o comandos de manage.py (excepto runserver)
    if 'runserver' not in sys.argv:
        return

    # Si ya está corriendo, no lo arrancamos de nuevo
    if scheduler.running:
        return

    scheduler.add_jobstore(DjangoJobStore(), "default")
    register_events(scheduler)
    scheduler.start()
    print("Scheduler de tareas (APScheduler) iniciado para Lotes Programados.")

def schedule_publicacion_lote(ciclo_id, fecha_programada):
    """
    Programa la publicación de un Lote (CicloVenta) en Facebook para la fecha indicada.
    """
    from .tasks import ejecutar_publicacion_lote
    
    job_id = f"publicar_lote_{ciclo_id}"
    
    # Remueve el trabajo si ya existía uno previo para este lote
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        
    scheduler.add_job(
        ejecutar_publicacion_lote,
        'date',
        run_date=fecha_programada,
        args=[ciclo_id],
        id=job_id,
        replace_existing=True,
    )
    print(f"Lote {ciclo_id} programado para publicarse en {fecha_programada}")
