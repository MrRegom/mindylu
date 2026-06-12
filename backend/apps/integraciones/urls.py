# apps/integraciones/urls.py
from django.urls import path
from .views import (
    sincronizar_facebook, listar_publicaciones_facebook, 
    publicar_en_facebook, publicar_lote_en_facebook,
    obtener_config_whatsapp, conectar_whatsapp, desconectar_whatsapp, whatsapp_webhook
)

urlpatterns = [
    path('sincronizar-facebook/', sincronizar_facebook, name='sincronizar-facebook'),
    path('publicaciones-recientes/', listar_publicaciones_facebook, name='publicaciones-recientes'),
    path('publicar-en-facebook/', publicar_en_facebook, name='publicar-en-facebook'),
    path('publicar-lote-facebook/', publicar_lote_en_facebook, name='publicar-lote-facebook'),
    
    path('whatsapp/config/', obtener_config_whatsapp, name='obtener_config_whatsapp'),
    path('whatsapp/conectar/', conectar_whatsapp, name='conectar_whatsapp'),
    path('whatsapp/desconectar/', desconectar_whatsapp, name='desconectar_whatsapp'),
    path('whatsapp/webhook/', whatsapp_webhook, name='whatsapp_webhook'),
]
