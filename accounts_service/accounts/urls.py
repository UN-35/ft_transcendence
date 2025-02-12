
from django.urls import path,include
from . import views

app_name = 'accounts'

urlpatterns = [

    path('auth/', include('social_django.urls', namespace='social')),
    path('api/signup/', views.api_signup, name='api_signup'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/profile/', views.api_profile_view, name='api_profile_view'),
    path('api/update_profile/', views.api_update_profile, name='api_update_profile'),
    path('api/auth/google/url/', views.api_google_auth_url, name='api_google_auth_url'),
    path('api/auth/google/callback/', views.google_callback, name='google-auth-callback'),
    path('api/42/callback/', views.callback_from_42, name='api_complete_42_login'),
    path('api/auth/42/url/', views.login_with_42, name='api_login_with_42'),
    path('api/change_password/', views.change_password_api, name='change_password_api'),
    path('api/get_2fa_qr/', views.get_2fa_qr_view, name='get_2fa_qr'),
    path('api/enable_2fa/', views.enable_2fa_view, name='enable_2fa'),
    path('api/disable_2fa/', views.disable_2fa_view, name='disable_2fa'),
    path('api/check_2fa_status/', views.check_2fa_status_view, name='check_2fa_status'),
    path('api/verify_2fa/', views.verify_2fa_view, name='verify_2fa'),
    path('api/check_auth/', views.check_auth, name='check_auth'),
    path('api/leaderboard/', views.leaderboard, name='leaderboard'),
    path('api/stats/', views.stats, name='stats'),
    path('api/game_history/', views.game_history, name='game_history'),
    path('api/delete_account/', views.delete_account, name='delete_account'),
    path('api/accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
    path('api/reject_friend_request/', views.reject_friend_request, name='reject_friend_request'),
    path('api/friend_requests/', views.get_friend_requests, name='get_friend_requests'),
    path('api/add_friend/', views.add_friend, name='add_friend'),
    path('api/get_friends/', views.get_friends, name='riends'),
    path('api/profile/<str:username>/', views.api_user_profile_view, name='api_user_profile_view'),
    path('api/add-friend/<str:username>/', views.add_friend1, name='add_friend'),
    path('accounts/api/token/refresh/', views.refresh_token_view, name='token_refresh'),
]
