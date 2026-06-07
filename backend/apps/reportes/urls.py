from django.urls import path
from .views import DashboardAPIView, ReportesAvanzadosAPIView

urlpatterns = [
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard-stats'),
    path('avanzados/', ReportesAvanzadosAPIView.as_view(), name='reportes-avanzados'),
]
