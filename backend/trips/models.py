from django.db import models

class Trip(models.Model):
    current_location = models.CharField(max_length=255, help_text="Driver's current location (e.g., City, State)")
    pickup_location = models.CharField(max_length=255, help_text="Pickup location (e.g., Warehouse address)")
    dropoff_location = models.CharField(max_length=255, help_text="Dropoff location (e.g., Customer address)")
    current_cycle_used = models.FloatField(help_text="Current cycle hours used (70-hour/8-day rule)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.pickup_location} to {self.dropoff_location}"


class Log(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField(help_text="Log date (YYYY-MM-DD)")
    total_miles = models.FloatField(help_text="Total miles driven today")
    driving_time = models.FloatField(help_text="Total driving time (hours)")
    on_duty_time = models.FloatField(help_text="On-duty not driving time (hours)")
    off_duty_time = models.FloatField(help_text="Off-duty time (hours)")
    rest_breaks = models.FloatField(default=0.5, help_text="30-minute rest breaks (count)")

    def __str__(self):
        return f"Log for {self.date} (Trip ID: {self.trip.id})"