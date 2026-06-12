import logging
import requests
from django.conf import settings
from apps.integraciones.models import Conversacion, Mensaje, WhatsappConfig
from apps.core.models import Tenant

logger = logging.getLogger(__name__)

class WhatsappService:
    def __init__(self, tenant=None):
        if tenant:
            self.tenant = tenant
        else:
            # Fallback for webhook without tenant context, assume first tenant
            self.tenant = Tenant.objects.first()
            
        try:
            self.config = WhatsappConfig.objects.get(tenant=self.tenant, is_active=True)
        except WhatsappConfig.DoesNotExist:
            self.config = None
            logger.warning(f"No active WhatsappConfig found for tenant {self.tenant}")

    def procesar_webhook_payload(self, payload):
        """Procesa el payload recibido de Meta."""
        try:
            entries = payload.get('entry', [])
            for entry in entries:
                changes = entry.get('changes', [])
                for change in changes:
                    value = change.get('value', {})
                    messages = value.get('messages', [])
                    contacts = value.get('contacts', [])
                    
                    if messages and contacts:
                        self._procesar_mensaje(messages[0], contacts[0])
                        
        except Exception as e:
            logger.error(f"Error procesando webhook payload: {e}")

    def _procesar_mensaje(self, message_data, contact_data):
        client_phone = contact_data.get('wa_id')
        client_name = contact_data.get('profile', {}).get('name', 'Desconocido')
        wam_id = message_data.get('id')
        
        # Determine content
        msg_type = message_data.get('type')
        content = ""
        if msg_type == 'text':
            content = message_data.get('text', {}).get('body', '')
        else:
            content = f"[Mensaje tipo: {msg_type}]"

        if not client_phone or not wam_id:
            return

        # Check if message already exists
        if Mensaje.objects.filter(wam_id=wam_id).exists():
            return

        # Get or create Conversacion
        conversacion, created = Conversacion.objects.get_or_create(
            tenant=self.tenant,
            client_phone=client_phone,
            defaults={'client_name': client_name}
        )
        
        # Crear Clienta automáticamente
        from apps.clientas.models import Clienta
        clienta, clienta_created = Clienta.objects.get_or_create(
            tenant=self.tenant,
            telefono=client_phone,
            defaults={'nombre': client_name}
        )
        if not clienta_created and clienta.nombre == 'Desconocido' and client_name != 'Desconocido':
            clienta.nombre = client_name
            clienta.save()
        
        # Update conversation status
        if not created:
            if conversacion.client_name == 'Desconocido' and client_name != 'Desconocido':
                conversacion.client_name = client_name
            conversacion.unread_count += 1
            conversacion.status = 'OPEN'
            conversacion.save()

        # Create Mensaje
        Mensaje.objects.create(
            conversacion=conversacion,
            wam_id=wam_id,
            direction='INBOUND',
            content=content,
            status='delivered'
        )

        # Bot de Auto-Respuesta de Stock
        if "quiero comprar el siguiente producto:" in content.lower():
            self._responder_consulta_stock(conversacion, content)
            return

        # Bot de Respuesta de Rutas
        palabras_clave = ['ruta', 'entrega', 'despacho', 'cuándo llega', 'cuando llega', 'donde entregas']
        if any(keyword in content.lower() for keyword in palabras_clave):
            self._responder_consulta_entrega(conversacion, clienta, content)

    def _responder_consulta_stock(self, conversacion, content):
        """
        Analiza el mensaje automático de compra y responde si hay stock o no.
        """
        import re
        from apps.catalogo.models import Prenda, PrendaVariante
        
        nombre_match = re.search(r'\*(.*?)\*', content)
        if not nombre_match:
            return
            
        nombre = nombre_match.group(1).strip()
        
        color = None
        talla = None
        variantes_match = re.search(r'\(Color:\s*(.*?),\s*Talla:\s*(.*?)\)', content)
        if variantes_match:
            color = variantes_match.group(1).strip()
            talla = variantes_match.group(2).strip()

        prenda = Prenda.objects.filter(nombre__iexact=nombre, tenant=self.tenant).first()
        if not prenda:
            return

        variantes = PrendaVariante.objects.filter(prenda=prenda)
        
        if color and color.lower() not in ['único', 'unico']:
            variantes = variantes.filter(color__iexact=color)
            
        if talla and talla.lower() not in ['única', 'unica']:
            variantes = variantes.filter(talla__iexact=talla)

        tiene_stock = variantes.filter(cantidad__gt=0).exists()

        if tiene_stock:
            respuesta = "¡Hola! Sí, lo tenemos disponible 😊. ¿Te gustaría coordinar la entrega o tienes alguna otra duda?"
        else:
            respuesta = "¡Hola! Pucha, de ese modelo/color justo se nos agotó el stock 😢. ¿Te gustaría que te muestre otras opciones?"

        self.enviar_mensaje_texto(conversacion.id, respuesta)

    def _responder_consulta_entrega(self, conversacion, clienta, content):
        from apps.pedidos.models import EntregaDiaria
        from django.utils import timezone
        import datetime
        
        hoy = timezone.now().date()
        
        # Buscar entregas agendadas futuras o de hoy
        entregas = EntregaDiaria.objects.filter(
            tenant=self.tenant,
            fecha__gte=hoy,
            pedidos__clienta=clienta,
            pedidos__estado__in=['apartado', 'por_pagar', 'pagado']
        ).distinct().order_by('fecha')
        
        if entregas.exists():
            entrega = entregas.first()
            hora = entrega.hora_estimada.strftime('%H:%M') if entrega.hora_estimada else 'por confirmar'
            fecha_str = entrega.fecha.strftime('%d/%m/%Y')
            if entrega.fecha == hoy:
                fecha_str = 'hoy'
            elif entrega.fecha == hoy + datetime.timedelta(days=1):
                fecha_str = 'mañana'
                
            lugar = entrega.punto_entrega.nombre if entrega.punto_entrega else 'Lugar por definir'
            
            respuesta = f"¡Hola hermosa! Sí, tengo tu entrega agendada para {fecha_str} a las {hora} en {lugar}. ¡Nos vemos ahí!"
            self.enviar_mensaje_texto(conversacion.id, respuesta)

    def enviar_mensaje_directo(self, telefono, text_body):
        """Envia un mensaje directamente a un número y lo asocia a una conversacion."""
        conversacion, _ = Conversacion.objects.get_or_create(
            tenant=self.tenant,
            client_phone=telefono,
            defaults={'client_name': 'Desconocido'}
        )
        return self.enviar_mensaje_texto(conversacion.id, text_body)

    def enviar_mensaje_texto(self, conversacion_id, text_body):
        """Envia un mensaje de texto a traves de Meta API y lo guarda en BD."""
        if not self.config or not self.config.access_token or not self.config.phone_number_id:
            logger.error("Faltan credenciales de Meta API en WhatsappConfig.")
            return None

        try:
            conversacion = Conversacion.objects.get(id=conversacion_id, tenant=self.tenant)
        except Conversacion.DoesNotExist:
            logger.error(f"Conversacion {conversacion_id} no encontrada.")
            return None

        url = f"https://graph.facebook.com/v25.0/{self.config.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.config.access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": conversacion.client_phone,
            "type": "text",
            "text": {
                "body": text_body
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code in [200, 201]:
            data = response.json()
            # Extract new message ID
            messages_info = data.get('messages', [])
            wam_id = messages_info[0].get('id') if messages_info else f"outbound_{conversacion.id}_{response.status_code}"

            # Save to DB
            mensaje = Mensaje.objects.create(
                conversacion=conversacion,
                wam_id=wam_id,
                direction='OUTBOUND',
                content=text_body,
                status='sent'
            )
            
            # Reset unread if we replied
            conversacion.unread_count = 0
            conversacion.save()
            
            return mensaje
        else:
            logger.error(f"Error enviando mensaje: {response.status_code} - {response.text}")
            return None
