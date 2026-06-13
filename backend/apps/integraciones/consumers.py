import json
from channels.generic.websocket import AsyncWebsocketConsumer

class WhatsappChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Unimos a todos los clientes (dashboard admin) a un grupo global "whatsapp_chats"
        self.room_group_name = 'whatsapp_chats'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibir mensaje de la sala (cuando se envía desde Django views)
    async def chat_message(self, event):
        # event contiene el payload que enviamos desde el webhook
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['data']
        }))
