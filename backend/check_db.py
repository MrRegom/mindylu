from apps.integraciones.models import WhatsappConfig
c = WhatsappConfig.objects.first()
if c:
    print('Active:', c.is_active, 'Token:', c.access_token[:10], 'PhoneID:', c.phone_number_id)
else:
    print('No config')
