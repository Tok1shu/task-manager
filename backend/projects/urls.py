from django.urls import path

from . import views

urlpatterns = [
    path('projects/', views.ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<uuid:project_id>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<uuid:project_id>/stats/', views.ProjectStatsView.as_view(), name='project-stats'),
    path('projects/<uuid:project_id>/members/', views.MemberAddView.as_view(), name='project-member-add'),
    path('projects/<uuid:project_id>/members/<uuid:user_id>/', views.MemberRemoveView.as_view(), name='project-member-remove'),
]
