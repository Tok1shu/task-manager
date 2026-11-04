from django.urls import path

from . import views

urlpatterns = [
    path('tasks/<uuid:task_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list'),
    path('comments/<uuid:comment_id>/', views.CommentDeleteView.as_view(), name='comment-delete'),
]
