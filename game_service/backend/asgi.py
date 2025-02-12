# import os

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# # from channels.auth import AuthMiddlewareStack
# from game.routing import websocket_urlpatterns

# from game.consumers import JWTAuthMiddleware

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": JWTAuthMiddleware(
#         URLRouter(
#             websocket_urlpatterns
#         )
#     ),
# })

# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.urls import path
# from yourapp.consumers import LocalConsumer
# from .middleware import JWTAuthMiddleware  # Import custom middleware

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": JWTAuthMiddleware(
#         URLRouter([
#             path("ws/local-game/", LocalConsumer.as_asgi()),
#         ])
#     ),
# })
import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from game.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})