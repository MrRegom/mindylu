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
        """Procesa el payload recibido de Facebook Messenger."""
        try:
            entries = payload.get('entry', [])
            for entry in entries:
                messaging_events = entry.get('messaging', [])
                for event in messaging_events:
                    if 'message' in event:
                        self._procesar_mensaje(event)
        except Exception as e:
            logger.error(f"Error procesando webhook payload de FB: {e}")

    def _procesar_mensaje(self, event):
        sender_id = event.get('sender', {}).get('id')
        message_data = event.get('message', {})
        mid = message_data.get('mid')
        text = message_data.get('text', '')

        if not sender_id or not mid or not text:
            return

        # Check for duplicates
        if Mensaje.objects.filter(external_id=mid).exists():
            return

        # Get sender profile name from Facebook Graph API (Optional but good for UI)
        client_name = 'Desconocido'
        try:
            profile_url = f"https://graph.facebook.com/{sender_id}?fields=first_name,last_name&access_token={self.access_token}"
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
            if conversacion.client_name == 'Desconocido' and client_name != 'Desconocido':
                conversacion.client_name = client_name
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
