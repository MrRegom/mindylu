import logging
import requests
from django.conf import settings
from apps.integraciones.models import Conversacion, Mensaje
from apps.core.models import Tenant
from decouple import config

logger = logging.getLogger(__name__)

class FacebookChatService:
    def __init__(self, tenant=None):
        if tenant:
            self.tenant = tenant
        else:
            self.tenant = Tenant.objects.first()
            
        self.access_token = config('FACEBOOK_ACCESS_TOKEN', default='')
        self.page_id = config('FACEBOOK_PAGE_ID', default='')

    def procesar_webhook_payload(self, payload):
        """Procesa el payload recibido de Facebook Messenger o Feed."""
        try:
            entries = payload.get('entry', [])
            for entry in entries:
                # 1. Procesar mensajes directos (Messenger)
                messaging_events = entry.get('messaging', [])
                for event in messaging_events:
                    if 'message' in event:
                        self._procesar_mensaje(event)
                
                # 2. Procesar eventos del feed (Comentarios)
                changes = entry.get('changes', [])
                for change in changes:
                    if change.get('field') == 'feed':
                        value = change.get('value', {})
                        # Solo procesamos comentarios nuevos ('add')
                        if value.get('item') == 'comment' and value.get('verb') == 'add':
                            sender_id = value.get('sender_id')
                            # Se quitó la restricción temporalmente para que la dueña pueda probar
                            self._procesar_comentario(value)

        except Exception as e:
            logger.error(f"Error procesando webhook payload de FB: {e}")

    def _procesar_mensaje(self, event):
        sender_id = event.get('sender', {}).get('id')
        message_data = event.get('message', {})
        mid = message_data.get('mid')
        text = message_data.get('text', '')
        attachments = message_data.get('attachments', [])

        if not sender_id or not mid:
            return
            
        if not text and not attachments:
            return
            
        if not text and attachments:
            attach_type = attachments[0].get('type', 'desconocido')
            if attach_type == 'image':
                url = attachments[0].get('payload', {}).get('url', '')
                text = f"📷 [Imagen adjunta]: {url}"
            else:
                text = f"📎 [Archivo adjunto tipo: {attach_type}]"

        # Check for duplicates
        if Mensaje.objects.filter(external_id=mid).exists():
            return

        # Get sender profile name from Facebook Graph API (Optional but good for UI)
        client_name = 'Cliente Facebook'
        try:
            profile_url = f"https://graph.facebook.com/v19.0/{sender_id}?fields=first_name,last_name&access_token={self.access_token}"
            res = requests.get(profile_url)
            if res.status_code == 200:
                profile_data = res.json()
                client_name = f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip()
        except Exception as e:
            logger.warning(f"No se pudo obtener el perfil de FB: {e}")

        # Get or create Conversacion
        conversacion, created = Conversacion.objects.get_or_create(
            tenant=self.tenant,
            client_phone=sender_id, # Usamos client_phone para guardar el PSID
            plataforma='facebook',
            defaults={'client_name': client_name, 'unread_count': 1}
        )
        
        # Update conversation status
        if not created:
            if conversacion.client_name in ['Desconocido', 'Cliente Facebook'] and client_name != 'Cliente Facebook':
                conversacion.client_name = client_name
            elif conversacion.client_name == 'Desconocido':
                conversacion.client_name = 'Cliente Facebook'
            conversacion.unread_count += 1
            conversacion.status = 'OPEN'
            conversacion.save()

        mensaje_obj = Mensaje.objects.create(
            conversacion=conversacion,
            external_id=mid,
            direction='INBOUND',
            content=text,
            status='delivered'
        )

        # Broadcast via WebSocket
        self._broadcast_websocket(conversacion, mensaje_obj)

    def _broadcast_websocket(self, conversacion, mensaje):
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{self.tenant.id}",
            {
                'type': 'chat_message',
                'message': {
                    'id': mensaje.id,
                    'external_id': mensaje.external_id,
                    'conversacion_id': conversacion.id,
                    'direction': mensaje.direction,
                    'content': mensaje.content,
                    'status': mensaje.status,
                    'plataforma': conversacion.plataforma,
                    'created_at': mensaje.created_at.isoformat(),
                    'client_phone': conversacion.client_phone,
                    'client_name': conversacion.client_name,
                    'unread_count': conversacion.unread_count,
                    'last_message_at': conversacion.last_message_at.isoformat() if conversacion.last_message_at else None
                }
            }
        )

    def enviar_mensaje_texto(self, conversacion_id, text_body):
        conversacion = Conversacion.objects.get(id=conversacion_id)
        psid = conversacion.client_phone

        url = f"https://graph.facebook.com/v19.0/{self.page_id}/messages"
        payload = {
            "recipient": {"id": psid},
            "message": {"text": text_body},
            "messaging_type": "RESPONSE"
        }
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        mid = data.get('message_id', f"outbound_fb_{conversacion.id}_{response.status_code}")

        mensaje = Mensaje.objects.create(
            conversacion=conversacion,
            external_id=mid,
            direction='OUTBOUND',
            content=text_body,
            status='sent'
        )

        self._broadcast_websocket(conversacion, mensaje)
        
        conversacion.status = 'OPEN'
        conversacion.save()

        return mensaje

    def _procesar_comentario(self, value_data):
        """Envía un mensaje privado a quien hizo el comentario y responde públicamente de forma inteligente."""
        comment_id = value_data.get('comment_id')
        message_text = value_data.get('message', '').lower()
        if not comment_id:
            return
            
        # Generar una respuesta inteligente según el contenido del mensaje
        if any(word in message_text for word in ['talla', 'medida', 'size', 'chica', 'grande']):
            texto_respuesta = "¡Hola linda! 💕 Puedes revisar en tiempo real todas las tallas y colores disponibles de esta prenda directo en nuestra App: https://mindylu.cl/ Te enviamos también un mensajito privado."
        elif any(word in message_text for word in ['precio', 'cuanto', 'valor', 'cuesta']):
            texto_respuesta = "¡Hola hermosa! ✨ El precio detallado y la opción para reservar esta prenda al instante los encuentras en nuestra App oficial: https://mindylu.cl/ Revisa tu bandeja de mensajes."
        elif any(word in message_text for word in ['envio', 'despacho', 'entrega']):
            texto_respuesta = "¡Hola linda! 🚚 Hacemos envíos a todo Chile. Puedes comprar seguro y coordinar tu envío directo desde nuestra App: https://mindylu.cl/ Te dejamos un DM."
        elif any(word in message_text for word in ['direccion', 'ubicacion', 'donde', 'tienda']):
            texto_respuesta = "¡Hola linda! 📍 Puedes ver todas nuestras opciones de entrega y comprar de manera súper fácil en nuestro catálogo: https://mindylu.cl/"
        else:
            texto_respuesta = "¡Hola linda! 💕 ¡Gracias por tu comentario! Te invitamos a ver todo nuestro catálogo en tiempo real (con stock, precios y envíos) aquí: https://mindylu.cl/ Revisa tu bandeja de mensajes."
        
        # 1. Responder el comentario públicamente
        url_reply = f"https://graph.facebook.com/v19.0/{comment_id}/comments"
        payload_reply = {
            "message": texto_respuesta
        }
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        try:
            r1 = requests.post(url_reply, json=payload_reply, headers=headers)
            if r1.status_code != 200:
                logger.error(f"Error respondiendo comentario (Público): {r1.text}")
        except Exception as e:
            logger.warning(f"No se pudo responder al comentario de forma pública: {e}")
            
        # 2. Enviar mensaje privado (Private Replies)
        texto_privado = "¡Hola linda! Gracias por comentar nuestra publicación en Facebook. ✨\n\nAquí tienes el enlace directo a nuestro catálogo oficial donde podrás ver todos los precios, tallas disponibles y hacer tu pedido súper fácil y rápido: https://mindylu.cl/\n\nCualquier duda, ¡estamos para ayudarte! 💕"
        url_private = f"https://graph.facebook.com/v19.0/{self.page_id}/messages"
        payload_private = {
            "recipient": {"comment_id": comment_id},
            "message": {"text": texto_privado},
            "messaging_type": "MESSAGE_TAG",
            "tag": "POST_PURCHASE_UPDATE"
        }
        try:
            r2 = requests.post(url_private, json=payload_private, headers=headers)
            if r2.status_code != 200:
                logger.error(f"Error enviando DM (Privado): {r2.text}")
        except Exception as e:
            logger.warning(f"No se pudo enviar mensaje privado al comentario: {e}")
