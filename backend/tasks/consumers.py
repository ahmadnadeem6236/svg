import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await self.get_user_from_token()
        
        if self.user is None:
            await self.close()
            return
        
        self.room_group_name = f'tasks_{self.user.id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    # Receive message from room group
    async def task_update(self, event):
        task_data = event['task']
        action = event['action']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'action': action,
            'task': task_data
        }))
    
    @database_sync_to_async
    def get_user_from_token(self):
        try:
            token = None
            for key, value in self.scope['headers']:
                if key == b'authorization':
                    token = value.decode().split(' ')[1]
                    break
            
            if not token:
                # Try to get from query string
                query_string = self.scope['query_string'].decode()
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=')[1]
                        break
            
            if token:
                UntypedToken(token)
                from rest_framework_simplejwt.tokens import AccessToken
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None
        
        return None
