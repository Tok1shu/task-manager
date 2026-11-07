from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from .models import Project, ProjectMember

User = get_user_model()
PASSWORD = 'MyPassword2008!'


class ProjectTests(APITestCase):
    client: APIClient

    def setUp(self):
        self.owner = User.objects.create_user('tokishu', 'tokishu@lazurite.cc', PASSWORD)
        self.member = User.objects.create_user('petr', 'petr@example.com', PASSWORD)
        self.stranger = User.objects.create_user('ivan', 'ivan@example.com', PASSWORD)

        self.project = Project.objects.create(
            name='Дипломная работа',
            description='Система управления проектами и задачами',
            owner=self.owner,
        )
        ProjectMember.objects.create(project=self.project, user=self.member)

    def test_list_projects_unauthenticated(self):
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 401)

    def test_list_projects_shows_only_owned_and_joined(self):
        other_project = Project.objects.create(
            name='Чужой проект',
            owner=self.stranger,
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.project.id))
        self.assertEqual(response.data['results'][0]['role'], 'owner')
        self.assertEqual(response.data['results'][0]['members_count'], 2)

        self.client.force_authenticate(self.member)
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.project.id))
        self.assertEqual(response.data['results'][0]['role'], 'member')

        self.client.force_authenticate(self.stranger)
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(other_project.id))

    def test_create_project_success(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            '/api/projects/',
            {'name': 'Новый проект', 'description': 'Описание нового проекта'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Новый проект')
        self.assertEqual(response.data['description'], 'Описание нового проекта')
        self.assertEqual(response.data['owner']['id'], str(self.owner.id))
        self.assertEqual(response.data['owner']['username'], 'tokishu')
        self.assertEqual(response.data['role'], 'owner')
        self.assertEqual(response.data['members_count'], 1)
        self.assertEqual(response.data['tasks_count'], 0)
        self.assertEqual(
            response.data['permissions'],
            {'can_edit': True, 'can_delete': True, 'can_manage_members': True},
        )
        self.assertEqual(
            response.data['members'],
            [{'id': str(self.owner.id), 'username': 'tokishu', 'is_owner': True}],
        )

    def test_create_project_validation(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post('/api/projects/', {'name': 'ab'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('name', response.data)

        long_name = 'a' * 121
        response = self.client.post('/api/projects/', {'name': long_name}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('name', response.data)

    def test_get_project_detail_owner(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], str(self.project.id))
        self.assertEqual(response.data['role'], 'owner')
        self.assertEqual(
            response.data['permissions'],
            {'can_edit': True, 'can_delete': True, 'can_manage_members': True},
        )
        self.assertEqual(len(response.data['members']), 2)
        self.assertTrue(response.data['members'][0]['is_owner'])
        self.assertFalse(response.data['members'][1]['is_owner'])

    def test_get_project_detail_member(self):
        self.client.force_authenticate(self.member)
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], 'member')
        self.assertEqual(
            response.data['permissions'],
            {'can_edit': False, 'can_delete': False, 'can_manage_members': False},
        )

    def test_get_project_detail_stranger_is_404(self):
        self.client.force_authenticate(self.stranger)
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, 404)

    def test_patch_project_owner_and_member(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            f'/api/projects/{self.project.id}/',
            {'name': 'Новое название проекта'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, 'Новое название проекта')

        self.client.force_authenticate(self.member)
        response = self.client.patch(
            f'/api/projects/{self.project.id}/',
            {'name': 'Попытка изменения'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.stranger)
        response = self.client.patch(
            f'/api/projects/{self.project.id}/',
            {'name': 'Попытка изменения'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_project_permissions(self):
        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.delete(f'/api/projects/{self.project.id}/').status_code, 404)

        self.client.force_authenticate(self.member)
        self.assertEqual(self.client.delete(f'/api/projects/{self.project.id}/').status_code, 403)

        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(f'/api/projects/{self.project.id}/').status_code, 204)
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())

    def test_member_add_success(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'ivan'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['id'], str(self.stranger.id))
        self.assertEqual(response.data['username'], 'ivan')
        self.assertTrue(ProjectMember.objects.filter(project=self.project, user=self.stranger).exists())

    def test_member_add_validations(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'unknown_user'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['username'], ['Пользователь не найден'])

        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'tokishu'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['username'], ['Уже участник проекта'])

        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'petr'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['username'], ['Уже участник проекта'])

    def test_member_add_permissions(self):
        new_user = User.objects.create_user('sergey', 'sergey@example.com', PASSWORD)

        self.client.force_authenticate(self.member)
        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'sergey'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.stranger)
        response = self.client.post(
            f'/api/projects/{self.project.id}/members/',
            {'username': 'sergey'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_member_remove_success(self):
        self.client.force_authenticate(self.owner)
        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ProjectMember.objects.filter(project=self.project, user=self.member).exists())

    def test_member_remove_validations(self):
        self.client.force_authenticate(self.owner)

        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.owner.id}/')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Владельца нельзя исключить из проекта')

        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.stranger.id}/')
        self.assertEqual(response.status_code, 404)

    def test_member_remove_permissions(self):
        self.client.force_authenticate(self.member)
        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.stranger)
        response = self.client.delete(f'/api/projects/{self.project.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, 404)

    def test_project_stats(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(f'/api/projects/{self.project.id}/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                'total': 0,
                'todo': 0,
                'in_progress': 0,
                'done': 0,
                'overdue': 0,
                'done_percent': 0.0,
            },
        )

        self.client.force_authenticate(self.member)
        response = self.client.get(f'/api/projects/{self.project.id}/stats/')
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.stranger)
        response = self.client.get(f'/api/projects/{self.project.id}/stats/')
        self.assertEqual(response.status_code, 404)
