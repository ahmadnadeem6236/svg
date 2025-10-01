import os

# Ensure Django settings are configured before importing Django/Channels modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Initialize Django ASGI application early to ensure the app registry is ready
django_asgi_app = get_asgi_application()

# Import routing only after Django is initialized
import tasks.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                tasks.routing.websocket_urlpatterns
            )
        )
    ),
})
