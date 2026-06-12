from apps.core.models import ConfiguracionTienda
c = ConfiguracionTienda.objects.first()
if c:
    c.whatsapp_numero = '56933075784'
    c.save()
    print('ConfiguracionTienda phone updated')
else:
    print('No config found')
