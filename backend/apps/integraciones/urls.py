# apps/integraciones/urls.py
from django.urls import path
from .views import sincronizar_facebook, listar_publicaciones_facebook, publicar_en_facebook, publicar_lote_en_facebook

urlpatterns = [
    path('sincronizar-facebook/', sincronizar_facebook, name='sincronizar-facebook'),
    path('publicaciones-recientes/', listar_publicaciones_facebook, name='publicaciones-recientes'),
    path('publicar-en-facebook/', publicar_en_facebook, name='publicar-en-facebook'),
    path('publicar-lote-facebook/', publicar_lote_en_facebook, name='publicar-lote-facebook'),
]
