from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


def _check_email_free(value, instance=None):
    value = value.lower()
    qs = User.objects.filter(email__iexact=value)
    if instance is not None:
        qs = qs.exclude(pk=instance.pk)
    if qs.exists():
        raise serializers.ValidationError('Эта почта уже занята')
    return value


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        read_only_fields = ('id',)
        extra_kwargs = {
            'email': {'write_only': True},
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        return _check_email_free(value)

    def validate(self, attrs):
        candidate = User(username=attrs.get('username'), email=attrs.get('email'))
        try:
            validate_password(attrs['password'], user=candidate)
        except Exception as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def validate_email(self, value):
        return _check_email_free(value, self.instance)
