# ─────────────────────────────────────────────────────────────
# apps/catalogo/views.py
# ─────────────────────────────────────────────────────────────

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Prenda, CicloVenta, PrendaVariante
from .serializers import (
    PrendaSerializer, 
    PrendaCreateUpdateSerializer, 
    CicloVentaSerializer
)


class PrendaViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para Prendas del catálogo.
    Filtra automáticamente por el tenant de la usuaria.
    """
    def get_queryset(self):
        queryset = Prenda.objects.filter(tenant=self.request.user.tenant).prefetch_related('variantes')
        incluir_archivadas = self.request.query_params.get('incluir_archivadas', 'false').lower() == 'true'
        if incluir_archivadas:
            return queryset
        return queryset.filter(estado__in=[Prenda.Estado.DISPONIBLE, Prenda.Estado.AGOTADA])

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PrendaCreateUpdateSerializer
        return PrendaSerializer

    def create(self, request, *args, **kwargs):
        import json
        
        # Convertimos request.data a un dict normal para poder inyectar listas (JSON) sin que QueryDict lo rompa
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
            print("SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        
        # Manejar imágenes subidas (FormData permite múltiples archivos con la misma key)
        prenda = serializer.instance
        imagenes = request.FILES.getlist('imagenes')
        for i, img in enumerate(imagenes):
            from .models import PrendaImagen
            PrendaImagen.objects.create(prenda=prenda, imagen=img, orden=i)
            
        headers = self.get_success_headers(serializer.data)
        # Devolvemos el serializador de lectura para incluir la data completa y fotos
        return Response(PrendaSerializer(prenda).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Crea múltiples prendas a la vez (Carga Masiva).
        Espera un FormData con:
        - 'items': JSON array de { nombre, precio, talla_tipo, color, talla, cantidad }
        - 'imagenes_0', 'imagenes_1', ...: los archivos de imagen respectivos en el mismo orden.
        """
        import json
        from django.db import transaction
        from .models import Prenda, PrendaImagen, PrendaVariante
        
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
                    # 1. Crear la Prenda
                    prenda = Prenda.objects.create(
                        tenant=request.user.tenant,
                        ciclo=ciclo,
                        nombre=item.get('nombre', 'Producto Sin Nombre'),
                        precio=int(item.get('precio', 0)),
                        talla_tipo='unica' # default fallback
                    )
                    
                    # 2. Crear las variantes (ahora iteramos sobre el arreglo de variantes)
                    variantes_list = item.get('variantes', [])
                    if not variantes_list:
                        # Fallback por si acaso
                        PrendaVariante.objects.create(
                            prenda=prenda,
                            color='Único',
                            talla='Única',
                            cantidad=1
                        )
                    else:
                        for v in variantes_list:
                            PrendaVariante.objects.create(
                                prenda=prenda,
                                color=v.get('color', 'Único'),
                                talla=v.get('talla', 'Única'),
                                cantidad=int(v.get('cantidad', 1))
                            )
                    
                    # 3. Guardar la imagen (si viene)
                    imagen_file = request.FILES.get(f'imagenes_{i}')
                    if imagen_file:
                        PrendaImagen.objects.create(
                            prenda=prenda,
                            imagen=imagen_file,
                            orden=0
                        )
                        
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
        Asocia y suma stock de variantes a una prenda ya existente.
        POST /api/v1/catalogo/prendas/asociar_stock/
        {
            "prenda_id": 123,
            "variantes": [
                { "color": "Beige", "talla": "Estándar", "cantidad": 3 }
            ]
        }
        """
        prenda_id = request.data.get('prenda_id')
        variantes_data = request.data.get('variantes', [])
        
        if not prenda_id:
            return Response({'error': 'El campo prenda_id es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Buscar la prenda asegurando el multi-tenant
            prenda = Prenda.objects.get(id=prenda_id, tenant=request.user.tenant)
        except Prenda.DoesNotExist:
            return Response({'error': 'La prenda seleccionada no existe en tu catálogo.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Sumar o crear el stock para cada variante
        for var in variantes_data:
            color = var.get('color', 'Por defecto')
            talla = var.get('talla', 'Única')
            cantidad = int(var.get('cantidad', 1))
            
            variante_obj, created = PrendaVariante.objects.get_or_create(
                prenda=prenda,
                color=color,
                talla=talla,
                defaults={'cantidad': 0}
            )
            variante_obj.cantidad += cantidad
            variante_obj.save()
            
        # Recalcular y reactivar prenda si estaba archivada o agotada (SRP)
        prenda.actualizar_estado()
            
        return Response({
            'status': 'Stock fusionado exitosamente',
            'prenda': PrendaSerializer(prenda).data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete: Cambia el estado de la prenda a 'archivada'
        para que no se muestre en el catálogo activo pero se conserve para reconocimiento futuro.
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
        """
        Retorna los lotes programados
        """
        qs = self.get_queryset().filter(estado=CicloVenta.Estado.PROGRAMADO).order_by('fecha_programada')
        
        # Necesitamos la información de las prendas para el frontend
        from .serializers import PrendaSerializer
        
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
        """
        Agrega prendas a un lote programado.
        Espera FormData similar a bulk_create pero para un ciclo existente.
        """
        import json
        from django.db import transaction
        from .models import Prenda, PrendaImagen, PrendaVariante
        
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
                                prenda=prenda, color=v.get('color', 'Único'), talla=v.get('talla', 'Única'), cantidad=int(v.get('cantidad', 1))
                            )
                            
                    imagen_file = request.FILES.get(f'imagenes_{i}')
                    if imagen_file:
                        PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)
                        
                    creadas_ids.append(prenda.id)
                    
            return Response({'mensaje': f'Se agregaron {len(creadas_ids)} prendas al lote.', 'prenda_ids': creadas_ids}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
