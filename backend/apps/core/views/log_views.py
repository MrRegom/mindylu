from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from apps.core.models import ErrorLog
from apps.core.serializers import ErrorLogSerializer
from rest_framework.permissions import IsAuthenticated

class ErrorLogViewSet(viewsets.ModelViewSet):
    """
    Vista para ver y registrar logs de error del frontend y backend.
    """
    serializer_class = ErrorLogSerializer
    permission_classes = []

    def get_queryset(self):
        return ErrorLog.objects.all().order_by('-fecha')

    def destroy(self, request, *args, **kwargs):
        # Permite borrar todo si se llama a un endpoint especial, o por ID
        if kwargs.get('pk') == 'clear_all':
            ErrorLog.objects.all().delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().destroy(request, *args, **kwargs)
