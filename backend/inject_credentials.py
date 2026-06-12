import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.integraciones.models import WhatsappConfig
from apps.core.models import Tenant

def main():
    tenant = Tenant.objects.first()
    if not tenant:
        tenant = Tenant.objects.create(nombre="MindyLu", schema_name="public")
        
    config, created = WhatsappConfig.objects.get_or_create(tenant=tenant)
    config.phone_number_id = "1169460252913695"
    config.waba_id = "1727902738656627"
    config.access_token = "EAAMgQdgrNswBRtpNsH3liWp2i4rcLGx2bpYrI2YCCbXpL3I8TAziP2J7VyZBZB2e555bVR1prOYeDsxWbjvQeQPl6XBZAikRXtSUlRx6vqfDJAk5mwnWPXPIr9IAsibNcLDCZCrIzjBnV52ZCA9orHVfKvxZBC9cw9blRq5shf1ZBZAmpCocysf8uOaWZA8gu7ZBDT9gZDZD"
    config.is_active = True
    config.save()
    print("Credentials saved successfully!")

if __name__ == '__main__':
    main()
