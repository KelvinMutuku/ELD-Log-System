from rest_framework import viewsets
from .models import Driver, Trip, Log
from .serializers import TripSerializer, LogSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import generics
from .serializers import DriverRegistrationSerializer
from rest_framework import viewsets
from .models import Trip, Log
from .serializers import TripSerializer, LogSerializer

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().order_by('-created_at')
    serializer_class = TripSerializer

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all().order_by('-date')
    serializer_class = LogSerializer


class UserLogin(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'is_admin': user.is_staff
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
class DriverRegistration(generics.CreateAPIView):
    serializer_class = DriverRegistrationSerializer
    queryset = Driver.objects.all()
    
class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer

    def get_queryset(self):
        return self.queryset.filter(trip=self.kwargs['trip_pk'])