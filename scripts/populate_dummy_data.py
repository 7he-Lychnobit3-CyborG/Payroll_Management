#!/usr/bin/env python3
"""
Populate the Payroll Management System with extensive dummy data
"""

import sys
import os
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import hashlib
import random
from faker import Faker
import uuid

# Initialize Faker
fake = Faker()

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "payroll_management"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Departments and positions
DEPARTMENTS = [
    'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 
    'Customer Support', 'Product Management', 'Design', 'Legal', 'IT', 'Research'
]

POSITIONS = {
    'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'],
    'Sales': ['Sales Representative', 'Senior Sales Rep', 'Sales Manager', 'Account Executive', 'Business Development Manager', 'Sales Director'],
    'Marketing': ['Marketing Specialist', 'Digital Marketing Manager', 'Content Marketing Manager', 'Marketing Director', 'Brand Manager', 'SEO Specialist'],
    'HR': ['HR Specialist', 'HR Manager', 'Talent Acquisition Specialist', 'HR Business Partner', 'HR Director', 'Training Coordinator'],
    'Finance': ['Financial Analyst', 'Senior Financial Analyst', 'Finance Manager', 'Controller', 'CFO', 'Accounts Payable Specialist'],
    'Operations': ['Operations Specialist', 'Operations Manager', 'Supply Chain Manager', 'Logistics Coordinator', 'Operations Director'],
    'Customer Support': ['Support Specialist', 'Senior Support Specialist', 'Support Manager', 'Customer Success Manager', 'Support Director'],
    'Product Management': ['Product Manager', 'Senior Product Manager', 'Product Owner', 'VP of Product', 'Product Analyst'],
    'Design': ['UI/UX Designer', 'Senior Designer', 'Design Manager', 'Creative Director', 'Graphic Designer'],
    'Legal': ['Legal Counsel', 'Senior Legal Counsel', 'General Counsel', 'Compliance Officer', 'Contract Specialist'],
    'IT': ['IT Specialist', 'System Administrator', 'IT Manager', 'Security Analyst', 'Network Administrator'],
    'Research': ['Research Analyst', 'Senior Research Analyst', 'Research Manager', 'Data Scientist', 'Research Director']
}

SALARY_RANGES = {
    'Software Engineer': (75000, 95000),
    'Senior Software Engineer': (95000, 130000),
    'Tech Lead': (120000, 150000),
    'Engineering Manager': (140000, 180000),
    'DevOps Engineer': (80000, 110000),
    'Frontend Developer': (70000, 95000),
    'Backend Developer': (75000, 100000),
    'Full Stack Developer': (80000, 110000),
    'Sales Representative': (45000, 65000),
    'Senior Sales Rep': (60000, 85000),
    'Sales Manager': (80000, 120000),
    'Account Executive': (70000, 100000),
    'Business Development Manager': (85000, 125000),
    'Sales Director': (120000, 180000),
    'Marketing Specialist': (50000, 70000),
    'Digital Marketing Manager': (70000, 95000),
    'Content Marketing Manager': (65000, 90000),
    'Marketing Director': (100000, 150000),
    'Brand Manager': (75000, 105000),
    'SEO Specialist': (55000, 75000),
    'HR Specialist': (50000, 70000),
    'HR Manager': (75000, 105000),
    'Talent Acquisition Specialist': (60000, 85000),
    'HR Business Partner': (80000, 110000),
    'HR Director': (110000, 160000),
    'Training Coordinator': (45000, 65000),
    'Financial Analyst': (60000, 85000),
    'Senior Financial Analyst': (80000, 110000),
    'Finance Manager': (90000, 130000),
    'Controller': (100000, 140000),
    'CFO': (150000, 250000),
    'Accounts Payable Specialist': (40000, 60000),
    'Operations Specialist': (50000, 70000),
    'Operations Manager': (75000, 105000),
    'Supply Chain Manager': (80000, 115000),
    'Logistics Coordinator': (45000, 65000),
    'Operations Director': (110000, 160000),
    'Support Specialist': (40000, 60000),
    'Senior Support Specialist': (55000, 75000),
    'Support Manager': (70000, 95000),
    'Customer Success Manager': (75000, 105000),
    'Support Director': (95000, 140000),
    'Product Manager': (90000, 130000),
    'Senior Product Manager': (110000, 150000),
    'Product Owner': (80000, 115000),
    'VP of Product': (140000, 200000),
    'Product Analyst': (65000, 90000),
    'UI/UX Designer': (65000, 90000),
    'Senior Designer': (80000, 110000),
    'Design Manager': (95000, 135000),
    'Creative Director': (110000, 160000),
    'Graphic Designer': (45000, 65000),
    'Legal Counsel': (120000, 170000),
    'Senior Legal Counsel': (140000, 200000),
    'General Counsel': (180000, 280000),
    'Compliance Officer': (80000, 120000),
    'Contract Specialist': (60000, 85000),
    'IT Specialist': (55000, 75000),
    'System Administrator': (65000, 90000),
    'IT Manager': (85000, 120000),
    'Security Analyst': (75000, 105000),
    'Network Administrator': (60000, 85000),
    'Research Analyst': (60000, 85000),
    'Senior Research Analyst': (80000, 110000),
    'Research Manager': (95000, 135000),
    'Data Scientist': (95000, 140000),
    'Research Director': (120000, 180000)
}

DEDUCTION_TYPES = [
    {'name': 'Federal Income Tax', 'type': 'tax', 'percentage': 22, 'is_percentage': True, 'is_mandatory': True},
    {'name': 'State Income Tax', 'type': 'tax', 'percentage': 6, 'is_percentage': True, 'is_mandatory': True},
    {'name': 'Social Security', 'type': 'tax', 'percentage': 6.2, 'is_percentage': True, 'is_mandatory': True},
    {'name': 'Medicare', 'type': 'tax', 'percentage': 1.45, 'is_percentage': True, 'is_mandatory': True},
    {'name': 'Provident Fund', 'type': 'pf', 'percentage': 12, 'is_percentage': True, 'is_mandatory': True},
    {'name': 'Health Insurance', 'type': 'insurance', 'amount': 350, 'is_percentage': False, 'is_mandatory': True},
    {'name': 'Dental Insurance', 'type': 'insurance', 'amount': 45, 'is_percentage': False, 'is_mandatory': False},
    {'name': 'Vision Insurance', 'type': 'insurance', 'amount': 25, 'is_percentage': False, 'is_mandatory': False},
    {'name': 'Life Insurance', 'type': 'insurance', 'amount': 50, 'is_percentage': False, 'is_mandatory': False},
    {'name': 'Parking Fee', 'type': 'other', 'amount': 100, 'is_percentage': False, 'is_mandatory': False},
    {'name': 'Gym Membership', 'type': 'other', 'amount': 75, 'is_percentage': False, 'is_mandatory': False}
]

REIMBURSEMENT_CATEGORIES = ['travel', 'medical', 'food', 'equipment', 'training', 'other']

async def create_users():
    """Create admin, payroll officer, and employee users"""
    print("Creating users...")
    
    users = [
        {
            'id': str(uuid.uuid4()),
            'username': 'admin',
            'email': 'admin@payrollcentral.com',
            'password': hash_password('admin123'),
            'role': 'admin',
            'created_at': datetime.now(timezone.utc)
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'payroll',
            'email': 'payroll@payrollcentral.com',
            'password': hash_password('payroll123'),
            'role': 'payroll_officer',
            'created_at': datetime.now(timezone.utc)
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} system users")

async def create_employees():
    """Create a large number of employees with realistic data"""
    print("Creating employees...")
    
    employees = []
    employee_users = []
    
    for i in range(150):  # Create 150 employees
        department = random.choice(DEPARTMENTS)
        position = random.choice(POSITIONS[department])
        salary_range = SALARY_RANGES.get(position, (50000, 100000))
        base_salary = random.randint(salary_range[0], salary_range[1])
        
        # Generate joining date between 6 months to 5 years ago
        joining_date = fake.date_between(start_date='-5y', end_date='-6M')
        
        employee_id = f"EMP{str(i+1).zfill(4)}"
        
        employee = {
            'id': str(uuid.uuid4()),
            'employee_id': employee_id,
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'email': fake.email(),
            'phone': fake.phone_number(),
            'department': department,
            'position': position,
            'joining_date': datetime.combine(joining_date, datetime.min.time()).replace(tzinfo=timezone.utc),
            'base_salary': base_salary,
            'bank_account': fake.iban(),
            'tax_id': fake.ssn(),
            'address': fake.address().replace('\n', ', '),
            'status': 'active',
            'created_at': datetime.now(timezone.utc)
        }
        
        # Create corresponding user account for first 50 employees
        if i < 50:
            user = {
                'id': str(uuid.uuid4()),
                'username': f"{employee['first_name'].lower()}.{employee['last_name'].lower()}",
                'email': employee['email'],
                'password': hash_password('employee123'),
                'role': 'employee',
                'employee_id': employee_id,
                'created_at': datetime.now(timezone.utc)
            }
            employee_users.append(user)
        
        employees.append(employee)
    
    await db.employees.insert_many(employees)
    if employee_users:
        await db.users.insert_many(employee_users)
    
    print(f"Created {len(employees)} employees and {len(employee_users)} employee user accounts")
    return employees

async def create_deductions():
    """Create standard deductions"""
    print("Creating deductions...")
    
    deductions = []
    for deduction_data in DEDUCTION_TYPES:
        deduction = {
            'id': str(uuid.uuid4()),
            'name': deduction_data['name'],
            'type': deduction_data['type'],
            'amount': deduction_data.get('amount', 0),
            'percentage': deduction_data.get('percentage'),
            'is_percentage': deduction_data['is_percentage'],
            'is_mandatory': deduction_data['is_mandatory'],
            'created_at': datetime.now(timezone.utc)
        }
        deductions.append(deduction)
    
    await db.deductions.insert_many(deductions)
    print(f"Created {len(deductions)} deductions")
    return deductions

async def create_payroll_records(employees, deductions):
    """Create comprehensive payroll records for the last 12 months"""
    print("Creating payroll records...")
    
    payroll_records = []
    current_date = datetime.now()
    
    # Generate payroll for last 12 months
    for month_offset in range(12):
        target_date = current_date - timedelta(days=30 * month_offset)
        month = target_date.month
        year = target_date.year
        
        print(f"  Processing payroll for {month}/{year}...")
        
        for employee in employees:
            # Skip employees who hadn't joined yet
            joining_date = employee['joining_date']
            payroll_date = datetime(year, month, 1, tzinfo=timezone.utc)
            if payroll_date < joining_date:
                continue
            
            base_salary = employee['base_salary']
            
            # Add some randomness to overtime and bonuses
            overtime_hours = random.randint(0, 20)
            overtime_rate = base_salary / 160  # Assuming 160 hours per month
            
            # Bonuses (random, not every month)
            bonuses = 0
            if random.random() < 0.3:  # 30% chance of bonus
                bonuses = random.randint(500, 5000)
            
            # Calculate gross salary
            gross_salary = base_salary + (overtime_hours * overtime_rate) + bonuses
            
            # Apply deductions
            applied_deductions = []
            total_deductions = 0
            
            for deduction in deductions:
                # Skip optional deductions randomly
                if not deduction['is_mandatory'] and random.random() < 0.4:
                    continue
                
                if deduction['is_percentage']:
                    amount = gross_salary * (deduction['percentage'] / 100)
                else:
                    amount = deduction['amount']
                
                applied_deductions.append({
                    'name': deduction['name'],
                    'type': deduction['type'],
                    'amount': amount
                })
                total_deductions += amount
            
            # Calculate net salary
            net_salary = gross_salary - total_deductions
            
            payroll_record = {
                'id': str(uuid.uuid4()),
                'employee_id': employee['employee_id'],
                'month': month,
                'year': year,
                'base_salary': base_salary,
                'overtime_hours': overtime_hours,
                'overtime_rate': overtime_rate,
                'bonuses': bonuses,
                'gross_salary': gross_salary,
                'deductions': applied_deductions,
                'total_deductions': total_deductions,
                'net_salary': net_salary,
                'status': 'processed',
                'processed_date': payroll_date,
                'created_at': datetime.now(timezone.utc)
            }
            
            payroll_records.append(payroll_record)
    
    # Insert in batches to avoid memory issues
    batch_size = 1000
    for i in range(0, len(payroll_records), batch_size):
        batch = payroll_records[i:i + batch_size]
        await db.payroll_records.insert_many(batch)
        print(f"  Inserted batch {i//batch_size + 1}/{(len(payroll_records) + batch_size - 1)//batch_size}")
    
    print(f"Created {len(payroll_records)} payroll records")

async def create_reimbursements(employees):
    """Create reimbursement records"""
    print("Creating reimbursements...")
    
    reimbursements = []
    
    # Create reimbursements for random employees over the last 6 months
    for _ in range(300):  # Create 300 reimbursements
        employee = random.choice(employees)
        category = random.choice(REIMBURSEMENT_CATEGORIES)
        
        # Generate amount based on category
        amount_ranges = {
            'travel': (50, 2000),
            'medical': (100, 1500),
            'food': (20, 200),
            'equipment': (100, 3000),
            'training': (200, 5000),
            'other': (50, 1000)
        }
        
        amount_range = amount_ranges[category]
        amount = random.randint(amount_range[0], amount_range[1])
        
        # Random submission date in last 6 months
        submitted_date = fake.date_time_between(start_date='-6M', end_date='now', tzinfo=timezone.utc)
        
        # Random status
        status_weights = {'pending': 0.2, 'approved': 0.6, 'rejected': 0.1, 'paid': 0.1}
        status = random.choices(list(status_weights.keys()), weights=list(status_weights.values()))[0]
        
        processed_date = None
        processed_by = None
        if status != 'pending':
            processed_date = submitted_date + timedelta(days=random.randint(1, 14))
            processed_by = str(uuid.uuid4())  # Random admin/payroll officer ID
        
        reimbursement = {
            'id': str(uuid.uuid4()),
            'employee_id': employee['employee_id'],
            'category': category,
            'amount': amount,
            'description': fake.text(max_nb_chars=200),
            'receipt_url': fake.url() if random.random() < 0.7 else None,
            'status': status,
            'submitted_date': submitted_date,
            'processed_date': processed_date,
            'processed_by': processed_by
        }
        
        reimbursements.append(reimbursement)
    
    await db.reimbursements.insert_many(reimbursements)
    print(f"Created {len(reimbursements)} reimbursements")

async def clear_existing_data():
    """Clear existing data"""
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.deductions.delete_many({})
    await db.payroll_records.delete_many({})
    await db.reimbursements.delete_many({})
    print("Existing data cleared")

async def main():
    print("Starting to populate Payroll Management System with dummy data...")
    print("=" * 60)
    
    # Clear existing data
    await clear_existing_data()
    
    # Create data in order
    await create_users()
    employees = await create_employees()
    deductions = await create_deductions()
    await create_payroll_records(employees, deductions)
    await create_reimbursements(employees)
    
    print("=" * 60)
    print("Dummy data population completed successfully!")
    print(f"Created:")
    print(f"  - {await db.users.count_documents({})} users")
    print(f"  - {await db.employees.count_documents({})} employees")
    print(f"  - {await db.deductions.count_documents({})} deductions")
    print(f"  - {await db.payroll_records.count_documents({})} payroll records")
    print(f"  - {await db.reimbursements.count_documents({})} reimbursements")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())