# apps/integraciones/urls.py
from django.urls import path
from .views import (
    sincronizar_facebook, listar_publicaciones_facebook,
    publicar_en_facebook, publicar_lote_en_facebook,
    obtener_config_whatsapp, conectar_whatsapp, desconectar_whatsapp, whatsapp_webhook,
    listar_conversaciones, listar_mensajes, enviar_mensaje, sugerencias_productos,
    guardar_suscripcion_push, obtener_vapid_public_key, obtener_unread_count,
    eliminar_conversacion
)

urlpatterns = [
    path('sincronizar-facebook/', sincronizar_facebook, name='sincronizar-facebook'),
    path('publicaciones-recientes/', listar_publicaciones_facebook, name='publicaciones-recientes'),
    path('publicar-en-facebook/', publicar_en_facebook, name='publicar-en-facebook'),
    path('publicar-lote-facebook/', publicar_lote_en_facebook, name='publicar-lote-facebook'),
    
    # WhatsApp endpoints antiguos
    path('whatsapp/config/', obtener_config_whatsapp, name='whatsapp_config'),
    path('whatsapp/conectar/', conectar_whatsapp, name='whatsapp_conectar'),
    path('whatsapp/desconectar/', desconectar_whatsapp, name='whatsapp_desconectar'),
    
    # Webhook de Meta
    path('whatsapp/webhook/', whatsapp_webhook, name='whatsapp_webhook'),
    
    # Nuevos endpoints de Bandeja de Entrada
    path('whatsapp/conversaciones/', listar_conversaciones, name='whatsapp_conversaciones'),
    path('whatsapp/unread-count/', obtener_unread_count, name='whatsapp_unread_count'),
    path('whatsapp/conversaciones/<int:conversacion_id>/mensajes/', listar_mensajes, name='whatsapp_mensajes'),
    path('whatsapp/conversaciones/<int:conversacion_id>/enviar/', enviar_mensaje, name='whatsapp_enviar_mensaje'),
    path('whatsapp/conversaciones/<int:conversacion_id>/', eliminar_conversacion, name='whatsapp_eliminar_conversacion'),
    path('whatsapp/conversaciones/<int:conversacion_id>/sugerencias/', sugerencias_productos, name='whatsapp_sugerencias'),
    
    # Web Push
    path('webpush/vapid-public-key/', obtener_vapid_public_key, name='webpush_vapid_key'),
    path('webpush/subscribe/', guardar_suscripcion_push, name='webpush_subscribe'),
]

from rest_framework.routers import DefaultRouter
from .views import ReglaRespuestaBotViewSet, RespuestaRapidaViewSet

router = DefaultRouter()
router.register(r'whatsapp/reglas', ReglaRespuestaBotViewSet, basename='whatsapp-reglas')
router.register(r'whatsapp/respuestas-rapidas', RespuestaRapidaViewSet, basename='whatsapp-respuestas-rapidas')

urlpatterns += router.urls

