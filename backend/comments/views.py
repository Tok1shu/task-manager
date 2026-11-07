from django.http import Http404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.views import get_task_for_user
from .models import Comment
from .serializers import CommentCreateSerializer, CommentSerializer


class CommentListCreateView(APIView):
    def get(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        comments = (
            Comment.objects.filter(task=task)
            .select_related('author', 'task__project', 'task__project__owner')
            .order_by('created_at')
        )
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(comments, request)
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, task_id, **kwargs):
        task = get_task_for_user(task_id, request.user)
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task, author=request.user)
        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class CommentDeleteView(APIView):
    def delete(self, request, comment_id, **kwargs):
        try:
            comment = (
                Comment.objects.select_related(
                    'author', 'task__project', 'task__project__owner'
                )
                .prefetch_related('task__project__members')
                .get(pk=comment_id)
            )
        except (Comment.DoesNotExist, ValueError):
            raise Http404

        project = comment.task.project
        if project.owner_id != request.user.id and not any(
            m.id == request.user.id for m in project.members.all()
        ):
            raise Http404

        is_author = comment.author_id == request.user.id
        is_project_owner = project.owner_id == request.user.id
        if not (is_author or is_project_owner):
            return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
