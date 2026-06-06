from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.core.models import ConfiguracionTienda, Tenant
from apps.core.serializers import ConfiguracionTiendaSerializer

class ConfiguracionTiendaPrivadaView(views.APIView):
    """
    Vista privada para que la vendedora gestione su configuración.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_config(self, tenant):
        config, created = ConfiguracionTienda.objects.get_or_create(tenant=tenant)
        return config

    def get(self, request):
        config = self.get_config(request.user.tenant)
        serializer = ConfiguracionTiendaSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        config = self.get_config(request.user.tenant)
        serializer = ConfiguracionTiendaSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfiguracionTiendaPublicaView(views.APIView):
    """
    Vista pública para que el catálogo cargue la configuración.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Asumimos multi-tenant basado en subdominio o un identificador en query_params.
        # Por ahora el frontend público asume el tenant_id = 1 por defecto si no manda 'tenant'.
        # En una versión escalable, mandaría "slug" de la tienda.
        # Lo simplificaremos al tenant 1.
        tenant = Tenant.objects.first()
        if not tenant:
            return Response({'error': 'Tienda no encontrada'}, status=status.HTTP_404_NOT_FOUND)
            
        config, created = ConfiguracionTienda.objects.get_or_create(tenant=tenant)
        serializer = ConfiguracionTiendaSerializer(config)
        
        # También vamos a devolver el nombre de la tienda y su plan por si acaso en otras variables.
        data = serializer.data
        data['tenant_nombre'] = tenant.nombre
        
        from apps.core.models import Usuario
        user = Usuario.objects.filter(tenant=tenant).first()
        if user and user.avatar:
            data['tienda_avatar'] = user.avatar.url
            
        return Response(data)
