from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'project',
        'author',
        'assignee',
        'status',
        'priority',
        'due_date',
        'created_at',
    )
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description', 'author__username', 'assignee__username')
