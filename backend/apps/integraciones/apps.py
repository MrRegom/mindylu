from django.apps import AppConfig

class IntegracionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.integraciones'

    def ready(self):
        from . import scheduler
        scheduler.start_scheduler()

