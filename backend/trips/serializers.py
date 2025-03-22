from rest_framework import serializers
from .models import Trip, Log
from .models import Driver

class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'
        
class DriverRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Driver
        fields = ('username', 'password', 'email', 'license_number', 'company', 'phone')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Driver.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            license_number=validated_data['license_number'],
            company=validated_data.get('company', ''),
            phone=validated_data['phone']
        )
        return user