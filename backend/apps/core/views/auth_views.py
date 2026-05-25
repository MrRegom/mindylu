# ─────────────────────────────────────────────────────────────
# apps/core/views/auth_views.py
# Views de autenticación. Solo orquestan — sin lógica de negocio.
# La lógica de creación vive en los serializers.
# ─────────────────────────────────────────────────────────────

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.serializers import (
    RegistroTenantSerializer,
    LoginSerializer,
    UsuarioSerializer,
)


def _get_tokens_for_user(user):
    """Genera el par de tokens JWT para un usuario dado."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_view(request):
    """
    POST /api/v1/auth/registro/
    Registra una nueva vendedora (crea Tenant + Usuario owner).
    """
    serializer = RegistroTenantSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        tokens = _get_tokens_for_user(usuario)
        return Response({
            'usuario': UsuarioSerializer(usuario).data,
            'tokens': tokens,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/v1/auth/login/
    Autentica a una usuaria y devuelve sus tokens JWT.
    """
    serializer = LoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        usuario = serializer.validated_data['user']
        tokens = _get_tokens_for_user(usuario)
        return Response({
            'usuario': UsuarioSerializer(usuario).data,
            'tokens': tokens,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfil_view(request):
    """
    GET /api/v1/auth/perfil/
    Devuelve el perfil del usuario autenticado.
    """
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)
