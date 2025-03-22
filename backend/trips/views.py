from django.shortcuts import render
from rest_framework import viewsets
from .models import Trip, Log
from .serializers import TripSerializer, LogSerializer

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer

# Create your views here.
