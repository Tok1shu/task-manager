from django.conf import settings
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import ProfileSerializer, RegisterSerializer


def set_refresh_cookie(response, token):
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        token,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        httponly=True,
        samesite='Strict',
        secure=not settings.DEBUG,
        path=settings.REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response):
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        samesite='Strict',
    )


def unauthorized_and_clear_cookie():
    response = Response({'detail': 'Сессия истекла'}, status=status.HTTP_401_UNAUTHORIZED)
    clear_refresh_cookie(response)
    return response


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'id': str(user.id), 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, **kwargs):
        user = authenticate(
            request,
            username=request.data.get('username'),
            password=request.data.get('password'),
        )
        if user is None:
            return Response(
                {'detail': 'Неверное имя пользователя или пароль'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        response = Response({'access': str(refresh.access_token)})
        set_refresh_cookie(response, str(refresh))
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, **kwargs):
        serializer = TokenRefreshSerializer(
            data={'refresh': request.COOKIES.get(settings.REFRESH_COOKIE_NAME, '')}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, ValidationError):
            return unauthorized_and_clear_cookie()
        response = Response({'access': serializer.validated_data['access']})
        set_refresh_cookie(response, serializer.validated_data['refresh'])
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, **kwargs):
        token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    def get(self, request, **kwargs):
        return Response(ProfileSerializer(request.user).data)

    def patch(self, request, **kwargs):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyTasksView(APIView):
    def get(self, request, **kwargs):
        from projects.models import Project
        from tasks.models import Task
        from tasks.serializers import MyTaskSerializer
        from tasks.views import apply_task_filters, apply_task_ordering

        user_projects = Project.objects.filter(
            Q(owner=request.user) | Q(members=request.user)
        ).values_list('id', flat=True)

        tasks = Task.objects.filter(
            assignee=request.user,
            project_id__in=user_projects,
        ).select_related('project', 'author', 'assignee')

        tasks = apply_task_filters(tasks, request.query_params)
        tasks = apply_task_ordering(tasks, request.query_params.get('ordering', '-created_at'))

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(tasks, request)
        if page is not None:
            serializer = MyTaskSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = MyTaskSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
