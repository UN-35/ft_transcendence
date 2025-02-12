from django.urls import path
from game.consumers import LocalConsumer
from game.consumers import TournamentConsumer


websocket_urlpatterns = [
    path('ws/local-game/', LocalConsumer.as_asgi()),
    path('ws/tournament-game/', TournamentConsumer.as_asgi()),
]
