from functools import wraps
from django.http import JsonResponse
from .utils import verify_jwt_token, get_user_from_token
from django.contrib.auth import get_user_model

User = get_user_model()
def jwt_login_required(view_func):
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({
                'status': 'error', 
                'message': 'Authentication token required'
            }, status=401)
        try:
            token = auth_header.split('Bearer ')[1].strip()
            payload = verify_jwt_token(token)
            
            if not payload:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Invalid or expired token'
                }, status=401)
            user = User.objects.get(id=payload['user_id'])
            request.user = user
            
            return view_func(request, *args, **kwargs)
        
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error', 
                'message': 'User not found'
            }, status=401)
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': 'Authentication failed'
            }, status=401)
    
    return wrapper