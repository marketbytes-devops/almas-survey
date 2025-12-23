from django.urls import path
from . import views

urlpatterns = [
    path('enquiries/', views.EnquiryListCreate.as_view(), name='enquiry-list-create'),
    path('enquiries/<int:pk>/', views.EnquiryRetrieveUpdate.as_view(), name='enquiry-retrieve-update'),
    path('enquiries/<int:pk>/delete/', views.EnquiryDelete.as_view(), name='enquiry-delete'),
    path('enquiries/delete/all/', views.EnquiryDeleteAll.as_view(), name='enquiry-delete-all'),
    path('enquiries/<int:pk>/schedule/', views.EnquirySchedule.as_view(), name='enquiry-schedule'),
    path('enquiries/<int:pk>/cancel-survey/', views.EnquiryCancelSurvey.as_view(), name='enquiry-cancel-survey'),
]