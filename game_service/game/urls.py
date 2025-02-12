from django.urls import path

urlpatterns = [
    path('', include('ws/local-game/')), #add front path
]