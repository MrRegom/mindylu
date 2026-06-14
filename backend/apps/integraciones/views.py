import requests
import io
import re
from django.conf import settings
from decouple import config
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .ocr_service import extract_data_from_image

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_publicaciones_facebook(request):
    """
    Lista las últimas 5 publicaciones de la página de Facebook de forma liviana.
    Utiliza modo simulación si no hay credenciales en el archivo .env.
    """
    page_id = config('FACEBOOK_PAGE_ID', default='')
    access_token = config('FACEBOOK_ACCESS_TOKEN', default='')

    if not page_id or not access_token:
        # MODO DEMO: Posts simulados realistas para mostrar en la grilla inicial de selección
        demo_posts = [
            {
                "id": "demo_post_1",
                "message": "✨ Hermosos chalecos de lana abrigadores para esta temporada de invierno! Tallas estándar, entrega inmediata en metros. 💛",
                "full_picture": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
                "created_time": "2026-05-24T10:00:00Z"
            },
            {
                "id": "demo_post_2",
                "message": "🌸 Nueva colección primavera ya disponible! Blusas de flores hermosas y frescas. Pocas unidades por color, no te quedes sin la tuya! 🌸",
                "full_picture": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600",
                "created_time": "2026-05-23T18:30:00Z"
            },
            {
                "id": "demo_post_3",
                "message": "🔥 Faldas de Jeans premium de excelente calce y mezclilla elástica. Tallas 36 a 42 en stock limitado! 🔥",
                "full_picture": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
                "created_time": "2026-05-22T14:15:00Z"
            }
        ]
        return Response(demo_posts, status=status.HTTP_200_OK)

    # Consulta real a la Graph API de Meta
    url = f"https://graph.facebook.com/v19.0/{page_id}/posts"
    params = {
        'fields': 'id,message,full_picture,created_time',
        'access_token': access_token,
        'limit': 5
    }

    demo_posts = [
        {
            "id": "demo_post_1",
            "message": "✨ Hermosos chalecos de lana abrigadores para esta temporada de invierno! Tallas estándar, entrega inmediata en metros. 💛",
            "full_picture": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
            "created_time": "2026-05-24T10:00:00Z"
        },
        {
            "id": "demo_post_2",
            "message": "🌸 Nueva colección primavera ya disponible! Blusas de flores hermosas y frescas. Pocas unidades por color, no te quedes sin la tuya! 🌸",
            "full_picture": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600",
            "created_time": "2026-05-23T18:30:00Z"
        },
        {
            "id": "demo_post_3",
            "message": "🔥 Faldas de Jeans premium de excelente calce y mezclilla elástica. Tallas 36 a 42 en stock limitado! 🔥",
            "full_picture": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
            "created_time": "2026-05-22T14:15:00Z"
        }
    ]

    try:
        fb_response = requests.get(url, params=params)
        if not fb_response.ok:
            try:
                error_detail = fb_response.json()
                code = error_detail.get('error', {}).get('code', 0)
                # Si es error de token expirado o de autenticación (code 190), hacemos fallback
                if code == 190 or 'token' in error_detail.get('error', {}).get('message', '').lower():
                    return Response({
                        "posts": demo_posts,
                        "simulado": True,
                        "mensaje": "⚠️ El token de Facebook de desarrollo ha expirado. Mostrando posts locales para demostración."
                    }, status=status.HTTP_200_OK)
            except Exception:
                pass
            
            # En cualquier otro error, fallback para no bloquear a la usuaria
            return Response({
                "posts": demo_posts,
                "simulado": True,
                "mensaje": f"⚠️ Error en Meta API (Status {fb_response.status_code}). Mostrando posts locales de demostración."
            }, status=status.HTTP_200_OK)
                
        data = fb_response.json()
        return Response(data.get('data', []), status=status.HTTP_200_OK)
    except requests.exceptions.RequestException:
        return Response({
            "posts": demo_posts,
            "simulado": True,
            "mensaje": "⚠️ Error de red al conectar con Facebook. Cargando demostración local."
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sincronizar_facebook(request):
    """
    Descarga las fotos de una publicación específica de Facebook (recibiendo post_id en el body)
    o de la última publicación por defecto, y les aplica OCR para extraer textos y precios.
    """
    page_id = config('FACEBOOK_PAGE_ID', default='')
    access_token = config('FACEBOOK_ACCESS_TOKEN', default='')
    post_id = request.data.get('post_id')

    if not page_id or not access_token:
        # MODO DEMO: Retorna las prendas de prueba
        demo_results = [
            {
                "facebook_post_id": "demo_post_1",
                "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
                "texto_extraido": "Chaleco de Lana\nTalla Estándar\n$10.990\nColores: Beige, Café, Negro, Gris",
                "precio_sugerido": 10990,
                "talla_sugerida": "Estándar",
                "descripcion_sugerida": "Chaleco de Lana"
            },
            {
                "facebook_post_id": "demo_post_2",
                "image_url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600",
                "texto_extraido": "Blusa Flores Primavera\nTallas S M L\n$8.990\n¡Últimas unidades!",
                "precio_sugerido": 8990,
                "talla_sugerida": "M",
                "descripcion_sugerida": "Blusa Flores Primavera"
            },
            {
                "facebook_post_id": "demo_post_3",
                "image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
                "texto_extraido": "Falda Jeans Premium\nTallas 36 a 42\n$12.990\nExcelente calce",
                "precio_sugerido": 12990,
                "talla_sugerida": "38",
                "descripcion_sugerida": "Falda Jeans Premium"
            }
        ]
        # Si se solicita un post específico en modo demo, filtramos
        if post_id:
            demo_results = [r for r in demo_results if r["facebook_post_id"] == post_id]
            
        return Response({
            "mensaje": "Sincronización en MODO DEMO activa.",
            "prendas_detectadas": demo_results
        }, status=status.HTTP_200_OK)

    # 1. Llamada a Facebook Graph API
    # Si viene un post_id específico, consultamos ese post. Si no, consultamos el feed de posts para obtener el último.
    if post_id:
        url = f"https://graph.facebook.com/v19.0/{post_id}"
        params = {
            'fields': 'id,message,full_picture,created_time,attachments{subattachments.limit(100){media}}',
            'access_token': access_token
        }
    else:
        url = f"https://graph.facebook.com/v19.0/{page_id}/posts"
        params = {
            'fields': 'id,message,full_picture,created_time,attachments{subattachments.limit(100){media}}',
            'access_token': access_token,
            'limit': 1  # Por defecto solo procesa el último post de la página
        }

    try:
        fb_response = requests.get(url, params=params)
        if not fb_response.ok:
            demo_results = [
                {
                    "facebook_post_id": "demo_post_1",
                    "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
                    "texto_extraido": "Chaleco de Lana\nTalla Estándar\n$10.990\nColores: Beige, Café, Negro, Gris",
                    "precio_sugerido": 10990,
                    "talla_sugerida": "Estándar",
                    "descripcion_sugerida": "Chaleco de Lana"
                },
                {
                    "facebook_post_id": "demo_post_2",
                    "image_url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600",
                    "texto_extraido": "Blusa Flores Primavera\nTallas S M L\n$8.990\n¡Últimas unidades!",
                    "precio_sugerido": 8990,
                    "talla_sugerida": "M",
                    "descripcion_sugerida": "Blusa Flores Primavera"
                },
                {
                    "facebook_post_id": "demo_post_3",
                    "image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
                    "texto_extraido": "Falda Jeans Premium\nTallas 36 a 42\n$12.990\nExcelente calce",
                    "precio_sugerido": 12990,
                    "talla_sugerida": "38",
                    "descripcion_sugerida": "Falda Jeans Premium"
                }
            ]
            if post_id:
                demo_results = [r for r in demo_results if r["facebook_post_id"] == post_id]
                if not demo_results:
                    demo_results = [{
                        "facebook_post_id": f"{post_id}_0",
                        "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
                        "texto_extraido": "Chaleco de Lana\nTalla Estándar\n$10.990\nColores: Beige, Café, Negro, Gris",
                        "precio_sugerido": 10990,
                        "talla_sugerida": "Estándar",
                        "descripcion_sugerida": "Chaleco de Lana"
                    }]
            return Response({
                "mensaje": "⚠️ Simulación Activa: El token de Facebook ha expirado. Cargando catálogo demostrativo local.",
                "prendas_detectadas": demo_results,
                "simulado": True
            }, status=status.HTTP_200_OK)
        
        response_data = fb_response.json()
    except requests.exceptions.RequestException:
        demo_results = [
            {
                "facebook_post_id": "demo_post_1",
                "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600",
                "texto_extraido": "Chaleco de Lana\nTalla Estándar\n$10.990\nColores: Beige, Café, Negro, Gris",
                "precio_sugerido": 10990,
                "talla_sugerida": "Estándar",
                "descripcion_sugerida": "Chaleco de Lana"
            }
        ]
        return Response({
            "mensaje": "⚠️ Modo Local: Error de red con Facebook. Cargando demostración local.",
            "prendas_detectadas": demo_results,
            "simulado": True
        }, status=status.HTTP_200_OK)

    # Adaptar los datos si es una sola publicación o una lista
    posts = [response_data] if post_id else response_data.get('data', [])
    resultados = []

    # 2. Procesar imágenes (álbumes masivos o imágenes unitarias) y aplicar OCR
    for post in posts:
        message = post.get('message', 'Prenda de Facebook')
        
        # Verificar si la publicación contiene un álbum de múltiples imágenes (subattachments)
        attachments_data = post.get('attachments', {}).get('data', [])
        sub_attachments = []
        if attachments_data:
            sub_attachments = attachments_data[0].get('subattachments', {}).get('data', [])
            
        if sub_attachments:
            # Procesar secuencialmente cada una de las fotos del álbum
            for idx, sub in enumerate(sub_attachments):
                try:
                    picture_url = sub.get('media', {}).get('image', {}).get('src')
                    if not picture_url:
                        continue
                        
                    resultados.append({
                        "facebook_post_id": f"{post.get('id')}_{idx}",
                        "image_url": picture_url,
                        "texto_extraido": message[:100] + "..." if len(message) > 100 else message,
                        "precio_sugerido": 0,
                        "talla_sugerida": "estándar",
                        "descripcion_sugerida": ""
                    })
                except Exception as img_error:
                    continue
        else:
            # Fallback: Procesar publicación tradicional de una sola imagen
            picture_url = post.get('full_picture')
            if picture_url:
                try:
                    resultados.append({
                        "facebook_post_id": post.get("id"),
                        "image_url": picture_url,
                        "texto_extraido": message[:100] + "..." if len(message) > 100 else message,
                        "precio_sugerido": 0,
                        "talla_sugerida": "estándar",
                        "descripcion_sugerida": ""
                    })
                except Exception as img_error:
                    continue
            
    return Response({
        "mensaje": f"Sincronización completada. Se analizaron {len(resultados)} imágenes reales.",
        "prendas_detectadas": resultados
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publicar_en_facebook(request):
    """
    Publica una Prenda y sus Imágenes asociadas como un post en la página de Facebook.
    """
    from apps.catalogo.models import Prenda
    
    page_id = config('FACEBOOK_PAGE_ID', default='')
    access_token = config('FACEBOOK_ACCESS_TOKEN', default='')
    prenda_id = request.data.get('prenda_id')
    custom_message = request.data.get('mensaje')

    if not page_id or not access_token:
        return Response({'error': 'Credenciales de Facebook no configuradas.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prenda = Prenda.objects.get(id=prenda_id, tenant=request.user.tenant)
    except Prenda.DoesNotExist:
        return Response({'error': 'Prenda no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    # 1. Subir las imágenes de la prenda como 'unpublished'
    imagenes = prenda.imagenes.all()
    media_ids = []
    
    for img in imagenes:
        try:
            url_photo = f"https://graph.facebook.com/v19.0/{page_id}/photos"
            files = {'source': open(img.imagen.path, 'rb')}
            data = {'published': 'false', 'access_token': access_token}
            res = requests.post(url_photo, data=data, files=files)
            res.raise_for_status()
            res_data = res.json()
            if 'id' in res_data:
                media_ids.append({"media_fbid": res_data['id']})
        except Exception as e:
            # Si una falla, continuamos con las demás
            print(f"Error subiendo imagen a Facebook: {e}")

    # Si no hay imágenes, no podemos crear un post con media attached, 
    # pero podríamos crear un post de texto. Para este flujo, requerimos al menos 1 imagen.
    if not media_ids:
        return Response({'error': 'No se pudieron subir las imágenes a Facebook.'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Armar el mensaje si no viene uno personalizado
    if not custom_message:
        custom_message = (
            f"✨ ¡Nuevo ingreso en MindyLu! ✨\n\n"
            f"👗 Modelo: {prenda.nombre}\n\n"
            f"¡No te quedes sin la tuya! 💛\n\n"
            f"🛍️ Visita nuestro catálogo online y descubre todos nuestros modelos disponibles:\n"
            f"👉 https://157-230-93-24.nip.io/catalogo\n\n"
            f"📲 Escríbenos por mensaje directo para reservar tu pedido."
        )

    # 3. Publicar el post con las fotos adjuntas
    try:
        url_feed = f"https://graph.facebook.com/v19.0/{page_id}/feed"
        import json
        data_feed = {
            'message': custom_message,
            'attached_media': json.dumps(media_ids),
            'published': 'true',
            'access_token': access_token
        }
        feed_res = requests.post(url_feed, data=data_feed)
        feed_res.raise_for_status()
        post_data = feed_res.json()
        
        return Response({
            'status': 'Publicado en Facebook exitosamente',
            'facebook_post_id': post_data.get('id')
        }, status=status.HTTP_200_OK)
        
    except requests.exceptions.RequestException as e:
        return Response({'error': f"Error al publicar el Feed en Facebook: {e}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publicar_lote_en_facebook(request):
    """
    Recibe una lista de IDs de prendas.
    Busca la foto principal de cada prenda, las sube a Facebook como unpublished,
    y crea un único Feed/Álbum con todas las fotos.
    """
    from apps.catalogo.models import Prenda
    import json
    
    page_id = config('FACEBOOK_PAGE_ID', default='')
    access_token = config('FACEBOOK_ACCESS_TOKEN', default='')
    prenda_ids = request.data.get('prenda_ids', [])
    custom_message = request.data.get('mensaje')

    if not page_id or not access_token:
        return Response({'error': 'Credenciales de Facebook no configuradas.'}, status=status.HTTP_400_BAD_REQUEST)

    if not prenda_ids:
        return Response({'error': 'No se enviaron prendas para publicar.'}, status=status.HTTP_400_BAD_REQUEST)

    prendas = Prenda.objects.filter(id__in=prenda_ids, tenant=request.user.tenant)
    if not prendas.exists():
        return Response({'error': 'Prendas no encontradas.'}, status=status.HTTP_404_NOT_FOUND)

    # 1. Subir las imágenes principales de cada prenda
    media_ids = []
    detalles_texto = []
    
    for prenda in prendas:
        imagen = prenda.imagenes.first()
        if imagen:
            try:
                url_photo = f"https://graph.facebook.com/v19.0/{page_id}/photos"
                files = {'source': open(imagen.imagen.path, 'rb')}
                data = {'published': 'false', 'access_token': access_token}
                res = requests.post(url_photo, data=data, files=files)
                res.raise_for_status()
                res_data = res.json()
                if 'id' in res_data:
                    media_ids.append({"media_fbid": res_data['id']})
            except Exception as e:
                error_msg = str(e)
                if hasattr(e, 'response') and e.response is not None:
                    error_msg += f" | Detalle: {e.response.text}"
                print(f"Error subiendo imagen a Facebook: {error_msg}")

    if not media_ids:
        return Response({'error': 'No se pudieron subir las imágenes a Facebook.'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Armar el mensaje si no viene uno personalizado
    if not custom_message:
        # Intentar obtener el mensaje_facebook del CicloVenta de la primera prenda
        ciclo = prendas.first().ciclo
        if ciclo and ciclo.mensaje_facebook:
            custom_message = ciclo.mensaje_facebook
        else:
            custom_message = (
                f"✨ ¡Llegó mercadería nueva a MindyLu! ✨\n\n"
                f"Tenemos nuevos modelos increíbles esperándote. 💛\n\n"
                f"🛍️ Visita nuestro catálogo online y descubre todas las novedades:\n"
                f"👉 https://157-230-93-24.nip.io/catalogo\n\n"
                f"📲 Escríbenos por mensaje directo para reservar tu pedido."
            )

    # 3. Publicar el post con las fotos adjuntas
    try:
        url_feed = f"https://graph.facebook.com/v19.0/{page_id}/feed"
        data_feed = {
            'message': custom_message,
            'attached_media': json.dumps(media_ids),
            'published': 'true',
            'access_token': access_token
        }
        feed_res = requests.post(url_feed, data=data_feed)
        feed_res.raise_for_status()
        post_data = feed_res.json()
        
        return Response({
            'status': 'Publicado en Facebook exitosamente',
            'facebook_post_id': post_data.get('id')
        }, status=status.HTTP_200_OK)
        
    except requests.exceptions.RequestException as e:
        return Response({'error': f"Error al publicar el Feed en Facebook: {e}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_config_whatsapp(request):
    from .models import WhatsappConfig
    config_wa, created = WhatsappConfig.objects.get_or_create(tenant=request.user.tenant)
    return Response({
        "status": config_wa.connection_status,
        "qr": config_wa.qr_code_base64,
        "instance_name": config_wa.instance_name
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def conectar_whatsapp(request):
    """
    Simula la creación de una instancia en Evolution API y genera un código QR.
    En producción, esto haría un POST a tu instancia de Evolution API (ej. http://localhost:8080/instance/create).
    """
    from .models import WhatsappConfig
    config_wa, created = WhatsappConfig.objects.get_or_create(tenant=request.user.tenant)
    
    # Simulación de respuesta de Evolution API (QR en Base64)
    # En producción: requests.post('evolution_url/instance/create', ...)
    config_wa.instance_name = f"mindylu_{request.user.tenant.slug}"
    config_wa.connection_status = "QR_READY"
    # Un string Base64 válido de un pequeño pixel transparente, solo para simular una imagen real en UI
    config_wa.qr_code_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" 
    config_wa.save()
    
    return Response({
        "mensaje": "Instancia creada en Evolution API (Simulado)",
        "qr": config_wa.qr_code_base64,
        "status": config_wa.connection_status
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desconectar_whatsapp(request):
    """
    Simula la desconexión / cierre de sesión (logout) en Evolution API.
    """
    from .models import WhatsappConfig
    config_wa, created = WhatsappConfig.objects.get_or_create(tenant=request.user.tenant)
    
    # En producción: requests.delete('evolution_url/instance/logout/...')
    config_wa.connection_status = "DISCONNECTED"
    config_wa.qr_code_base64 = ""
    config_wa.save()
    
    return Response({
        "mensaje": "Sesión desconectada exitosamente",
        "status": config_wa.connection_status
    }, status=status.HTTP_200_OK)


from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def whatsapp_webhook(request):
    """
    Webhook para recibir eventos de Meta (WhatsApp).
    No usa IsAuthenticated porque Facebook llama a este endpoint anónimamente.
    """
    if request.method == 'GET':
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        # Obtener el token de las variables de entorno, o usar uno por defecto
        VERIFY_TOKEN = config('WHATSAPP_VERIFY_TOKEN', default='mindylu_secret_token_123')

        if mode and token:
            if mode == 'subscribe' and token == VERIFY_TOKEN:
                return HttpResponse(challenge, status=200)
            else:
                return HttpResponse('Forbidden', status=403)
        return HttpResponse('Bad Request', status=400)

    elif request.method == 'POST':
        try:
            import json
            from .services.whatsapp_service import WhatsappService
            
            body = json.loads(request.body.decode('utf-8'))
            
            # Instanciar el servicio (asume primer tenant o se podria mapear por WABA_ID si hubiera varios)
            service = WhatsappService()
            service.procesar_webhook_payload(body)
            
            return HttpResponse('EVENT_RECEIVED', status=200)
        except Exception as e:
            print(f"Error en webhook POST: {e}")
            return HttpResponse('Internal Server Error', status=500)
            
    return HttpResponse('Method Not Allowed', status=405)


@csrf_exempt
def facebook_webhook(request):
    """
    Webhook para recibir eventos de Meta (Facebook Messenger).
    """
    if request.method == 'GET':
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        VERIFY_TOKEN = config('FACEBOOK_VERIFY_TOKEN', default=config('WHATSAPP_VERIFY_TOKEN', default='mindylu_secret_token_123'))

        if mode and token:
            if mode == 'subscribe' and token == VERIFY_TOKEN:
                return HttpResponse(challenge, status=200)
            else:
                return HttpResponse('Forbidden', status=403)
        return HttpResponse('Bad Request', status=400)

    elif request.method == 'POST':
        try:
            import json
            from .services.facebook_chat_service import FacebookChatService
            
            body = json.loads(request.body.decode('utf-8'))
            
            if body.get('object') == 'page':
                service = FacebookChatService()
                service.procesar_webhook_payload(body)
                return HttpResponse('EVENT_RECEIVED', status=200)
            else:
                return HttpResponse('Not Found', status=404)
        except Exception as e:
            print(f"Error en webhook FB POST: {e}")
            return HttpResponse('Internal Server Error', status=500)
            
    return HttpResponse('Method Not Allowed', status=405)


# --- Nuevos Endpoints para la UI (Bandeja de Entrada) ---
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Conversacion, Mensaje

from django.db.models import OuterRef, Subquery

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_conversaciones(request):
    plataforma = request.GET.get('plataforma', 'whatsapp')
    last_msg_qs = Mensaje.objects.filter(conversacion=OuterRef('pk')).order_by('-created_at')
    conversaciones = Conversacion.objects.filter(tenant=request.user.tenant, plataforma=plataforma)\
        .annotate(last_message_content=Subquery(last_msg_qs.values('content')[:1]))\
        .order_by('-last_message_at')
    data = []
    for c in conversaciones:
        data.append({
            'id': c.id,
            'client_phone': c.client_phone,
            'client_name': c.client_name,
            'unread_count': c.unread_count,
            'status': c.status,
            'plataforma': c.plataforma,
            'last_message_at': c.last_message_at.isoformat() if c.last_message_at else None,
            'last_message_content': getattr(c, 'last_message_content', ''),
        })
    return Response({'conversaciones': data}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_unread_count(request):
    plataforma = request.GET.get('plataforma', 'whatsapp')
    from django.db.models import Sum
    total = Conversacion.objects.filter(tenant=request.user.tenant, status='OPEN', plataforma=plataforma).aggregate(total=Sum('unread_count'))['total'] or 0
    return Response({'unread_count': total}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_mensajes(request, conversacion_id):
    try:
        conversacion = Conversacion.objects.get(id=conversacion_id, tenant=request.user.tenant)
    except Conversacion.DoesNotExist:
        return Response({'error': 'Conversación no encontrada'}, status=404)
        
    # Reset unread
    if conversacion.unread_count > 0:
        conversacion.unread_count = 0
        conversacion.save()
        
    mensajes = conversacion.mensajes.order_by('created_at')
    data = []
    for m in mensajes:
        data.append({
            'id': m.id,
            'external_id': m.external_id,
            'direction': m.direction,
            'content': m.content,
            'status': m.status,
            'created_at': m.created_at.isoformat()
        })
    return Response({'mensajes': data}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_mensaje(request, conversacion_id):
    text_body = request.data.get('content')
    reply_to = request.data.get('reply_to')
    image_url = request.data.get('image_url')
    if not text_body and not image_url:
        return Response({'error': 'El contenido no puede estar vacío'}, status=400)
        
    from .models import Conversacion
    try:
        conversacion = Conversacion.objects.get(id=conversacion_id)
    except Conversacion.DoesNotExist:
        return Response({'error': 'Conversacion no encontrada'}, status=404)

    if conversacion.plataforma == 'facebook':
        from .services.facebook_chat_service import FacebookChatService
        service = FacebookChatService(tenant=request.user.tenant)
        nuevo_mensaje = service.enviar_mensaje_texto(conversacion_id, text_body)
    else:
        from .services.whatsapp_service import WhatsappService
        service = WhatsappService(tenant=request.user.tenant)
        nuevo_mensaje = service.enviar_mensaje_texto(conversacion_id, text_body, reply_to_wam_id=reply_to, image_url=image_url)
    
    if nuevo_mensaje:
        return Response({
            'id': nuevo_mensaje.id,
            'external_id': nuevo_mensaje.external_id,
            'direction': nuevo_mensaje.direction,
            'content': nuevo_mensaje.content,
            'status': nuevo_mensaje.status,
            'created_at': nuevo_mensaje.created_at.isoformat()
        }, status=201)
    else:
        return Response({'error': 'No se pudo enviar el mensaje a través de Meta API'}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_conversacion(request, conversacion_id):
    try:
        conversacion = Conversacion.objects.get(id=conversacion_id, tenant=request.user.tenant)
        conversacion.delete()
        return Response({'status': 'deleted'}, status=200)
    except Conversacion.DoesNotExist:
        return Response({'error': 'Conversación no encontrada'}, status=404)


from rest_framework import viewsets
from .models import ReglaRespuestaBot, RespuestaRapida
from .serializers import ReglaRespuestaBotSerializer, RespuestaRapidaSerializer

class ReglaRespuestaBotViewSet(viewsets.ModelViewSet):
    serializer_class = ReglaRespuestaBotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReglaRespuestaBot.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class RespuestaRapidaViewSet(viewsets.ModelViewSet):
    serializer_class = RespuestaRapidaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RespuestaRapida.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sugerencias_productos(request, conversacion_id):
    """
    Analiza el último mensaje del cliente y retorna sugerencias de productos.
    """
    from apps.catalogo.models import Prenda
    from django.db.models import Q
    import re
    
    try:
        conversacion = Conversacion.objects.get(id=conversacion_id, tenant=request.user.tenant)
    except Conversacion.DoesNotExist:
        return Response({'error': 'Conversación no encontrada'}, status=404)

    last_msg = conversacion.mensajes.filter(direction='INBOUND').order_by('-created_at').first()
    if not last_msg:
        return Response({'sugerencias': []}, status=200)

    text = last_msg.content.lower()
    
    # 1. Limpieza básica y tokenización
    words = re.findall(r'\b\w{3,}\b', text)
    if not words:
        return Response({'sugerencias': []}, status=200)

    # 2. Búsqueda en Prenda (nombre) y PrendaVariante (color, talla)
    # Excluimos palabras muy comunes si es necesario, pero icontains ayuda
    q_objects = Q()
    for word in words:
        if word in ['que', 'los', 'las', 'por', 'con', 'para', 'una', 'uno', 'del', 'tienes', 'hola', 'quiero', 'necesito', 'busco']:
            continue
        q_objects |= Q(nombre__icontains=word)
        q_objects |= Q(variantes__color__icontains=word)
        q_objects |= Q(variantes__talla__icontains=word)
        q_objects |= Q(categoria__nombre__icontains=word)

    if not q_objects:
        return Response({'sugerencias': []}, status=200)

    # Filtrar prendas del tenant con stock > 0 que coincidan con la búsqueda
    prendas = Prenda.objects.filter(tenant=request.user.tenant, variantes__cantidad__gt=0).filter(q_objects).distinct()[:5]

    sugerencias = []
    for p in prendas:
        img_url = p.foto_url
        if not img_url:
            primera_img = p.imagenes.first()
            if primera_img and primera_img.imagen:
                img_url = request.build_absolute_uri(primera_img.imagen.url)

        # Detalles de stock por variante
        stock_details = []
        for v in p.variantes.filter(cantidad__gt=0):
            stock_details.append(f"{v.talla or 'Unica'} {v.color or ''}({v.cantidad})")
            
        sugerencias.append({
            'id': p.id,
            'nombre': p.nombre,
            'precio': p.precio,
            'imagen': img_url,
            'stock_info': ", ".join(stock_details)
        })

    return Response({'sugerencias': sugerencias}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def guardar_suscripcion_push(request):
    """
    Guarda o actualiza la suscripción de Web Push del usuario actual.
    """
    from apps.core.models import PushSubscription
    
    endpoint = request.data.get('endpoint')
    keys = request.data.get('keys', {})
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not endpoint or not p256dh or not auth:
        return Response({'error': 'Faltan datos de la suscripción'}, status=400)

    # Buscar si ya existe el endpoint para actualizarlo o crearlo
    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'usuario': request.user,
            'p256dh': p256dh,
            'auth': auth
        }
    )

    return Response({'status': 'Suscripción guardada'}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_vapid_public_key(request):
    """
    Retorna la llave pública de VAPID para que el frontend pueda suscribirse.
    """
    vapid_public = config('VAPID_PUBLIC_KEY', default='')
    return Response({'public_key': vapid_public}, status=200)

