from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from projects.models import Project, ProjectMember
from .models import Task

User = get_user_model()
PASSWORD = 'MyPassword2008!'


class TaskTests(APITestCase):
    client: APIClient

    def setUp(self):
        self.owner = User.objects.create_user('tokishu', 'tokishu@lazurite.cc', PASSWORD)
        self.member = User.objects.create_user('petr', 'petr@example.com', PASSWORD)
        self.stranger = User.objects.create_user('ivan', 'ivan@example.com', PASSWORD)
        self.other_member = User.objects.create_user('sergey', 'sergey@example.com', PASSWORD)

        self.project = Project.objects.create(
            name='Дипломная работа',
            description='Система управления проектами',
            owner=self.owner,
        )
        ProjectMember.objects.create(project=self.project, user=self.member)
        ProjectMember.objects.create(project=self.project, user=self.other_member)

    def test_create_task_success(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            f'/api/projects/{self.project.id}/tasks/',
            {
                'title': 'Разработать модуль авторизации',
                'description': 'Настройка JWT и refresh токенов',
                'assignee': str(self.owner.id),
                'priority': 'high',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'Разработать модуль авторизации')
        self.assertEqual(response.data['status'], 'todo')
        self.assertEqual(response.data['priority'], 'high')
        self.assertEqual(response.data['author']['id'], str(self.member.id))
        self.assertEqual(response.data['assignee']['id'], str(self.owner.id))
        self.assertEqual(response.data['project'], str(self.project.id))
        self.assertFalse(response.data['is_overdue'])
        self.assertEqual(response.data['comments_count'], 0)
        self.assertTrue(response.data['permissions']['can_edit'])
        self.assertFalse(response.data['permissions']['can_delete'])

    def test_create_task_assignee_validation(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            f'/api/projects/{self.project.id}/tasks/',
            {
                'title': 'Невалидный исполнитель',
                'assignee': str(self.stranger.id),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('assignee', response.data)

    def test_create_task_title_validation(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            f'/api/projects/{self.project.id}/tasks/',
            {'title': 'ab'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('title', response.data)

        response = self.client.post(
            f'/api/projects/{self.project.id}/tasks/',
            {'title': 'a' * 151},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('title', response.data)

    def test_create_task_stranger_is_404(self):
        self.client.force_authenticate(self.stranger)
        response = self.client.post(
            f'/api/projects/{self.project.id}/tasks/',
            {'title': 'Попытка создания чужим'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_list_tasks_and_filters(self):
        today = timezone.localdate()
        task1 = Task.objects.create(
            title='Задача раз',
            project=self.project,
            author=self.owner,
            assignee=self.member,
            status=Task.STATUS_TODO,
            priority=Task.PRIORITY_LOW,
            due_date=today + timedelta(days=2),
        )
        task2 = Task.objects.create(
            title='Задача два',
            project=self.project,
            author=self.member,
            assignee=None,
            status=Task.STATUS_DONE,
            priority=Task.PRIORITY_HIGH,
        )

        self.client.force_authenticate(self.member)
        response = self.client.get(f'/api/projects/{self.project.id}/tasks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?status=done')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(task2.id))

        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?assignee=none')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(task2.id))

        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?assignee={self.member.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(task1.id))

        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?search=раз')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(task1.id))

        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get(f'/api/projects/{self.project.id}/tasks/').status_code, 404)

    def test_ordering_tasks(self):
        Task.objects.create(
            title='Низкий приоритет',
            project=self.project,
            author=self.owner,
            priority=Task.PRIORITY_LOW,
        )
        Task.objects.create(
            title='Высокий приоритет',
            project=self.project,
            author=self.owner,
            priority=Task.PRIORITY_HIGH,
        )
        Task.objects.create(
            title='Средний приоритет',
            project=self.project,
            author=self.owner,
            priority=Task.PRIORITY_MEDIUM,
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?ordering=priority')
        priorities = [item['priority'] for item in response.data['results']]
        self.assertEqual(priorities, ['low', 'medium', 'high'])

        response = self.client.get(f'/api/projects/{self.project.id}/tasks/?ordering=-priority')
        priorities = [item['priority'] for item in response.data['results']]
        self.assertEqual(priorities, ['high', 'medium', 'low'])

    def test_patch_task_permissions(self):
        task = Task.objects.create(
            title='Начальное название',
            project=self.project,
            author=self.member,
            assignee=self.other_member,
        )

        self.client.force_authenticate(self.stranger)
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Взлом'}, format='json')
        self.assertEqual(response.status_code, 404)

        other_user = User.objects.create_user('mikhail', 'mikhail@example.com', PASSWORD)
        ProjectMember.objects.create(project=self.project, user=other_user)
        self.client.force_authenticate(other_user)
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Чужой апдейт'}, format='json')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.member)
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Авторский апдейт'}, format='json')
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.other_member)
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Апдейт исполнителя'}, format='json')
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.owner)
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Апдейт владельца'}, format='json')
        self.assertEqual(response.status_code, 200)

    def test_patch_status_permissions(self):
        task = Task.objects.create(
            title='Проверка статуса',
            project=self.project,
            author=self.member,
            assignee=self.other_member,
            status=Task.STATUS_TODO,
        )

        self.client.force_authenticate(self.member)
        response = self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'done'}, format='json')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.other_member)
        response = self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'in_progress'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'in_progress')

        self.client.force_authenticate(self.owner)
        response = self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'done'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'done')

    def test_delete_task_permissions(self):
        task = Task.objects.create(
            title='Задача для удаления',
            project=self.project,
            author=self.member,
            assignee=self.other_member,
        )

        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.delete(f'/api/tasks/{task.id}/').status_code, 404)

        self.client.force_authenticate(self.member)
        self.assertEqual(self.client.delete(f'/api/tasks/{task.id}/').status_code, 403)

        self.client.force_authenticate(self.other_member)
        self.assertEqual(self.client.delete(f'/api/tasks/{task.id}/').status_code, 403)

        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(f'/api/tasks/{task.id}/').status_code, 204)
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_my_tasks_endpoint(self):
        task = Task.objects.create(
            title='Моя назначенная задача',
            project=self.project,
            author=self.owner,
            assignee=self.member,
        )

        self.client.force_authenticate(self.member)
        response = self.client.get('/api/me/tasks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(task.id))
        self.assertEqual(
            response.data['results'][0]['project'],
            {'id': str(self.project.id), 'name': 'Дипломная работа'},
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/me/tasks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)

    def test_is_overdue_and_stats(self):
        yesterday = timezone.localdate() - timedelta(days=1)
        tomorrow = timezone.localdate() + timedelta(days=1)

        Task.objects.create(
            title='Просроченная задача',
            project=self.project,
            author=self.owner,
            status=Task.STATUS_TODO,
            due_date=yesterday,
        )
        Task.objects.create(
            title='Выполненная задача вовремя',
            project=self.project,
            author=self.owner,
            status=Task.STATUS_DONE,
            due_date=yesterday,
        )
        Task.objects.create(
            title='Будущая задача',
            project=self.project,
            author=self.owner,
            status=Task.STATUS_IN_PROGRESS,
            due_date=tomorrow,
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get(f'/api/projects/{self.project.id}/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['todo'], 1)
        self.assertEqual(response.data['in_progress'], 1)
        self.assertEqual(response.data['done'], 1)
        self.assertEqual(response.data['overdue'], 1)
        self.assertEqual(response.data['done_percent'], 33.3)

    def test_member_removal_clears_task_assignee(self):
        task = Task.objects.create(
            title='Задача участника',
            project=self.project,
            author=self.owner,
            assignee=self.member,
        )

        self.client.force_authenticate(self.owner)
        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, 204)

        task.refresh_from_db()
        self.assertIsNone(task.assignee)
