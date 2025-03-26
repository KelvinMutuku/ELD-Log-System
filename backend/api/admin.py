from django.contrib import admin
from .models import Driver

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'license_number', 'current_location', 'pickup_location', 'dropoff_location', 'current_cycle_used')
    search_fields = ('first_name', 'last_name', 'license_number')
