from django.urls import path
from apps.core.views.log_views import ErrorLogViewSet

urlpatterns = [
    path('', ErrorLogViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<pk>/', ErrorLogViewSet.as_view({'delete': 'destroy'})),
]
