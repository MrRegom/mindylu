# apps/integraciones/tasks.py
from apps.catalogo.models import CicloVenta, Prenda
from django.conf import settings
import requests

def ejecutar_publicacion_lote(ciclo_id):
    """
    Se ejecuta de forma asíncrona por APScheduler.
    Busca el CicloVenta, extrae sus prendas, y las publica en Facebook.
    """
    try:
        ciclo = CicloVenta.objects.get(id=ciclo_id, estado=CicloVenta.Estado.PROGRAMADO)
    except CicloVenta.DoesNotExist:
        print(f"Lote {ciclo_id} no encontrado o ya no está programado.")
        return

    prendas = ciclo.prendas.all()
    if not prendas.exists():
        print(f"Lote {ciclo_id} no tiene prendas. Cancelando publicación.")
        ciclo.estado = CicloVenta.Estado.CERRADO
        ciclo.save()
        return

    # Lógica extraída de publicar_lote_en_facebook (simplificada sin request user, usamos tenant del ciclo)
    # Asumimos que el tenant tiene token de fb configurado
    access_token = settings.FACEBOOK_PAGE_ACCESS_TOKEN
    page_id = settings.FACEBOOK_PAGE_ID
    
    if not access_token or not page_id:
        print("Configuración de Facebook faltante en el servidor.")
        return

    media_ids = []
    media_ids = []

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
                print(f"Error subiendo imagen a Facebook: {e}")

    if media_ids:
        if ciclo.mensaje_facebook:
            mensaje = ciclo.mensaje_facebook
        else:
            mensaje = "✨ ¡Llegó mercadería nueva! ✨\n\n¡Escríbenos por mensaje directo para reservar la tuya! 💛"

        try:
            url_feed = f"https://graph.facebook.com/v19.0/{page_id}/feed"
            payload = {
                'message': mensaje,
                'attached_media': media_ids,
                'access_token': access_token
            }
            res_feed = requests.post(url_feed, json=payload)
            res_feed.raise_for_status()
            res_data = res_feed.json()
            
            # Guardamos la URL
            if 'id' in res_data:
                ciclo.url_facebook_post = f"https://facebook.com/{res_data['id']}"
                
        except Exception as e:
            print(f"Error creando el post final en Facebook: {e}")

    # Independientemente de si falló Facebook (por red), lo pasamos a ACTIVO para que esté disponible en el catálogo
    ciclo.estado = CicloVenta.Estado.ACTIVO
    ciclo.save()
    print(f"Lote {ciclo_id} publicado y activado correctamente.")
