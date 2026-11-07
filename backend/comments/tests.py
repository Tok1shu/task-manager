from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from projects.models import Project, ProjectMember
from tasks.models import Task
from .models import Comment

User = get_user_model()
PASSWORD = 'MyPassword2008!'


class CommentTests(APITestCase):
    client: APIClient

    def setUp(self):
        self.owner = User.objects.create_user('tokishu', 'tokishu@lazurite.cc', PASSWORD)
        self.member = User.objects.create_user('petr', 'petr@example.com', PASSWORD)
        self.other_member = User.objects.create_user('sergey', 'sergey@example.com', PASSWORD)
        self.stranger = User.objects.create_user('ivan', 'ivan@example.com', PASSWORD)

        self.project = Project.objects.create(
            name='Дипломная работа',
            description='Система управления проектами',
            owner=self.owner,
        )
        ProjectMember.objects.create(project=self.project, user=self.member)
        ProjectMember.objects.create(project=self.project, user=self.other_member)

        self.task = Task.objects.create(
            title='Настройка авторизации',
            project=self.project,
            author=self.owner,
            assignee=self.member,
        )

    def test_create_comment_success(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            f'/api/tasks/{self.task.id}/comments/',
            {'text': 'Первый комментарий к задаче'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['text'], 'Первый комментарий к задаче')
        self.assertEqual(response.data['task'], str(self.task.id))
        self.assertEqual(response.data['author']['id'], str(self.member.id))
        self.assertTrue(response.data['permissions']['can_delete'])

        task_response = self.client.get(f'/api/tasks/{self.task.id}/')
        self.assertEqual(task_response.data['comments_count'], 1)

    def test_create_comment_empty_validation(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            f'/api/tasks/{self.task.id}/comments/',
            {'text': '   '},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('text', response.data)

    def test_create_comment_stranger_is_404(self):
        self.client.force_authenticate(self.stranger)
        response = self.client.post(
            f'/api/tasks/{self.task.id}/comments/',
            {'text': 'Попытка спама'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_list_comments_chronological(self):
        c1 = Comment.objects.create(task=self.task, author=self.owner, text='Первое сообщение')
        c2 = Comment.objects.create(task=self.task, author=self.member, text='Второе сообщение')

        self.client.force_authenticate(self.member)
        response = self.client.get(f'/api/tasks/{self.task.id}/comments/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['id'], str(c1.id))
        self.assertEqual(response.data['results'][1]['id'], str(c2.id))

        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get(f'/api/tasks/{self.task.id}/comments/').status_code, 404)

    def test_delete_own_comment_by_author(self):
        comment = Comment.objects.create(
            task=self.task, author=self.member, text='Мой комментарий'
        )
        self.client.force_authenticate(self.member)
        response = self.client.delete(f'/api/comments/{comment.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_delete_foreign_comment_by_project_owner(self):
        comment = Comment.objects.create(
            task=self.task, author=self.member, text='Комментарий участника'
        )
        self.client.force_authenticate(self.owner)
        response = self.client.delete(f'/api/comments/{comment.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_delete_foreign_comment_by_member_is_403(self):
        comment = Comment.objects.create(
            task=self.task, author=self.member, text='Комментарий участника'
        )
        self.client.force_authenticate(self.other_member)
        response = self.client.delete(f'/api/comments/{comment.id}/')
        self.assertEqual(response.status_code, 403)

    def test_delete_comment_by_stranger_is_404(self):
        comment = Comment.objects.create(
            task=self.task, author=self.member, text='Комментарий участника'
        )
        self.client.force_authenticate(self.stranger)
        response = self.client.delete(f'/api/comments/{comment.id}/')
        self.assertEqual(response.status_code, 404)
