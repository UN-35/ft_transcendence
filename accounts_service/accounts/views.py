from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.core.cache import cache
from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from django.http import HttpResponse
from social_django.models import UserSocialAuth
from allauth.socialaccount.models import SocialAccount
from .models import CustomUser
from django.shortcuts import get_object_or_404
import requests
import json
from .models import  Profile
from django.http import JsonResponse
from social_django.utils import psa
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie 
from django.core.validators import validate_email, ValidationError
from django.utils.html import escape
import re
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from django.contrib.staticfiles.storage import staticfiles_storage
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
import base64
from io import BytesIO
from django.db import models
import os, qrcode
from .models import GameHistory
import pyotp
from .models import FriendRequest, Friendship
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .utils import generate_jwt_token, get_user_from_token, verify_jwt_token
from .decorators import jwt_login_required
import json
import urllib.parse
from django.http import HttpResponseRedirect
#security


def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, "Password is valid"

def sanitize_input(data):
    if isinstance(data, str):
        return escape(data.strip())
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(v) for v in data]
    return data



#authentication :)
@csrf_exempt
def api_signup(request):
    if request.method == 'POST':
        try:
            data = sanitize_input(json.loads(request.body))
            email = data.get('email', '').lower().strip()
            username = data.get('username', '').strip()
            password = data.get('password', '')
            if not all([email, username, password]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'All fields are required'
                }, status=400)    
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email format'
                }, status=400)   
            if CustomUser.objects.filter(email=email).exists() or SocialAccount.objects.filter(user__email=email).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email already exists'
                }, status=400)
            if len(username) < 3:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username must be at least 3 characters long'
                }, status=400)                 
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username already exists'
                }, status=400)
            is_valid_password, password_message = validate_password(password)
            if not is_valid_password:
                return JsonResponse({
                    'status': 'error',
                    'message': password_message
                }, status=400)
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            return JsonResponse({
                'status': 'success',
                'message': 'User created successfully'
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': 'An unexpected error occurred'
            }, status=500)


@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            user = authenticate(username=email, password=password)
            if user and user.is_active:
                access_token = generate_jwt_token(user, 'access')
                refresh_token = generate_jwt_token(user, 'refresh')
                login(request,user)
                return JsonResponse({
                    'status': 'success',
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': {
                        'id': user.id,
                        'email': user.email
                    }
                })
            
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid credentials'
            }, status=401)
        
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid JSON'
            }, status=400)

@csrf_exempt
def refresh_token_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh_token')
            
            payload = verify_jwt_token(refresh_token)
            if payload and payload.get('type') == 'refresh':
                user = get_user_from_token(refresh_token)
                if user:
                    new_access_token = generate_jwt_token(user, 'access')
                    return JsonResponse({
                        'status': 'success', 
                        'access_token': new_access_token
                    })
            
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid refresh token'
            }, status=401)
        
        except Exception:
            return JsonResponse({
                'status': 'error', 
                'message': 'Token refresh failed'
            }, status=400)

def api_logout(request):
    if request.method == 'POST':
        request.session.flush() 
        logout(request) 
        return JsonResponse({'status': 'success'})


@csrf_exempt
def api_profile_view(request):
    try:
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({
                'status': 'error', 
                'message': 'User not authenticated'
            }, status=401)
        
        profile = user.profile
        profile_picture = profile.get_profile_picture_url()
        level = profile.level
        
        response_data = {
            'status': 'success',
            'message': 'Access granted',
            'user_id': user.id,
            'user': {
                'username': user.username,
                'email': user.email,   
            },
            'level': level,
        }
        if profile_picture:
            if profile.fortytwo_profile_picture_url:
                response_data['profile_picture'] = profile.fortytwo_profile_picture_url
            else:
                response_data['profile_picture'] = request.build_absolute_uri(profile_picture)

        return JsonResponse(response_data)
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Profile fetch error: {str(e)}")
        
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500) 

@jwt_login_required
@csrf_exempt
def api_update_profile(request):
    if request.method == 'POST':
        try:
            user = request.user
            profile = user.profile
            username = request.POST.get('username', '').strip()
            profile_picture = request.FILES.get('profile_picture')
            if username and username != user.username:
                if CustomUser.objects.exclude(id=user.id).filter(username=username).exists():
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Username is already taken'
                    }, status=400)

                user.username = username
                user.save()
            if profile_picture:
                profile.profile_picture = profile_picture
                profile.save()
            profile_picture_url = profile.get_profile_picture_url()
            return JsonResponse({
                'status': 'success',
                'user': {
                    'username': user.username,
                    'email': user.email,
                },
                'profile_picture': profile_picture_url
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
            



@csrf_exempt
@jwt_login_required
def change_password_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            passcode = data.get('passcode')
            
            if not current_password or not new_password:
                return JsonResponse({'message': 'Missing required fields.'}, status=400)

            user = request.user
            if not user.is_authenticated:
                return JsonResponse({'message': 'User is not authenticated.'}, status=401)
            if user.profile.is_2fa_enabled:
                if not passcode:
                    return JsonResponse({'message': 'Passcode is required for 2FA.'}, status=400)
                totp = pyotp.TOTP(user.profile.otp_secret)
                if not totp.verify(passcode):
                    return JsonResponse({'message': 'Invalid 2FA passcode.'}, status=400)

            if not user.check_password(current_password):
                return JsonResponse({'message': 'Current password is incorrect.'}, status=400)

            is_valid_password, password_message = validate_password(new_password)
            if not is_valid_password:
                return JsonResponse({
                    'status': 'error',
                    'message': password_message
                }, status=400)
            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)
            return JsonResponse({'message': 'Password updated successfully.'}, status=200)
        except json.JSONDecodeError as e:
            return JsonResponse({'message': 'Invalid JSON data.'}, status=400)
    return JsonResponse({'message': 'Invalid request method.'}, status=405)



#socials

#google
@csrf_exempt
def api_google_auth_url(request):
    redirect_uri = "https://localhost:8443/accounts/api/auth/google/callback/"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        "scope=email profile"
    )
    return JsonResponse({"auth_url": auth_url})


@csrf_exempt
def google_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse({"error": "Authorization code is missing"}, status=400)
    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            "client_secret": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "https://localhost:8443/accounts/api/auth/google/callback/",
        },
    )
    token_data = token_response.json()

    if "access_token" not in token_data:
        return JsonResponse({"error": "Failed to exchange code for token"}, status=400)
    user_info_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
    )
    user_data = user_info_response.json()

    if "email" not in user_data:
        return JsonResponse({"error": "Failed to fetch user info"}, status=400)
    email = user_data["email"]
    username = user_data.get("name", email.split("@")[0])  
    profile_picture_url= user_data.get("picture")

    
    user, created = CustomUser.objects.get_or_create(
        email=email,
        defaults={"username": username},
    )
    profile, _ = Profile.objects.get_or_create(user=user)

    if profile_picture_url:

        response = requests.get(profile_picture_url)
        if response.status_code == 200:

            profile.profile_picture.save(
                f"{username}_profile.jpg",  
                ContentFile(response.content),  #
                save=True
            )

    login(request, user)
    return redirect('/#dashboard')


# # 42
def login_with_42(request):
    auth_url = f"{settings.THIRTYTWO_AUTHORIZATION_URL}?client_id={settings.THIRTYTWO_CLIENT_ID}&redirect_uri={settings.THIRTYTWO_REDIRECT_URI}&response_type=code"
    return JsonResponse({'auth_url': auth_url})

def callback_from_42(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'status': 'error', 'message': 'Authorization code not provided'}, status=400)

    token_response = requests.post(settings.THIRTYTWO_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'client_id': settings.THIRTYTWO_CLIENT_ID,
        'client_secret': settings.THIRTYTWO_CLIENT_SECRET,
        'code': code,
        'redirect_uri': settings.THIRTYTWO_REDIRECT_URI,
    })
    if token_response.status_code != 200:
        return JsonResponse({'status': 'error', 'message': 'Failed to retrieve access token'}, status=400)

    access_token = token_response.json().get('access_token')


    user_info_response = requests.get(settings.THIRTYTWO_USER_INFO_URL, headers={
        'Authorization': f'Bearer {access_token}',
    })
    if user_info_response.status_code != 200:
        return JsonResponse({'status': 'error', 'message': 'Failed to fetch user info'}, status=400)

    user_data = user_info_response.json()
    email = user_data.get('email')
    username = user_data.get('login')
    profile_picture_url = user_data.get('image', {}).get('link')  

    if not email or not username:
        return JsonResponse({'status': 'error', 'message': 'Incomplete user data'}, status=400)
    user, created = CustomUser.objects.get_or_create(
        email=email,
        defaults={'username': username}
    )


    profile, created = Profile.objects.get_or_create(user=user)
    

    if profile_picture_url:
        profile.fortytwo_profile_picture_url = profile_picture_url
        profile.save()

    login(request, user)
    return redirect('/#dashboard')


@csrf_exempt
def check_auth(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            return JsonResponse({
                'isAuthenticated': True,
                'user': {
                    'id': request.user.id,
                    'email': request.user.email
                }
            })
        return JsonResponse({'isAuthenticated': False}, status=401)


#######2fa
@csrf_exempt
def disable_2fa_view(request):
    if request.method == 'POST':
        user = request.user

        if not user.profile.is_2fa_enabled:
            return JsonResponse({'message': '2FA is not enabled for this account.'}, status=400)

        user.profile.is_2fa_enabled = False
        user.profile.otp_secret = None  # hadi nqdr nhydha apres
        user.profile.save()

        return JsonResponse({'message': '2FA disabled successfully.'})

    return JsonResponse({'message': 'Invalid request method.'}, status=405)



def check_2fa_status_view(request):
    is_2fa_enabled = request.user.profile.is_2fa_enabled
    return JsonResponse({'is_2fa_enabled': is_2fa_enabled})


@csrf_exempt
def verify_2fa_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            passcode = data.get('passcode')

            if not passcode:
                return JsonResponse({'message': 'Passcode is required.'}, status=400)

            user = request.user
            if not user.profile.is_2fa_enabled:
                return JsonResponse({'message': '2FA is not enabled.'}, status=400)

            totp = pyotp.TOTP(user.profile.otp_secret)
            if totp.verify(passcode):
                return JsonResponse({'message': 'Verification successful.'})
            else:
                return JsonResponse({'message': 'Invalid passcode.'}, status=400)
        except Exception as e:
            return JsonResponse({'message': 'An error occurred: ' + str(e)}, status=500)
    
    return JsonResponse({'message': 'Invalid request method.'}, status=405)

@csrf_exempt
def get_2fa_qr_view(request):
    user = request.user
    if not hasattr(user.profile, 'otp_secret') or not user.profile.otp_secret:

        user.profile.otp_secret = pyotp.random_base32()
        user.profile.save()

    totp = pyotp.TOTP(user.profile.otp_secret)
    uri = totp.provisioning_uri(user.username, issuer_name="MySecureApp")

    img = qrcode.make(uri)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    response = JsonResponse({'qr_code_url': 'data:image/png;base64,' + base64.b64encode(buffer.read()).decode()})
    return response

@csrf_exempt
def enable_2fa_view(request):
    if request.method == 'POST':
        import pyotp
        import json

        data = json.loads(request.body)
        passcode = data.get('passcode')

        if not passcode:
            return JsonResponse({'message': 'Passcode is required.'}, status=400)

        user = request.user
        totp = pyotp.TOTP(user.profile.otp_secret)
        if user.profile.is_2fa_enabled == True:
            return JsonResponse({'message': 'already enabled.'}, status=400)
        if totp.verify(passcode):
            user.profile.is_2fa_enabled = True
            user.profile.save()
            return JsonResponse({'message': '2FA enabled successfully.'})
        else:
            return JsonResponse({'message': 'Invalid passcode.'}, status=400)




#dashboard
def leaderboard(request):
    profiles = Profile.objects.all().order_by('-xp')
    leaderboard_data = []
    
    for profile in profiles:
        leaderboard_data.append({
            'username': profile.user.username,
            'avatar': profile.get_profile_picture_url(),
            'xp': profile.xp
        })
    
    return JsonResponse(leaderboard_data, safe=False)


def stats(request):
    profile = request.user.profile
    
    stats_data = {
        'level': profile.level,
        'winRate': profile.win_rate,
        'loseRate': profile.lose_rate
    }
    
    return JsonResponse(stats_data)


def game_history(request):
    user = request.user
    game_history = GameHistory.objects.filter(user=user).order_by('-time')

    game_history_data = []
    for game in game_history:
        game_data = {
            'username': game.user.username,
            'userAvatar': game.get_user_avatar_url(),
            'time': game.time.strftime('%Y-%m-%d %H:%M:%S'), 
            'type': game.game_type,
            'status': game.status
        }
        game_history_data.append(game_data)

    return JsonResponse(game_history_data, safe=False)


@csrf_exempt
def delete_account(request):
    if request.method == 'DELETE':
        try:
            user = request.user
            if user.profile.is_2fa_enabled:
                data = json.loads(request.body)
                passcode = data.get('passcode')

                if not passcode:
                    return JsonResponse({'message': '2FA passcode is required.'}, status=400)

                totp = pyotp.TOTP(user.profile.otp_secret)
                if not totp.verify(passcode):
                    return JsonResponse({'message': 'Invalid 2FA passcode.'}, status=400)
            user.delete()
            logout(request) 
            return JsonResponse({'message': 'Account deleted successfully.'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON data.'}, status=400)
        except Exception as e:
            return JsonResponse({'message': f'An error occurred: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Invalid request method.'}, status=405)




User = get_user_model()

@csrf_exempt
def accept_friend_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            if not username:
                return JsonResponse({'message': 'Username is required'}, status=400)
            
            sender = User.objects.get(username=username)
            friend_request = FriendRequest.objects.get(sender=sender, receiver=request.user, status='pending')
            friend_request.status = 'accepted'
            friend_request.save()
            Friendship.objects.create(user1=friend_request.sender, user2=friend_request.receiver)
            return JsonResponse({'message': 'Friend request accepted'})
        except User.DoesNotExist:
            return JsonResponse({'message': 'User does not exist'}, status=404)
        except FriendRequest.DoesNotExist:
            return JsonResponse({'message': 'Friend request does not exist'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON payload'}, status=400)
    return JsonResponse({'message': 'Invalid method'}, status=405)


@csrf_exempt
def reject_friend_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            if not username:
                return JsonResponse({'message': 'Username is required'}, status=400)
            
            sender = User.objects.get(username=username)
            friend_request = FriendRequest.objects.get(sender=sender, receiver=request.user, status='pending')
            friend_request.status = 'rejected'
            friend_request.save()
            return JsonResponse({'message': 'Friend request rejected'})
        except User.DoesNotExist:
            return JsonResponse({'message': 'User does not exist'}, status=404)
        except FriendRequest.DoesNotExist:
            return JsonResponse({'message': 'Friend request does not exist'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON payload'}, status=400)
    return JsonResponse({'message': 'Invalid method'}, status=405)


@csrf_exempt
def get_friend_requests(request):
    if request.method == 'GET':
        friend_requests = FriendRequest.objects.filter(receiver=request.user, status='pending')
        data = [{'username': fr.sender.username} for fr in friend_requests]
        return JsonResponse(data, safe=False)
    
    return JsonResponse({'message': 'Invalid method'}, status=405)


@csrf_exempt
def add_friend(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')

            if not username:
                return JsonResponse({'error': 'Username is required'}, status=400)

            receiver = User.objects.get(username=username)

            if receiver == request.user:
                return JsonResponse({'error': 'You cannot send a friend request to yourself'}, status=400)

            if FriendRequest.objects.filter(sender=request.user, receiver=receiver, status='pending').exists():
                return JsonResponse({'error': 'Friend request already sent'}, status=400)

            if Friendship.objects.filter(user1=request.user, user2=receiver).exists() or \
               Friendship.objects.filter(user1=receiver, user2=request.user).exists():
                return JsonResponse({'error': 'You are already friends'}, status=400)

            FriendRequest.objects.create(sender=request.user, receiver=receiver, status='pending')
            return JsonResponse({'message': 'Friend request sent successfully'}, status=200)

        except User.DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    return JsonResponse({'error': 'Invalid method'}, status=405)


@csrf_exempt
def get_friends(request):
    if request.method == 'GET':
        friendships = Friendship.objects.filter(user1=request.user) | Friendship.objects.filter(user2=request.user)
        friends = []
        for friendship in friendships:
            friend = friendship.user2 if friendship.user1 == request.user else friendship.user1
            friends.append({
                'username': friend.username,
                'is_online': friend.profile.is_online,
            })

        return JsonResponse({'friends': friends})
    return JsonResponse({'error': 'Invalid method'}, status=405)

User = get_user_model()



@csrf_exempt
def api_user_profile_view(request, username):
    try:
        user = User.objects.filter(username=username).first()
        if not user:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)
        current_user = request.user
        is_self = (current_user == user)
        profile = user.profile
        profile_picture = profile.get_profile_picture_url()
        level = profile.level
        is_friend = Friendship.objects.filter(
            (models.Q(user1=current_user, user2=user) |
             models.Q(user1=user, user2=current_user))
        ).exists()
        response_data = {
            
            'status': 'success',
            'user': {
                'username': user.username,
                'email': user.email,
            },
            'level': level,
            'is_friend': is_friend, 
            'is_self': is_self,

        }

        if profile_picture:
            if profile.fortytwo_profile_picture_url:
                response_data['profile_picture'] = profile.fortytwo_profile_picture_url
            else:
                response_data['profile_picture'] = request.build_absolute_uri(profile_picture)

        return JsonResponse(response_data)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"User profile fetch error: {str(e)}")

        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@require_http_methods(["POST"])
@ensure_csrf_cookie
def add_friend1(request, username):
    try:
        sender = request.user
        receiver = get_object_or_404(User, username=username)
        
        if sender == receiver:
            return JsonResponse({'error': "You can't send a friend request to yourself."}, status=400)
            
        if FriendRequest.objects.filter(sender=sender, receiver=receiver).exists():
            return JsonResponse({'error': "Friend request already sent."}, status=400)
            
        if FriendRequest.objects.filter(sender=receiver, receiver=sender).exists():
            return JsonResponse({'error': "You already have a friend request from this user."}, status=400)
            
        FriendRequest.objects.create(sender=request.user, receiver=receiver, status='pending') 
        return JsonResponse({'message': 'Friend request sent successfully!'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

