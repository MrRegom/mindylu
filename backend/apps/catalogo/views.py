# ─────────────────────────────────────────────────────────────
# apps/catalogo/views.py
# ─────────────────────────────────────────────────────────────

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Prenda, CicloVenta, PrendaVariante, Categoria
from .serializers import (
    PrendaSerializer,
    PrendaCreateUpdateSerializer,
    CicloVentaSerializer,
    CategoriaSerializer,
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para las categorías del tenant.
    Cada tenant ve y gestiona solo sus propias categorías.
    """
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        return Categoria.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class PrendaViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para Prendas del catálogo.
    Filtra automáticamente por el tenant de la usuaria.
    """
    def get_queryset(self):
        qs = Prenda.objects.filter(tenant=self.request.user.tenant).prefetch_related('variantes', 'imagenes').select_related('categoria')
        incluir_archivadas = self.request.query_params.get('incluir_archivadas', 'false').lower() == 'true'
        if not incluir_archivadas:
            qs = qs.filter(estado__in=[Prenda.Estado.DISPONIBLE, Prenda.Estado.AGOTADA])
        # Filtro por categoría
        categoria_id = self.request.query_params.get('categoria', None)
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)
        # Filtro "nuevas de hoy"
        solo_hoy = self.request.query_params.get('solo_hoy', 'false').lower() == 'true'
        if solo_hoy:
            from django.utils import timezone
            from datetime import timedelta
            hoy_inicio = timezone.now() - timedelta(hours=24)
            qs = qs.filter(fecha_ultima_carga__gte=hoy_inicio)
        return qs

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PrendaCreateUpdateSerializer
        return PrendaSerializer

    def create(self, request, *args, **kwargs):
        import json
        data = {}
        for key in request.data.keys():
            if key == 'variantes':
                val = request.data.get('variantes', '[]')
                if isinstance(val, str):
                    try:
                        data['variantes'] = json.loads(val)
                    except json.JSONDecodeError:
                        return Response({'error': 'Variantes inválidas'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    data['variantes'] = val
            else:
                data[key] = request.data.get(key)

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        prenda = serializer.instance
        imagenes = request.FILES.getlist('imagenes')
        for i, img in enumerate(imagenes):
            from .models import PrendaImagen
            PrendaImagen.objects.create(prenda=prenda, imagen=img, orden=i)
        headers = self.get_success_headers(serializer.data)
        return Response(PrendaSerializer(prenda).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'])
    def subir_foto(self, request):
        """
        Nuevo endpoint unificado para subir fotos al catálogo.

        Detecta si la prenda ya existe por nombre (case-insensitive) dentro del tenant.
        - Si ya existe → devuelve { existe: true, prenda: {...} } para que el frontend
          pregunte si se desea sumar stock.
        - Si no existe → crea la prenda nueva con imagen y variantes.

        Espera FormData con:
          - nombre (str)
          - precio (int)
          - categoria_id (int, opcional)
          - variantes (JSON str): [{ color, talla, cantidad }]
          - imagen (file, opcional)
        """
        import json
        from django.db import transaction
        from .models import PrendaImagen

        nombre = request.data.get('nombre', '').strip()
        if not nombre:
            return Response({'error': 'El nombre es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        # Detección de duplicado por nombre (iexact = insensible a mayúsculas)
        prenda_existente = Prenda.objects.filter(
            tenant=request.user.tenant,
            nombre__iexact=nombre
        ).exclude(estado=Prenda.Estado.ARCHIVADA).first()

        if prenda_existente:
            return Response({
                'existe': True,
                'prenda': PrendaSerializer(prenda_existente).data
            }, status=status.HTTP_200_OK)

        # No existe → crear nueva
        try:
            precio = int(request.data.get('precio', 0))
            categoria_id = request.data.get('categoria_id', None)
            variantes_str = request.data.get('variantes', '[]')
            variantes_data = json.loads(variantes_str) if isinstance(variantes_str, str) else variantes_str
            imagen_file = request.FILES.get('imagen')

            with transaction.atomic():
                prenda = Prenda.objects.create(
                    tenant=request.user.tenant,
                    nombre=nombre,
                    precio=precio,
                    categoria_id=categoria_id if categoria_id else None,
                    talla_tipo='unica'
                )
                if not variantes_data:
                    PrendaVariante.objects.create(prenda=prenda, color='Único', talla='Única', cantidad=1)
                else:
                    for v in variantes_data:
                        PrendaVariante.objects.create(
                            prenda=prenda,
                            color=v.get('color', 'Único'),
                            talla=v.get('talla', 'Única'),
                            cantidad=int(v.get('cantidad', 1))
                        )
                if imagen_file:
                    PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)

            return Response({
                'existe': False,
                'prenda': PrendaSerializer(prenda).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def publicar_seleccionadas(self, request):
        """
        Publica o programa en Facebook las prendas seleccionadas desde el catálogo.

        Espera JSON:
          {
            "prenda_ids": [1, 2, 3],
            "mensaje": "Nuevas llegadas ✨",
            "fecha_programada": "2026-05-27T22:00:00" (null = publicar ahora)
          }
        """
        from django.db import transaction

        prenda_ids = request.data.get('prenda_ids', [])
        mensaje = request.data.get('mensaje', '')
        fecha_programada_str = request.data.get('fecha_programada', None)

        if not prenda_ids:
            return Response({'error': 'Debes seleccionar al menos una prenda.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que todas las prendas pertenezcan al tenant (seguridad multi-tenant)
        prendas = Prenda.objects.filter(id__in=prenda_ids, tenant=request.user.tenant)
        if prendas.count() != len(prenda_ids):
            return Response({'error': 'Una o más prendas no existen en tu catálogo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                from django.utils.dateparse import parse_datetime

                ciclo = CicloVenta.objects.create(
                    tenant=request.user.tenant,
                    mensaje_facebook=mensaje,
                    estado=CicloVenta.Estado.PROGRAMADO if fecha_programada_str else CicloVenta.Estado.ACTIVO
                )
                if fecha_programada_str:
                    ciclo.fecha_programada = parse_datetime(fecha_programada_str)
                    ciclo.save()

                # Asociar las prendas seleccionadas al ciclo
                prendas.update(ciclo=ciclo)

                if fecha_programada_str:
                    from apps.integraciones.scheduler import schedule_publicacion_lote
                    schedule_publicacion_lote(ciclo.id, ciclo.fecha_programada)
                else:
                    # Publicar inmediatamente
                    from apps.integraciones.tasks import ejecutar_publicacion_lote
                    ejecutar_publicacion_lote(ciclo.id)

            return Response({
                'mensaje': f'{prendas.count()} prendas enviadas a publicar.',
                'ciclo_id': ciclo.id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Crea múltiples prendas a la vez (compatibilidad con flujo anterior).
        """
        import json
        from django.db import transaction
        from .models import PrendaImagen

        try:
            items_str = request.data.get('items', '[]')
            items = json.loads(items_str)
            fecha_programada_str = request.data.get('fecha_programada', None)
            mensaje_facebook = request.data.get('mensaje', '')
        except json.JSONDecodeError:
            return Response({'error': 'JSON de items inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if not items:
            return Response({'error': 'No se enviaron items.'}, status=status.HTTP_400_BAD_REQUEST)

        creadas_ids = []
        try:
            with transaction.atomic():
                from django.utils.dateparse import parse_datetime
                ciclo = CicloVenta.objects.create(
                    tenant=request.user.tenant,
                    mensaje_facebook=mensaje_facebook,
                    estado=CicloVenta.Estado.PROGRAMADO if fecha_programada_str else CicloVenta.Estado.ACTIVO
                )
                if fecha_programada_str:
                    ciclo.fecha_programada = parse_datetime(fecha_programada_str)
                    ciclo.save()

                for i, item in enumerate(items):
                    prenda = Prenda.objects.create(
                        tenant=request.user.tenant,
                        ciclo=ciclo,
                        nombre=item.get('nombre', 'Producto Sin Nombre'),
                        precio=int(item.get('precio', 0)),
                        talla_tipo='unica'
                    )
                    variantes_list = item.get('variantes', [])
                    if not variantes_list:
                        PrendaVariante.objects.create(prenda=prenda, color='Único', talla='Única', cantidad=1)
                    else:
                        for v in variantes_list:
                            PrendaVariante.objects.create(
                                prenda=prenda,
                                color=v.get('color', 'Único'),
                                talla=v.get('talla', 'Única'),
                                cantidad=int(v.get('cantidad', 1))
                            )
                    imagen_file = request.FILES.get(f'imagenes_{i}')
                    if imagen_file:
                        PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)
                    creadas_ids.append(prenda.id)

                if fecha_programada_str:
                    from apps.integraciones.scheduler import schedule_publicacion_lote
                    schedule_publicacion_lote(ciclo.id, ciclo.fecha_programada)

            return Response({
                'mensaje': f'Se crearon {len(creadas_ids)} prendas masivamente.',
                'prenda_ids': creadas_ids,
                'ciclo_id': ciclo.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def vender_variante(self, request, pk=None):
        """
        Endpoint rápido para descontar 1 unidad de stock de una variante específica.
        POST /api/v1/catalogo/prendas/<id>/vender_variante/ { "variante_id": 123 }
        """
        prenda = self.get_object()
        variante_id = request.data.get('variante_id')
        try:
            variante = prenda.variantes.get(id=variante_id)
            if variante.vender(cantidad=1):
                return Response({'status': 'Stock actualizado', 'prenda': PrendaSerializer(prenda).data})
            else:
                return Response({'error': 'Sin stock disponible'}, status=status.HTTP_400_BAD_REQUEST)
        except PrendaVariante.DoesNotExist:
            return Response({'error': 'Variante no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def asociar_stock(self, request):
        """
        Suma stock de variantes a una prenda ya existente.
        También actualiza fecha_ultima_carga para que aparezca en el filtro "hoy".
        POST /api/v1/catalogo/prendas/asociar_stock/
        { "prenda_id": 123, "variantes": [{ "color": "Beige", "talla": "Estándar", "cantidad": 3 }] }
        """
        from django.utils import timezone

        prenda_id = request.data.get('prenda_id')
        variantes_data = request.data.get('variantes', [])

        if not prenda_id:
            return Response({'error': 'El campo prenda_id es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prenda = Prenda.objects.get(id=prenda_id, tenant=request.user.tenant)
        except Prenda.DoesNotExist:
            return Response({'error': 'La prenda seleccionada no existe en tu catálogo.'}, status=status.HTTP_404_NOT_FOUND)

        for var in variantes_data:
            color = var.get('color', 'Por defecto')
            talla = var.get('talla', 'Única')
            cantidad = int(var.get('cantidad', 1))
            variante_obj, created = PrendaVariante.objects.get_or_create(
                prenda=prenda, color=color, talla=talla,
                defaults={'cantidad': 0}
            )
            variante_obj.cantidad += cantidad
            variante_obj.save()

        # Tocar fecha_ultima_carga para que aparezca en el filtro "nuevas de hoy"
        prenda.save(update_fields=['fecha_ultima_carga'])
        prenda.actualizar_estado()

        return Response({
            'status': 'Stock fusionado exitosamente',
            'prenda': PrendaSerializer(prenda).data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete: Cambia el estado de la prenda a 'archivada'.
        """
        prenda = self.get_object()
        prenda.estado = Prenda.Estado.ARCHIVADA
        prenda.save()
        return Response({'status': 'Prenda archivada exitosamente'}, status=status.HTTP_200_OK)


class CicloVentaViewSet(viewsets.ModelViewSet):
    """
    Gestión de ciclos de venta (álbumes).
    """
    serializer_class = CicloVentaSerializer

    def get_queryset(self):
        return CicloVenta.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=False, methods=['get'])
    def programados(self, request):
        """Retorna los lotes programados con sus prendas."""
        qs = self.get_queryset().filter(estado=CicloVenta.Estado.PROGRAMADO).order_by('fecha_programada')
        data = []
        for ciclo in qs:
            prendas = ciclo.prendas.all()
            data.append({
                'id': ciclo.id,
                'fecha_programada': ciclo.fecha_programada,
                'prendas': PrendaSerializer(prendas, many=True).data
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def agregar_fotos(self, request, pk=None):
        """Agrega prendas a un lote programado."""
        import json
        from django.db import transaction
        from .models import PrendaImagen

        ciclo = self.get_object()
        if ciclo.estado != CicloVenta.Estado.PROGRAMADO:
            return Response({'error': 'Solo se pueden agregar fotos a lotes programados.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            items_str = request.data.get('items', '[]')
            items = json.loads(items_str)
        except json.JSONDecodeError:
            return Response({'error': 'JSON de items inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        creadas_ids = []
        try:
            with transaction.atomic():
                for i, item in enumerate(items):
                    prenda = Prenda.objects.create(
                        tenant=request.user.tenant,
                        ciclo=ciclo,
                        nombre=item.get('nombre', 'Producto Sin Nombre'),
                        precio=int(item.get('precio', 0)),
                        talla_tipo='unica'
                    )
                    variantes_list = item.get('variantes', [])
                    if not variantes_list:
                        PrendaVariante.objects.create(prenda=prenda, color='Único', talla='Única', cantidad=1)
                    else:
                        for v in variantes_list:
                            PrendaVariante.objects.create(
                                prenda=prenda, color=v.get('color', 'Único'),
                                talla=v.get('talla', 'Única'), cantidad=int(v.get('cantidad', 1))
                            )
                    imagen_file = request.FILES.get(f'imagenes_{i}')
                    if imagen_file:
                        PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)
                    creadas_ids.append(prenda.id)

            return Response({'mensaje': f'Se agregaron {len(creadas_ids)} prendas al lote.', 'prenda_ids': creadas_ids}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import ColorPredefinido, TallaPredefinida, NombrePrendaPredefinido
from .serializers import ColorPredefinidoSerializer, TallaPredefinidaSerializer, NombrePrendaPredefinidoSerializer

class ColorPredefinidoViewSet(viewsets.ModelViewSet):
    serializer_class = ColorPredefinidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ColorPredefinido.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class TallaPredefinidaViewSet(viewsets.ModelViewSet):
    serializer_class = TallaPredefinidaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TallaPredefinida.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class NombrePrendaPredefinidoViewSet(viewsets.ModelViewSet):
    serializer_class = NombrePrendaPredefinidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NombrePrendaPredefinido.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
