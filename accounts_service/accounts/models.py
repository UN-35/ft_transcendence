from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.templatetags.static import static
from django.contrib.auth.models import  BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.utils.timezone import now, timedelta
from django.db import models
from django.contrib.auth.models import User


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)
    # class Meta:
    #     db_table = 'customusermanager'




class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', default='profile_pics/default_avatar.png')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    friends = models.ManyToManyField("self", symmetrical=True, blank=True)
    is_online = models.BooleanField(default=False)

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    def __str__(self):
        return self.email
    # class Meta:
    #     db_table = 'customuser'



class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    fortytwo_profile_picture_url = models.URLField(max_length=500, blank=True, null=True)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    level = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)
    games_won = models.PositiveIntegerField(default=0)
    games_lost = models.PositiveIntegerField(default=0)
    games_played = models.PositiveIntegerField(default=0)
    last_seen = models.DateTimeField(null=True, blank=True)

    
    
    def get_profile_picture_url(self):
        base_url = "https://localhost:8443"
        if self.fortytwo_profile_picture_url:
            return self.fortytwo_profile_picture_url  
        else:
            if self.profile_picture:
                return f"{base_url}{settings.MEDIA_URL}{self.profile_picture.name}"
            else:
                return f"{base_url}/img/avatar2.jpeg"
    @property
    def is_online(self):
        return self.last_seen and (now() - self.last_seen) < timedelta(minutes=5)   
    @property
    def win_rate(self):
        if self.games_played == 0:
            return 0
        return round((self.games_won / self.games_played) * 100, 1)

    @property
    def lose_rate(self):
        if self.games_played == 0:
            return 0
        return round((self.games_lost / self.games_played) * 100, 1)

    def record_game_result(self, won=True):
        self.games_played += 1
        if won:
            self.games_won += 1
            self.add_xp(100)
        else:
            self.games_lost += 1
        self.save()

    def add_xp(self, amount):
        self.xp += amount
        self.level = round(self.xp / 1000, 2)
        self.save()

    def __str__(self):
        return f"{self.user.username}'s Profile"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


@receiver(user_logged_in)
def set_user_online(sender, request, user, **kwargs):
    user.is_online = True
    user.save()

@receiver(user_logged_out)
def set_user_offline(sender, request, user, **kwargs):
    user.is_online = False
    user.save()

class GameHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    time = models.DateTimeField(auto_now_add=True)
    game_type = models.CharField(max_length=100)  
    status = models.CharField(max_length=50)     
    
    def __str__(self):
        return f'{self.user.username} - {self.game_type} - {self.status}'

    def get_user_avatar_url(self):
        return self.user.profile.get_profile_picture_url() 



class FriendRequest(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')  

class Friendship(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='friendship_user1')
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='friendship_user2')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')  
