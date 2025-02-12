import jwt
import os
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

def generate_jwt_token(user, token_type='access'):
    """
    Generate JWT token with configurable expiration
    """
    secret_key = settings.SECRET_KEY
    expiration = {
        'access': timedelta(minutes=30),
        'refresh': timedelta(days=7)
    }
    
    payload = {
        'user_id': user.id,
        'email': user.email,
        'type': token_type,
        'exp': datetime.utcnow() + expiration[token_type]
    }
    
    return jwt.encode(payload, secret_key, algorithm='HS256')

def verify_jwt_token(token):
    """
    Validate JWT token and return payload
    """
    try:
        secret_key = settings.SECRET_KEY
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        if payload.get('type') not in ['access', 'refresh']:
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_token(token):
    """
    Retrieve user from valid JWT token
    """
    payload = verify_jwt_token(token)
    if payload:
        try:
            return User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return None
    return None
