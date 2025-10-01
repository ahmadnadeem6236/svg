from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'priority', 'due_date']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        task = serializer.save(owner=self.request.user)
        self.broadcast_task_update(task, 'created')
    
    def perform_update(self, serializer):
        task = serializer.save()
        self.broadcast_task_update(task, 'updated')
    
    def perform_destroy(self, instance):
        task_id = instance.id
        user_id = instance.owner.id
        instance.delete()
        self.broadcast_task_delete(task_id, user_id)
    
    def broadcast_task_update(self, task, action):
        channel_layer = get_channel_layer()
        task_data = TaskSerializer(task).data
        
        async_to_sync(channel_layer.group_send)(
            f'tasks_{task.owner.id}',
            {
                'type': 'task_update',
                'task': task_data,
                'action': action
            }
        )
    
    def broadcast_task_delete(self, task_id, user_id):
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f'tasks_{user_id}',
            {
                'type': 'task_update',
                'task': {'id': task_id},
                'action': 'deleted'
            }
        )
