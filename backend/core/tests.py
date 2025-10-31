from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import User, JobOrder, Device, Task, Inspection
from django.utils import timezone

class ApiTests(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin = User.objects.create_user(username='admin', password='password', role='admin', is_staff=True)
        self.planner = User.objects.create_user(username='planner', password='password', role='planner')
        self.technician = User.objects.create_user(username='technician', password='password', role='technician')
        self.tester = User.objects.create_user(username='tester', password='password', role='tester')
        self.quality = User.objects.create_user(username='quality', password='password', role='quality')
        self.supervisor = User.objects.create_user(username='supervisor', password='password', role='supervisor')

        # Create a Job Order
        self.job_order = JobOrder.objects.create(
            order_code='JO-001',
            title='Test Job Order',
            created_by=self.planner,
            due_date=timezone.now().date(),
            total_devices=3
        )

        # Create Devices
        self.device1 = Device.objects.create(serial_number='DEV001', device_type='type1')
        self.device2 = Device.objects.create(serial_number='DEV002', device_type='type1')
        self.device3 = Device.objects.create(serial_number='DEV003', device_type='type2')

        # Create Tasks with different statuses
        self.task1 = Task.objects.create(job_order=self.job_order, device=self.device1, operation_name='op1', status='available')
        self.task2 = Task.objects.create(job_order=self.job_order, device=self.device2, operation_name='op2', status='in_progress', technician=self.technician, start_time=timezone.now())
        self.task3 = Task.objects.create(job_order=self.job_order, device=self.device3, operation_name='op3', status='pending-approval', technician=self.technician, start_time=timezone.now(), end_time=timezone.now())

    def test_task_summary_api(self):
        """
        Test the task summary API endpoint.
        """
        url = reverse('task-summary')
        
        # Test unauthenticated access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test authenticated access
        self.client.force_authenticate(user=self.technician)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the summary data
        expected_summary = {
            'available': 1,
            'in_progress': 1,
            'pending-approval': 1,
            'completed': 0,
            'rejected': 0,
        }
        # Add other statuses with 0 count
        all_statuses = [s[0] for s in Task.STATUS_CHOICES]
        for status_key in all_statuses:
            if status_key not in expected_summary:
                expected_summary[status_key] = 0

        self.assertDictEqual(response.data, expected_summary)

    def test_task_list_for_tester(self):
        """
        Test that a tester can access the task list.
        """
        url = reverse('task-list')
        self.client.force_authenticate(user=self.tester)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_inspection_creation_by_tester(self):
        """
        Test that a tester can create an inspection.
        """
        url = reverse('inspection-list')
        self.client.force_authenticate(user=self.tester)
        
        data = {
            'task_id': self.task3.id,
            'decision': 'accepted',
            'comments': 'Looks good.'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the inspection was created and assigned to the tester
        inspection = Inspection.objects.first()
        self.assertIsNotNone(inspection)
        self.assertEqual(inspection.inspector, self.tester)
        self.assertEqual(inspection.decision, 'accepted')
        
        # Verify task status is updated
        self.task3.refresh_from_db()
        self.assertEqual(self.task3.status, 'completed')

    def test_tester_can_only_see_own_inspections(self):
        """
        Test that a tester can only see their own inspections.
        """
        # Create an inspection by the tester
        Inspection.objects.create(task=self.task1, inspector=self.tester, decision='rejected', comments='failed')
        # Create an inspection by another user (quality inspector)
        Inspection.objects.create(task=self.task2, inspector=self.quality, decision='accepted', comments='ok')

        url = reverse('inspection-list')
        self.client.force_authenticate(user=self.tester)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['inspector'], self.tester.id)

    def test_quality_inspector_can_see_all_inspections(self):
        """
        Test that a quality inspector can see all inspections.
        """
        Inspection.objects.create(task=self.task1, inspector=self.tester, decision='rejected', comments='failed')
        Inspection.objects.create(task=self.task2, inspector=self.quality, decision='accepted', comments='ok')

        url = reverse('inspection-list')
        self.client.force_authenticate(user=self.quality)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
