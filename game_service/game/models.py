from django.db import models
from pathlib import Path
from django.contrib.auth.models import  BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.models import User
from accounts.models import CustomUser

# class CustomUserManager(BaseUserManager):
#     def create_user(self, email, username, password=None, **extra_fields):
#         if not email:
#             raise ValueError('The Email field must be set')
#         email = self.normalize_email(email)
#         user = self.model(email=email, username=username, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, username, password=None, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)

#         if extra_fields.get('is_staff') is not True:
#             raise ValueError('Superuser must have is_staff=True.')
#         if extra_fields.get('is_superuser') is not True:
#             raise ValueError('Superuser must have is_superuser=True.')

#         return self.create_user(email, username, password, **extra_fields)
#     class Meta:
#         db_table = 'customusermanager'

# class CustomUser(AbstractBaseUser, PermissionsMixin):
#     email = models.EmailField(unique=True)
#     username = models.CharField(max_length=150, unique=True)
#     profile_picture = models.ImageField(upload_to='profile_pics/', default='profile_pics/default_avatar.png')
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     friends = models.ManyToManyField("self", symmetrical=True, blank=True)
#     is_online = models.BooleanField(default=False)

#     objects = CustomUserManager()
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['username']
#     def __str__(self):
#         return self.email
#     class Meta:
#         db_table = 'customuser'


class GameSession(models.Model) :
    player1 = models.ForeignKey(CustomUser, related_name='player1_game', on_delete=models.CASCADE)
    player2 = models.ForeignKey(CustomUser, related_name='player2_game', on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('waiting', 'Waiting for Player'),
        ('in_progress', 'Game in Progress'),
        ('complete', 'Game Completed')
    ])
    winner = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

