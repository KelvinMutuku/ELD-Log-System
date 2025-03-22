from rest_framework import viewsets
from .models import Trip, Log
from .serializers import TripSerializer, LogSerializer

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().order_by('-created_at')
    serializer_class = TripSerializer

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all().order_by('-date')
    serializer_class = LogSerializer