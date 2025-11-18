from django.urls import path
from . import views

urlpatterns = [
    path('enquiries/', views.EnquiryListCreate.as_view()),
    path('enquiries/<int:pk>/', views.EnquiryRetrieveUpdateDestroy.as_view()),
    path('enquiries/<int:pk>/schedule/', views.EnquirySchedule.as_view()),
    path('enquiries/<int:pk>/cancel-survey/', views.EnquiryCancelSurvey.as_view()),
]