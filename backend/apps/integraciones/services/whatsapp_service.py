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

        # Check for duplicates
        if Mensaje.objects.filter(external_id=wam_id).exists():
            return

        # Get or create Conversacion
        conversacion, created = Conversacion.objects.get_or_create(
            tenant=self.tenant,
            client_phone=client_phone,
            defaults={'client_name': client_name, 'unread_count': 1}
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

        mensaje_obj = Mensaje.objects.create(
            conversacion=conversacion,
            external_id=wam_id,
            direction='INBOUND',
            content=content,
            status='delivered'
        )

        # Broadcast via WebSocket
        self._broadcast_websocket(conversacion, mensaje_obj)

        # Enviar Notificación Web Push Nivel OS
        self._enviar_notificacion_push(conversacion, client_name, content)

        # Bot de Auto-Respuesta de Stock
        if "quiero comprar el siguiente producto:" in content.lower():
            self._responder_consulta_stock(conversacion, content)
            return

        content_lower = content.lower()
        
        # 1. Bot de Respuesta de Rutas (Mayor prioridad de sistema)
        palabras_clave_rutas = ['ruta', 'entrega', 'despacho', 'cuándo llega', 'cuando llega', 'donde entregas', 'hacen entregas']
        if any(keyword in content_lower for keyword in palabras_clave_rutas):
            self._responder_consulta_entrega(conversacion, clienta, content)
            return

        # 1.5 Bot de Tallas
        palabras_clave_tallas = ['talla', 'tallas', 'talleas', 'medida', 'medidas', 'tamaño']
        if any(keyword in content_lower for keyword in palabras_clave_tallas):
            self.enviar_mensaje_texto(conversacion.id, "¡Hola! Para ver nuestras tallas y stock disponible en tiempo real, puedes entrar a nuestro catálogo haciendo clic aquí 👇\n\n🛍️ Catálogo: https://157-230-93-24.nip.io/catalogo\n\nAllí encontrarás las medidas exactas de cada prenda. Si tienes dudas con alguna en específico, dime el nombre y te ayudo con gusto. ✨")
            return

        # 2. Bot de Reglas Personalizadas
        from apps.integraciones.models import ReglaRespuestaBot
        reglas_activas = ReglaRespuestaBot.objects.filter(tenant=self.tenant, activa=True)
        regla_aplicada = False

        for regla in reglas_activas:
            # Dividir las palabras clave separadas por coma
            palabras = [p.strip().lower() for p in regla.palabras_clave.split(',') if p.strip()]
            if any(palabra in content_lower for palabra in palabras):
                self.enviar_mensaje_texto(conversacion.id, regla.respuesta)
                regla_aplicada = True
                break # Solo aplicar la primera regla que coincida
        
        if regla_aplicada:
            return

        # Bot de Respuesta de Cuentas (Banco)
        palabras_clave_cuenta = ['cuenta', 'deposito', 'depositar', 'transferir', 'transferencia', 'datos para transferir', 'datos transferencia', 'a que cuenta']
        # Filtramos para no chocar con "cuándo"
        content_lower = content.lower()
        if any(keyword in content_lower for keyword in palabras_clave_cuenta) and "cuando" not in content_lower and "cuándo" not in content_lower:
            self._responder_consulta_cuenta(conversacion, clienta)

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
            
            respuesta = f"¡Hola Linda! Sí, tengo tu entrega agendada para {fecha_str} a las {hora} en {lugar}. ¡Nos vemos ahí!"
        else:
            # Mostrar las rutas a partir de mañana, ya que las de hoy ya están cerradas/despachadas
            proximas_rutas = EntregaDiaria.objects.filter(tenant=self.tenant, fecha__gt=hoy).select_related('punto_entrega').order_by('fecha', 'hora_estimada')
            
            texto_rutas = ""
            if proximas_rutas.exists():
                texto_rutas = "Nuestras próximas rutas programadas son:\n"
                rutas_por_fecha = {}
                for ruta in proximas_rutas:
                    if ruta.fecha not in rutas_por_fecha:
                        rutas_por_fecha[ruta.fecha] = []
                    rutas_por_fecha[ruta.fecha].append(ruta)
                    
                for fecha, rutas in rutas_por_fecha.items():
                    dias_semana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
                    fecha_str = f"{dias_semana[fecha.weekday()]} {fecha.day}"
                    texto_rutas += f"\n📅 *{fecha_str}*:\n"
                    for ruta in rutas:
                        hora_str = ruta.hora_estimada.strftime('%H:%M') if ruta.hora_estimada else 'a convenir'
                        texto_rutas += f"📍 {ruta.punto_entrega.nombre} ({hora_str})\n"

            from apps.core.models import ConfiguracionTienda
            config_tienda = ConfiguracionTienda.objects.filter(tenant=self.tenant).first()
            texto_envio_general = config_tienda.envios_texto if config_tienda and config_tienda.envios_texto else ""

            if texto_rutas:
                texto_envio = f"Sí, hacemos entregas 🚚. {texto_rutas}\n"
                if texto_envio_general:
                    texto_envio += f"\n*También tenemos otras opciones de envío:*\n{texto_envio_general}\n"
                texto_envio += "\n¿De qué sector eres para ver si te podemos sumar a alguna ruta o coordinar tu envío? 💕"
            else:
                texto_envio = "Por ahora no tenemos entregas programadas, ¡pero te avisaremos en cuanto se abra la agenda para que te anotes! 💕 Mientras tanto, también realizamos envíos a convenir."
            
            respuesta = f"¡Hola Linda! {texto_envio}"

        self.enviar_mensaje_texto(conversacion.id, respuesta)

    def _responder_consulta_cuenta(self, conversacion, clienta):
        cuenta = clienta.cuenta_asignada
        if not cuenta:
            from apps.cuentas.models import CuentaBancaria
            cuenta = CuentaBancaria.objects.filter(tenant=self.tenant, activa=True).first()
            
        if cuenta:
            respuesta = "¡Hola Linda! Claro, aquí tienes los datos para la transferencia:\n\n"
            respuesta += f"🏦 *Banco:* {cuenta.banco}\n"
            respuesta += f"📋 *Tipo:* {cuenta.tipo_cuenta}\n"
            respuesta += f"🔢 *Número:* {cuenta.numero_cuenta}\n"
            respuesta += f"👤 *Titular:* {cuenta.nombre_titular}\n"
            respuesta += f"🪪 *RUT:* {cuenta.rut_titular}\n"
            if cuenta.email_notificacion:
                respuesta += f"📧 *Correo:* {cuenta.email_notificacion}\n"
            respuesta += "\nRecuerda enviarme el comprobante por aquí mismo 💕"
        else:
            respuesta = "¡Hola Linda! Dame un segundito y te paso los datos de la cuenta por favor 💕"
            
        self.enviar_mensaje_texto(conversacion.id, respuesta)

    def enviar_mensaje_directo(self, telefono, text_body):
        """Envia un mensaje directamente a un número y lo asocia a una conversacion."""
        conversacion, _ = Conversacion.objects.get_or_create(
            tenant=self.tenant,
            client_phone=telefono,
            defaults={'client_name': 'Desconocido'}
        )
        return self.enviar_mensaje_texto(conversacion.id, text_body)

    def enviar_mensaje_texto(self, conversacion_id, text_body, reply_to_wam_id=None, image_url=None):
        """Envia un mensaje de texto o imagen a traves de Meta API y lo guarda en BD."""
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
        
        if image_url:
            payload = {
                "messaging_product": "whatsapp",
                "to": conversacion.client_phone,
                "type": "image",
                "image": {
                    "link": image_url,
                    "caption": text_body or ""
                }
            }
        else:
            payload = {
                "messaging_product": "whatsapp",
                "to": conversacion.client_phone,
                "type": "text",
                "text": {
                    "body": text_body or ""
                }
            }
        
        if reply_to_wam_id:
            payload["context"] = {
                "message_id": reply_to_wam_id
            }

        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code in [200, 201]:
            data = response.json()
            # Extract new message ID
            messages_info = data.get('messages', [])
            external_id = messages_info[0].get('id') if messages_info else f"outbound_{conversacion.id}_{response.status_code}"

            # Save to DB
            db_content = text_body
            if image_url:
                db_content = f"{text_body}\n[IMG:{image_url}]"
                
            mensaje = Mensaje.objects.create(
                conversacion=conversacion,
                external_id=external_id,
                direction='OUTBOUND',
                content=db_content,
                status='sent'
            )
            
            # Reset unread if we replied
            conversacion.unread_count = 0
            conversacion.save()
            
            # Broadcast via WebSocket
            self._broadcast_websocket(conversacion, mensaje)
            
            return mensaje
        else:
            logger.error(f"Error enviando mensaje: {response.status_code} - {response.text}")
            return None

    def _broadcast_websocket(self, conversacion, mensaje):
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
            
        data = {
            'conversacion_id': conversacion.id,
            'client_phone': conversacion.client_phone,
            'client_name': conversacion.client_name,
            'unread_count': conversacion.unread_count,
            'mensaje': {
                'id': mensaje.id,
                'content': mensaje.content,
                'direction': mensaje.direction,
                'created_at': mensaje.created_at.isoformat(),
            }
        }
        
        async_to_sync(channel_layer.group_send)(
            'whatsapp_chats',
            {
                'type': 'chat_message',
                'data': data
            }
        )

    def _enviar_notificacion_push(self, conversacion, client_name, content):
        """
        Envía una notificación Web Push a todos los usuarios del tenant
        para alertarlos de un nuevo mensaje.
        """
        from apps.core.models import PushSubscription
        import json
        from pywebpush import webpush, WebPushException
        from decouple import config
        import os

        vapid_private = config('VAPID_PRIVATE_KEY', default='')
        vapid_public = config('VAPID_PUBLIC_KEY', default='')
        admin_email = config('VAPID_ADMIN_EMAIL', default='mailto:admin@mindylu.com')

        if not vapid_private or not vapid_public:
            return

        # Ensure path is absolute if it's a file
        from django.conf import settings
        if vapid_private == './private_key.pem':
            vapid_private = os.path.join(settings.BASE_DIR, 'private_key.pem')

        # Buscar todas las suscripciones de los usuarios de este tenant
        suscripciones = PushSubscription.objects.filter(usuario__tenant=self.tenant)
        
        # Calcular chats no leídos globales
        from apps.integraciones.models import ConversacionWhatsapp
        from django.db.models import F
        unread_chats_count = ConversacionWhatsapp.objects.filter(
            tenant=self.tenant, 
            status='OPEN',
            unread_count__gt=0
        ).count()

        payload = {
            "title": f"Mensaje de {client_name}",
            "body": content[:100] + "..." if len(content) > 100 else content,
            "data": {
                "url": f"/panel/whatsapp?chat={conversacion.id}",
                "unreadCount": unread_chats_count
            }
        }

        for sub in suscripciones:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth
                        }
                    },
                    data=json.dumps(payload),
                    vapid_private_key=vapid_private,
                    vapid_claims={
                        "sub": admin_email
                    }
                )
            except WebPushException as ex:
                logger.error(f"Error enviando Web Push: {repr(ex)}")
                if ex.response and ex.response.status_code in [404, 410]:
                    sub.delete()
            except Exception as e:
                logger.error(f"Error inesperado en Web Push: {e}")
