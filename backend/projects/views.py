from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, ProjectMember
from .serializers import (
    MemberAddSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
)

User = get_user_model()


def get_project_for_user(project_id, user):
    try:
        project = (
            Project.objects.select_related('owner')
            .prefetch_related('members')
            .get(pk=project_id)
        )
    except (Project.DoesNotExist, ValueError):
        raise Http404

    if project.owner_id != user.id and not any(m.id == user.id for m in project.members.all()):
        raise Http404

    return project


class ProjectListCreateView(APIView):
    def get(self, request, **kwargs):
        projects = (
            Project.objects.filter(Q(owner=request.user) | Q(members=request.user))
            .distinct()
            .select_related('owner')
            .prefetch_related('members')
            .order_by('-created_at')
        )
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(projects, request)
        if page is not None:
            serializer = ProjectListSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = ProjectListSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, **kwargs):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(owner=request.user)
        return Response(
            ProjectDetailSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    def get(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)

    def patch(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        if project.owner_id != request.user.id:
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectCreateSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)

    def delete(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        if project.owner_id != request.user.id:
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectStatsView(APIView):
    def get(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        try:
            task_model = apps.get_model('tasks', 'Task')
        except (LookupError, ValueError):
            task_model = None

        if task_model is None or not hasattr(task_model, 'objects'):
            return Response(
                {
                    'total': 0,
                    'todo': 0,
                    'in_progress': 0,
                    'done': 0,
                    'overdue': 0,
                    'done_percent': 0.0,
                }
            )

        today = timezone.localdate()
        stats = task_model.objects.filter(project=project).aggregate(
            total=Count('id'),
            todo=Count('id', filter=Q(status='todo')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            done=Count('id', filter=Q(status='done')),
            overdue=Count('id', filter=Q(due_date__isnull=False, due_date__lt=today) & ~Q(status='done')),
        )
        total = stats['total'] or 0
        todo = stats['todo'] or 0
        in_progress = stats['in_progress'] or 0
        done = stats['done'] or 0
        overdue = stats['overdue'] or 0
        done_percent = round((done / total) * 100, 1) if total > 0 else 0.0

        return Response(
            {
                'total': total,
                'todo': todo,
                'in_progress': in_progress,
                'done': done,
                'overdue': overdue,
                'done_percent': done_percent,
            }
        )


class MemberAddView(APIView):
    def post(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        if project.owner_id != request.user.id:
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
        serializer = MemberAddSerializer(data=request.data, context={'project': project})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'id': str(user.id), 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class MemberRemoveView(APIView):
    def delete(self, request, project_id, user_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        if project.owner_id != request.user.id:
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)

        if str(project.owner_id) == str(user_id):
            return Response(
                {'detail': 'Владельца нельзя исключить из проекта'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership = ProjectMember.objects.filter(project=project, user_id=user_id).first()
        if membership is None:
            return Response({'detail': 'Участник не найден'}, status=status.HTTP_404_NOT_FOUND)

        try:
            task_model = apps.get_model('tasks', 'Task')
        except (LookupError, ValueError):
            task_model = None

        if task_model is not None and hasattr(task_model, 'objects'):
            task_model.objects.filter(project=project, assignee_id=user_id).update(assignee=None)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
