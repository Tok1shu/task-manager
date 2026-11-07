from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Task

User = get_user_model()


class TaskUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
        read_only_fields = ('id', 'username')


class TaskProjectSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)


class TaskSerializer(serializers.ModelSerializer):
    project = serializers.UUIDField(source='project_id', read_only=True)
    author = TaskUserSerializer(read_only=True)
    assignee = TaskUserSerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id',
            'project',
            'title',
            'description',
            'author',
            'assignee',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'created_at',
            'updated_at',
            'comments_count',
            'permissions',
        )
        read_only_fields = (
            'id',
            'project',
            'author',
            'assignee',
            'is_overdue',
            'created_at',
            'updated_at',
            'comments_count',
            'permissions',
        )

    def get_is_overdue(self, obj):
        if not obj.due_date or obj.status == Task.STATUS_DONE:
            return False
        return obj.due_date < timezone.localdate()

    def get_comments_count(self, obj):
        if hasattr(obj, 'comments'):
            return obj.comments.count()
        return 0

    def get_permissions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {
                'can_edit': False,
                'can_delete': False,
                'can_change_status': False,
            }
        user = request.user
        is_owner = obj.project.owner_id == user.id
        is_author = obj.author_id == user.id
        is_assignee = obj.assignee_id == user.id

        return {
            'can_edit': is_owner or is_author or is_assignee,
            'can_delete': is_owner,
            'can_change_status': is_owner or is_assignee,
        }


class MyTaskSerializer(TaskSerializer):
    project = TaskProjectSerializer(read_only=True)


class TaskCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=3, max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        default=None,
    )
    status = serializers.ChoiceField(
        choices=Task.STATUS_CHOICES,
        required=False,
        default=Task.STATUS_TODO,
    )
    priority = serializers.ChoiceField(
        choices=Task.PRIORITY_CHOICES,
        required=False,
        default=Task.PRIORITY_MEDIUM,
    )
    due_date = serializers.DateField(required=False, allow_null=True, default=None)

    class Meta:
        model = Task
        fields = (
            'id',
            'title',
            'description',
            'assignee',
            'status',
            'priority',
            'due_date',
        )
        read_only_fields = ('id',)

    def validate_title(self, value):
        val = value.strip()
        if len(val) < 3 or len(val) > 150:
            raise serializers.ValidationError('Название должно быть от 3 до 150 символов')
        return val

    def validate_assignee(self, value):
        if value is None:
            return None
        project = self.context['project']
        if value.id != project.owner_id and not project.members.filter(pk=value.pk).exists():
            raise serializers.ValidationError('Исполнитель должен быть участником проекта')
        return value


class TaskStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)

    class Meta:
        model = Task
        fields = ('status',)
