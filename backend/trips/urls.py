from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverRegistration, TripViewSet, LogViewSet, UserLogin

router = DefaultRouter()
router.register(r'trips', TripViewSet)
router.register(r'trips/(?P<trip_pk>\d+)/logs', LogViewSet, basename='log')

urlpatterns = [
    path('', include(router.urls)),
]