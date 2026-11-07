from django.db.models import Case, F, IntegerField, Value, When
from django.http import Http404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.views import get_project_for_user
from .models import Task
from .serializers import TaskCreateSerializer, TaskSerializer, TaskStatusSerializer


def apply_task_ordering(queryset, ordering_param):
    if ordering_param == 'priority':
        return queryset.annotate(
            priority_weight=Case(
                When(priority=Task.PRIORITY_LOW, then=Value(1)),
                When(priority=Task.PRIORITY_MEDIUM, then=Value(2)),
                When(priority=Task.PRIORITY_HIGH, then=Value(3)),
                default=Value(2),
                output_field=IntegerField(),
            )
        ).order_by('priority_weight', '-created_at')

    if ordering_param == '-priority':
        return queryset.annotate(
            priority_weight=Case(
                When(priority=Task.PRIORITY_LOW, then=Value(1)),
                When(priority=Task.PRIORITY_MEDIUM, then=Value(2)),
                When(priority=Task.PRIORITY_HIGH, then=Value(3)),
                default=Value(2),
                output_field=IntegerField(),
            )
        ).order_by('-priority_weight', '-created_at')

    if ordering_param == 'due_date':
        return queryset.order_by(F('due_date').asc(nulls_last=True), '-created_at')

    if ordering_param == '-due_date':
        return queryset.order_by(F('due_date').desc(nulls_last=True), '-created_at')

    if ordering_param == 'created_at':
        return queryset.order_by('created_at')

    return queryset.order_by('-created_at')


def apply_task_filters(queryset, params):
    search_query = params.get('search')
    if search_query:
        queryset = queryset.filter(title__icontains=search_query.strip())

    status_filter = params.get('status')
    if status_filter in dict(Task.STATUS_CHOICES):
        queryset = queryset.filter(status=status_filter)

    priority_filter = params.get('priority')
    if priority_filter in dict(Task.PRIORITY_CHOICES):
        queryset = queryset.filter(priority=priority_filter)

    assignee_filter = params.get('assignee')
    if assignee_filter == 'none':
        queryset = queryset.filter(assignee__isnull=True)
    elif assignee_filter:
        queryset = queryset.filter(assignee_id=assignee_filter)

    return queryset


def get_task_for_user(task_id, user):
    try:
        task = (
            Task.objects.select_related('project', 'project__owner', 'author', 'assignee')
            .prefetch_related('project__members')
            .get(pk=task_id)
        )
    except (Task.DoesNotExist, ValueError):
        raise Http404

    project = task.project
    if project.owner_id != user.id and not any(m.id == user.id for m in project.members.all()):
        raise Http404

    return task


class ProjectTaskListCreateView(APIView):
    def get(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        tasks = Task.objects.filter(project=project).select_related(
            'project', 'project__owner', 'author', 'assignee'
        )
        tasks = apply_task_filters(tasks, request.query_params)
        tasks = apply_task_ordering(tasks, request.query_params.get('ordering', '-created_at'))

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(tasks, request)
        if page is not None:
            serializer = TaskSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = TaskSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, project_id, **kwargs):
        project = get_project_for_user(project_id, request.user)
        serializer = TaskCreateSerializer(
            data=request.data,
            context={'project': project, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save(project=project, author=request.user)
        return Response(
            TaskSerializer(task, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class TaskDetailView(APIView):
    def get(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        return Response(TaskSerializer(task, context={'request': request}).data)

    def patch(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        is_owner = task.project.owner_id == request.user.id
        is_author = task.author_id == request.user.id
        is_assignee = task.assignee_id == request.user.id

        if not (is_owner or is_author or is_assignee):
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskCreateSerializer(
            task,
            data=request.data,
            partial=True,
            context={'project': task.project, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task, context={'request': request}).data)

    def delete(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        if task.project.owner_id != request.user.id:
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatusView(APIView):
    def patch(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        is_owner = task.project.owner_id == request.user.id
        is_assignee = task.assignee_id == request.user.id

        if not (is_owner or is_assignee):
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskStatusSerializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task, context={'request': request}).data)
