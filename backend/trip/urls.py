from django.urls import path
from .views import TripView, health_check

urlpatterns = [
    path("trip/", TripView.as_view(), name="trip"),
    path("health/", health_check, name="health"),
]
