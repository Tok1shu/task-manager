from django.urls import path

from . import views

urlpatterns = [
    path('projects/<uuid:project_id>/tasks/', views.ProjectTaskListCreateView.as_view(), name='project-task-list'),
    path('tasks/<uuid:task_id>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<uuid:task_id>/status/', views.TaskStatusView.as_view(), name='task-status'),
]
