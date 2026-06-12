# apps/integraciones/urls.py
from django.urls import path
from .views import (
    sincronizar_facebook, listar_publicaciones_facebook,
    publicar_en_facebook, publicar_lote_en_facebook,
    obtener_config_whatsapp, conectar_whatsapp, desconectar_whatsapp, whatsapp_webhook,
    listar_conversaciones, listar_mensajes, enviar_mensaje
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
    path('whatsapp/conversaciones/<int:conversacion_id>/mensajes/', listar_mensajes, name='whatsapp_mensajes'),
    path('whatsapp/conversaciones/<int:conversacion_id>/enviar/', enviar_mensaje, name='whatsapp_enviar_mensaje'),
]
