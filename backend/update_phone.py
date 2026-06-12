from apps.core.models import Tenant
t=Tenant.objects.first()
t.whatsapp_numero='56933075784'
t.save()
print('Phone updated')
