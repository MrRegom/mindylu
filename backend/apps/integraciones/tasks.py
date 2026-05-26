# apps/integraciones/tasks.py
from apps.catalogo.models import CicloVenta, Prenda
from django.conf import settings
import requests

def ejecutar_publicacion_lote(ciclo_id):
    """
    Se ejecuta por APScheduler (programado) o inmediatamente (publicar_seleccionadas).
    Busca el CicloVenta, extrae sus prendas, y las publica en Facebook.
    Acepta ciclos en estado PROGRAMADO o ACTIVO (publicación inmediata sin fecha).
    """
    try:
        ciclo = CicloVenta.objects.get(
            id=ciclo_id,
            estado__in=[CicloVenta.Estado.PROGRAMADO, CicloVenta.Estado.ACTIVO]
        )
    except CicloVenta.DoesNotExist:
        print(f"Lote {ciclo_id} no encontrado o ya está cerrado.")
        return

    prendas = ciclo.prendas.all()
    if not prendas.exists():
        print(f"Lote {ciclo_id} no tiene prendas. Cancelando publicación.")
        ciclo.estado = CicloVenta.Estado.CERRADO
        ciclo.save()
        return

    access_token = getattr(settings, 'FACEBOOK_PAGE_ACCESS_TOKEN', None)
    page_id = getattr(settings, 'FACEBOOK_PAGE_ID', None)

    if not access_token or not page_id:
        print("Configuración de Facebook faltante en el servidor.")
        return

    media_ids = []

    for prenda in prendas:
        imagen = prenda.imagenes.first()
        if imagen or prenda.foto_url:
            try:
                url_photo = f"https://graph.facebook.com/v19.0/{page_id}/photos"
                data = {'published': 'false', 'access_token': access_token}
                files = None
                
                if imagen and imagen.imagen:
                    files = {'source': open(imagen.imagen.path, 'rb')}
                else:
                    data['url'] = prenda.foto_url

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

            if 'id' in res_data:
                ciclo.url_facebook_post = f"https://facebook.com/{res_data['id']}"
                print(f"Post publicado exitosamente: {ciclo.url_facebook_post}")

        except Exception as e:
            print(f"Error creando el post final en Facebook: {e}")
    else:
        print(f"Lote {ciclo_id}: ninguna prenda tenía imagen. No se publicó en Facebook.")

    # Marcar como activo independientemente del resultado de Facebook
    ciclo.estado = CicloVenta.Estado.ACTIVO
    ciclo.save()
    print(f"Lote {ciclo_id} procesado correctamente.")
