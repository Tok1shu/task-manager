from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import User

PASSWORD = 'MyPassword2008!'


class AuthTests(APITestCase):
    def setUp(self):
        cache.clear()

    def register(self, **overrides):
        data = {'username': 'tokishu', 'email': 'tokishu@lazurite.cc', 'password': PASSWORD}
        data.update(overrides)
        return self.client.post('/api/auth/register/', data, format='json')

    def login(self, username='tokishu', password=PASSWORD):
        return self.client.post(
            '/api/auth/login/', {'username': username, 'password': password}, format='json'
        )

    def test_register_creates_user_with_hashed_password(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data), {'id', 'username'})
        user = User.objects.get(username='tokishu')
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))

    def test_register_rejects_duplicate_username_and_email_any_case(self):
        self.register()
        self.assertEqual(self.register(email='other@example.com').status_code, 400)
        self.assertEqual(self.register(username='petr', email='tokishu@lazurite.cc').status_code, 400)

    def test_register_rejects_weak_password(self):
        response = self.register(password='12345678')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)

    def test_login_returns_access_and_httponly_refresh_cookie(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        cookie = response.cookies['refresh_token']
        self.assertTrue(cookie['httponly'])

    def test_login_wrong_password_is_401(self):
        self.register()
        self.assertEqual(self.login(password='wrong').status_code, 401)

    def test_refresh_rotates_and_logout_revokes(self):
        self.register()
        self.login()
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 200)
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('tokishu', 'tokishu@lazurite.cc', PASSWORD)
        self.other = User.objects.create_user('petr', 'petr@example.com', PASSWORD)

    def test_me_requires_auth(self):
        self.assertEqual(self.client.get('/api/me/').status_code, 401)

    def test_me_returns_own_profile(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'tokishu')
        self.assertEqual(response.data['email'], 'tokishu@lazurite.cc')

    def test_me_patch_updates_username_and_email(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch('/api/me/', {'email': 'New@Example.com'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')

    def test_me_patch_rejects_taken_email(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch('/api/me/', {'email': 'PETR@example.com'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_me_patch_cannot_change_id(self):
        self.client.force_authenticate(self.user)
        old_id = self.user.id
        self.client.patch('/api/me/', {'id': str(self.other.id)}, format='json')
        self.user.refresh_from_db()
        self.assertEqual(self.user.id, old_id)
