from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from apps.core.models import ErrorLog
from apps.core.serializers import ErrorLogSerializer
from rest_framework.permissions import IsAuthenticated

class ErrorLogViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """
    ViewSet para ErrorLog.
    - list: obtiene historial
    - create: permite al frontend subir sus errores
    - destroy (opcional): para limpiar los logs si es necesario
    """
    queryset = ErrorLog.objects.all()
    serializer_class = ErrorLogSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        # Permite borrar todo si se llama a un endpoint especial, o por ID
        if kwargs.get('pk') == 'clear_all':
            ErrorLog.objects.all().delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().destroy(request, *args, **kwargs)
