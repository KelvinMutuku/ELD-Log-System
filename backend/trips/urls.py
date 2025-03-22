from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet, LogViewSet

router = DefaultRouter()
router.register(r'trips', TripViewSet)
router.register(r'logs', LogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]