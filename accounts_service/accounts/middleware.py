from django.utils.timezone import now
from accounts.models import Profile  

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            profile, created = Profile.objects.get_or_create(user=request.user)
            profile.last_seen = now()
            profile.save()
        return self.get_response(request)
