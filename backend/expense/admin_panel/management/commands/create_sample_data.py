from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from admin_panel.models import Company, ApprovalWorkflow, ApprovalStep
from employees.models import Expense
from decimal import Decimal
import random
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for testing admin panel functionality'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--company-name',
            type=str,
            default='TechCorp Inc',
            help='Name of the company to create'
        )
    
    def handle(self, *args, **options):
        company_name = options['company_name']
        
        # Create or get company
        company, created = Company.objects.get_or_create(
            name=company_name,
            defaults={
                'default_currency': 'USD',
                'country': 'United States'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created company: {company.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Company {company.name} already exists')
            )
        
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@techcorp.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'company': company,
                'country': 'United States',
                'is_active_user': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_user.username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Admin user {admin_user.username} already exists')
            )
        
        # Create manager users
        manager1, created = User.objects.get_or_create(
            username='manager1',
            defaults={
                'email': 'manager1@techcorp.com',
                'first_name': 'John',
                'last_name': 'Manager',
                'role': 'MANAGER',
                'company': company,
                'country': 'United States',
                'is_active_user': True
            }
        )
        
        if created:
            manager1.set_password('manager123')
            manager1.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created manager: {manager1.username}')
            )
        
        manager2, created = User.objects.get_or_create(
            username='manager2',
            defaults={
                'email': 'manager2@techcorp.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'MANAGER',
                'company': company,
                'country': 'United States',
                'is_active_user': True
            }
        )
        
        if created:
            manager2.set_password('manager123')
            manager2.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created manager: {manager2.username}')
            )
        
        # Create employee users
        employees = []
        employee_data = [
            ('employee1', 'Alice', 'Smith', 'alice@techcorp.com', manager1),
            ('employee2', 'Bob', 'Wilson', 'bob@techcorp.com', manager1),
            ('employee3', 'Carol', 'Davis', 'carol@techcorp.com', manager2),
            ('employee4', 'David', 'Brown', 'david@techcorp.com', manager2),
            ('employee5', 'Eve', 'Miller', 'eve@techcorp.com', manager1),
        ]
        
        for username, first_name, last_name, email, manager in employee_data:
            employee, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': 'EMPLOYEE',
                    'company': company,
                    'manager': manager,
                    'country': 'United States',
                    'is_active_user': True
                }
            )
            
            if created:
                employee.set_password('employee123')
                employee.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created employee: {employee.username}')
                )
                employees.append(employee)
            else:
                employees.append(employee)
        
        # Create approval workflow
        workflow, created = ApprovalWorkflow.objects.get_or_create(
            name='Standard Expense Approval',
            company=company,
            defaults={
                'workflow_type': 'SEQUENTIAL',
                'description': 'Standard expense approval workflow requiring manager approval',
                'is_active': True,
                'minimum_approval_percentage': 100,
                'manager_approval_required': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created approval workflow: {workflow.name}')
            )
            
            # Create approval steps
            ApprovalStep.objects.create(
                workflow=workflow,
                step_number=1,
                approver_role='MANAGER',
                is_required=True
            )
            
            ApprovalStep.objects.create(
                workflow=workflow,
                step_number=2,
                approver_role='ADMIN',
                is_required=False
            )
        
        # Create sample expenses
        categories = ['TRAVEL', 'ACCOMMODATION', 'MEALS', 'OFFICE_SUPPLIES', 'SOFTWARE']
        statuses = ['PENDING', 'APPROVED', 'REJECTED']
        
        for employee in employees:
            for i in range(random.randint(3, 8)):
                expense_date = date.today() - timedelta(days=random.randint(1, 90))
                amount = Decimal(str(random.uniform(25.0, 2000.0))).quantize(Decimal('0.01'))
                
                expense, created = Expense.objects.get_or_create(
                    employee=employee,
                    amount=amount,
                    expense_date=expense_date,
                    defaults={
                        'company': company,
                        'currency': 'USD',
                        'category': random.choice(categories),
                        'description': f'Sample expense for {random.choice(categories).lower().replace("_", " ")}',
                        'status': random.choice(statuses),
                    }
                )
                
                if created:
                    # Set approval info for non-pending expenses
                    if expense.status != 'PENDING':
                        expense.approved_by = random.choice([manager1, manager2, admin_user])
                        expense.approval_date = expense.created_at + timedelta(days=random.randint(1, 5))
                        expense.approval_notes = f"{'Approved' if expense.status == 'APPROVED' else 'Rejected'} by {expense.approved_by.get_full_name_display()}"
                        expense.save()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Sample data creation completed for company: {company.name}'
            )
        )
        
        self.stdout.write('\nLogin credentials:')
        self.stdout.write(f'Admin: admin / admin123')
        self.stdout.write(f'Manager1: manager1 / manager123')
        self.stdout.write(f'Manager2: manager2 / manager123')
        self.stdout.write(f'Employees: employee1-5 / employee123')