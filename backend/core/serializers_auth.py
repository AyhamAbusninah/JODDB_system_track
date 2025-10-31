# core/serializers_auth.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user data in the response
    """
    def validate(self, attrs):
        # Get the default token response
        data = super().validate(attrs)
        
        # Add user information to the response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view that uses our custom serializer
    """
    serializer_class = CustomTokenObtainPairSerializer
