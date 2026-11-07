from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Project, ProjectMember

User = get_user_model()


class ProjectUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')
        read_only_fields = ('id', 'username')


class ProjectListSerializer(serializers.ModelSerializer):
    owner = ProjectUserSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'owner',
            'role',
            'members_count',
            'tasks_count',
            'created_at',
        )
        read_only_fields = (
            'id',
            'owner',
            'role',
            'members_count',
            'tasks_count',
            'created_at',
        )

    def get_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.owner_id == request.user.id:
            return 'owner'
        return 'member'

    def get_members_count(self, obj):
        return len([m for m in obj.members.all() if m.id != obj.owner_id]) + 1

    def get_tasks_count(self, obj):
        if hasattr(obj, 'tasks'):
            return obj.tasks.count()
        return 0


class ProjectDetailSerializer(ProjectListSerializer):
    members = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ('members', 'permissions')
        read_only_fields = ProjectListSerializer.Meta.read_only_fields + ('members', 'permissions')

    def get_members(self, obj):
        result = [
            {
                'id': str(obj.owner.id),
                'username': obj.owner.username,
                'is_owner': True,
            }
        ]
        for member in obj.members.all():
            if member.id != obj.owner_id:
                result.append(
                    {
                        'id': str(member.id),
                        'username': member.username,
                        'is_owner': False,
                    }
                )
        return result

    def get_permissions(self, obj):
        request = self.context.get('request')
        is_owner = bool(request and request.user.is_authenticated and obj.owner_id == request.user.id)
        return {
            'can_edit': is_owner,
            'can_delete': is_owner,
            'can_manage_members': is_owner,
        }


class ProjectCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=3, max_length=120)
    description = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Project
        fields = ('id', 'name', 'description')
        read_only_fields = ('id',)

    def validate_name(self, value):
        val = value.strip()
        if len(val) < 3 or len(val) > 120:
            raise serializers.ValidationError('Название должно быть от 3 до 120 символов')
        return val


class MemberAddSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Пользователь не найден')

        project = self.context['project']
        if user.id == project.owner_id or project.members.filter(pk=user.pk).exists():
            raise serializers.ValidationError('Уже участник проекта')

        return user

    def create(self, validated_data):
        user = validated_data['username']
        project = self.context['project']
        ProjectMember.objects.create(project=project, user=user)
        return user
