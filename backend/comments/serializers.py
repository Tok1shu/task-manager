from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment

User = get_user_model()


class CommentAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
        read_only_fields = ('id', 'username')


class CommentSerializer(serializers.ModelSerializer):
    task = serializers.UUIDField(source='task_id', read_only=True)
    author = CommentAuthorSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id',
            'task',
            'author',
            'text',
            'created_at',
            'permissions',
        )
        read_only_fields = (
            'id',
            'task',
            'author',
            'created_at',
            'permissions',
        )

    def get_permissions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {'can_delete': False}
        user = request.user
        can_delete = bool(
            obj.author_id == user.id or obj.task.project.owner_id == user.id
        )
        return {'can_delete': can_delete}


class CommentCreateSerializer(serializers.ModelSerializer):
    text = serializers.CharField()

    class Meta:
        model = Comment
        fields = ('id', 'text')
        read_only_fields = ('id',)

    def validate_text(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError('Текст комментария не может быть пустым')
        return val
