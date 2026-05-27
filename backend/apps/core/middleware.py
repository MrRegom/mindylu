import traceback
from django.utils.deprecation import MiddlewareMixin
from .models import ErrorLog

class ErrorLoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        # Evitar capturar errores comunes como 404
        from django.http import Http404
        from rest_framework.exceptions import APIException

        if not isinstance(exception, Http404):
            # Capturamos el stack trace
            tb = traceback.format_exc()
            mensaje = str(exception)
            
            # Guardamos el error en la base de datos de manera silenciosa
            try:
                ErrorLog.objects.create(
                    tipo='BACKEND',
                    mensaje=f"[{request.method}] {request.path} - {mensaje}",
                    stack_trace=tb
                )
            except Exception:
                pass # Si el propio log falla, no hacemos nada para evitar un ciclo

        return None
