from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import hashlib
import jwt
from decimal import Decimal
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Helper function to hash passwords
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Helper function to create JWT token
def create_jwt_token(user_data: dict) -> str:
    return jwt.encode(user_data, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Helper function to verify JWT token
def verify_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": token_data["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Models
class UserRole(str):
    ADMIN = "admin"
    PAYROLL_OFFICER = "payroll_officer"
    EMPLOYEE = "employee"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: str
    employee_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str
    employee_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    department: str
    position: str
    joining_date: datetime
    base_salary: float
    bank_account: str
    tax_id: str
    address: str
    status: str = "active"  # active, inactive, terminated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    department: str
    position: str
    joining_date: datetime
    base_salary: float
    bank_account: str
    tax_id: str
    address: str

class Deduction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # tax, pf, insurance, other
    amount: float
    percentage: Optional[float] = None
    is_percentage: bool = False
    is_mandatory: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeductionCreate(BaseModel):
    name: str
    type: str
    amount: float = 0
    percentage: Optional[float] = None
    is_percentage: bool = False
    is_mandatory: bool = True

class PayrollRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    month: int
    year: int
    base_salary: float
    overtime_hours: float = 0
    overtime_rate: float = 0
    bonuses: float = 0
    gross_salary: float
    deductions: List[Dict[str, Any]] = []
    total_deductions: float
    net_salary: float
    status: str = "draft"  # draft, processed, paid
    processed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PayrollRecordCreate(BaseModel):
    employee_id: str
    month: int
    year: int
    overtime_hours: float = 0
    bonuses: float = 0

class Reimbursement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    category: str  # travel, medical, food, other
    amount: float
    description: str
    receipt_url: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected, paid
    submitted_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_date: Optional[datetime] = None
    processed_by: Optional[str] = None

class ReimbursementCreate(BaseModel):
    category: str
    amount: float
    description: str
    receipt_url: Optional[str] = None

# Authentication Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    del user_dict['password']
    user = User(**user_dict)
    
    # Store user with hashed password
    user_doc = user.dict()
    user_doc['password'] = hashed_password
    await db.users.insert_one(user_doc)
    
    return {"message": "User created successfully", "user_id": user.id}

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"username": login_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    hashed_password = hash_password(login_data.password)
    if user['password'] != hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token_data = {"user_id": user['id'], "role": user['role']}
    token = create_jwt_token(token_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role'],
            "employee_id": user.get('employee_id')
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'],
        "username": current_user['username'],
        "email": current_user['email'],
        "role": current_user['role'],
        "employee_id": current_user.get('employee_id')
    }

# Employee Routes
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if employee ID already exists
    existing_employee = await db.employees.find_one({"employee_id": employee_data.employee_id})
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    employee = Employee(**employee_data.dict())
    await db.employees.insert_one(employee.dict())
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    employees = await db.employees.find({"status": "active"}).to_list(1000)
    return [Employee(**emp) for emp in employees]

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    # Employees can only view their own data
    if current_user['role'] == 'employee' and current_user.get('employee_id') != employee_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return Employee(**employee)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    updated_data = employee_data.dict()
    updated_data['id'] = employee['id']
    updated_data['created_at'] = employee['created_at']
    
    updated_employee = Employee(**updated_data)
    await db.employees.replace_one({"employee_id": employee_id}, updated_employee.dict())
    return updated_employee

# Deduction Routes
@api_router.post("/deductions", response_model=Deduction)
async def create_deduction(deduction_data: DeductionCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    deduction = Deduction(**deduction_data.dict())
    await db.deductions.insert_one(deduction.dict())
    return deduction

@api_router.get("/deductions", response_model=List[Deduction])
async def get_deductions(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    deductions = await db.deductions.find().to_list(1000)
    return [Deduction(**ded) for ded in deductions]

# Payroll Routes
@api_router.post("/payroll", response_model=PayrollRecord)
async def process_payroll(payroll_data: PayrollRecordCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get employee data
    employee = await db.employees.find_one({"employee_id": payroll_data.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate gross salary
    base_salary = employee['base_salary']
    overtime_amount = payroll_data.overtime_hours * (base_salary / 160)  # Assuming 160 hours per month
    gross_salary = base_salary + overtime_amount + payroll_data.bonuses
    
    # Get applicable deductions
    deductions = await db.deductions.find().to_list(1000)
    applied_deductions = []
    total_deductions = 0
    
    for deduction in deductions:
        if deduction['is_percentage']:
            amount = gross_salary * (deduction['percentage'] / 100)
        else:
            amount = deduction['amount']
        
        applied_deductions.append({
            "name": deduction['name'],
            "type": deduction['type'],
            "amount": amount
        })
        total_deductions += amount
    
    # Calculate net salary
    net_salary = gross_salary - total_deductions
    
    # Create payroll record
    payroll_record = PayrollRecord(
        employee_id=payroll_data.employee_id,
        month=payroll_data.month,
        year=payroll_data.year,
        base_salary=base_salary,
        overtime_hours=payroll_data.overtime_hours,
        overtime_rate=base_salary / 160,
        bonuses=payroll_data.bonuses,
        gross_salary=gross_salary,
        deductions=applied_deductions,
        total_deductions=total_deductions,
        net_salary=net_salary,
        status="processed",
        processed_date=datetime.now(timezone.utc)
    )
    
    await db.payroll_records.insert_one(payroll_record.dict())
    return payroll_record

@api_router.get("/payroll", response_model=List[PayrollRecord])
async def get_payroll_records(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'employee':
        # Employees can only see their own payroll records
        payroll_records = await db.payroll_records.find({"employee_id": current_user.get('employee_id')}).to_list(1000)
    else:
        # Admins and payroll officers can see all records
        payroll_records = await db.payroll_records.find().to_list(1000)
    
    return [PayrollRecord(**record) for record in payroll_records]

@api_router.get("/payroll/{employee_id}")
async def get_employee_payroll(employee_id: str, current_user: dict = Depends(get_current_user)):
    # Employees can only view their own payroll
    if current_user['role'] == 'employee' and current_user.get('employee_id') != employee_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    payroll_records = await db.payroll_records.find({"employee_id": employee_id}).to_list(1000)
    return [PayrollRecord(**record) for record in payroll_records]

# Reimbursement Routes
@api_router.post("/reimbursements", response_model=Reimbursement)
async def create_reimbursement(reimbursement_data: ReimbursementCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('employee_id'):
        raise HTTPException(status_code=400, detail="Employee ID required")
    
    reimbursement = Reimbursement(
        employee_id=current_user['employee_id'],
        **reimbursement_data.dict()
    )
    await db.reimbursements.insert_one(reimbursement.dict())
    return reimbursement

@api_router.get("/reimbursements", response_model=List[Reimbursement])
async def get_reimbursements(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'employee':
        # Employees can only see their own reimbursements
        reimbursements = await db.reimbursements.find({"employee_id": current_user.get('employee_id')}).to_list(1000)
    else:
        # Admins and payroll officers can see all reimbursements
        reimbursements = await db.reimbursements.find().to_list(1000)
    
    return [Reimbursement(**reimb) for reimb in reimbursements]

@api_router.put("/reimbursements/{reimbursement_id}/approve")
async def approve_reimbursement(reimbursement_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    await db.reimbursements.update_one(
        {"id": reimbursement_id},
        {
            "$set": {
                "status": "approved",
                "processed_date": datetime.now(timezone.utc),
                "processed_by": current_user['id']
            }
        }
    )
    return {"message": "Reimbursement approved"}

# Dashboard Analytics
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'payroll_officer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get current month/year
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    # Total employees
    total_employees = await db.employees.count_documents({"status": "active"})
    
    # Current month payroll cost
    payroll_records = await db.payroll_records.find({
        "month": current_month,
        "year": current_year,
        "status": "processed"
    }).to_list(1000)
    
    monthly_payroll_cost = sum(record['net_salary'] for record in payroll_records)
    
    # Pending reimbursements
    pending_reimbursements = await db.reimbursements.count_documents({"status": "pending"})
    
    # Monthly deductions breakdown
    deductions_breakdown = {}
    for record in payroll_records:
        for deduction in record['deductions']:
            deduction_type = deduction['type']
            if deduction_type not in deductions_breakdown:
                deductions_breakdown[deduction_type] = 0
            deductions_breakdown[deduction_type] += deduction['amount']
    
    return {
        "total_employees": total_employees,
        "monthly_payroll_cost": monthly_payroll_cost,
        "pending_reimbursements": pending_reimbursements,
        "deductions_breakdown": deductions_breakdown,
        "processed_payrolls": len(payroll_records)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()