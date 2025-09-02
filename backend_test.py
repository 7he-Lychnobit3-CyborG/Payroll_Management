import requests
import sys
from datetime import datetime
import json

class PayrollAPITester:
    def __init__(self, base_url="https://payslip-central.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.users = {}
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, role=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        elif role and role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[role]}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication for all user roles"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test credentials from the review request
        test_users = [
            {"username": "admin", "password": "admin123", "role": "admin"},
            {"username": "payroll", "password": "payroll123", "role": "payroll_officer"},
            {"username": "gary.le", "password": "employee123", "role": "employee"}
        ]
        
        for user_data in test_users:
            success, response = self.run_test(
                f"Login as {user_data['role']}",
                "POST",
                "auth/login",
                200,
                data={"username": user_data["username"], "password": user_data["password"]}
            )
            
            if success and 'access_token' in response:
                self.tokens[user_data['role']] = response['access_token']
                self.users[user_data['role']] = response['user']
                print(f"   Token stored for {user_data['role']}")
                
                # Test /auth/me endpoint
                me_success, me_response = self.run_test(
                    f"Get current user info ({user_data['role']})",
                    "GET",
                    "auth/me",
                    200,
                    token=self.tokens[user_data['role']]
                )
                
                if me_success:
                    print(f"   User info: {me_response.get('username')} - {me_response.get('role')}")
            else:
                print(f"   ❌ Failed to login as {user_data['role']}")
                
        return len(self.tokens) >= 2  # At least 2 roles should work

    def test_analytics_dashboard(self):
        """Test analytics dashboard endpoint"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS DASHBOARD")
        print("="*50)
        
        # Test with admin role
        success, response = self.run_test(
            "Get dashboard analytics (Admin)",
            "GET",
            "analytics/dashboard",
            200,
            role="admin"
        )
        
        if success:
            print(f"   Total Employees: {response.get('total_employees', 'N/A')}")
            print(f"   Monthly Payroll Cost: ${response.get('monthly_payroll_cost', 0):,.2f}")
            print(f"   Pending Reimbursements: {response.get('pending_reimbursements', 'N/A')}")
            print(f"   Processed Payrolls: {response.get('processed_payrolls', 'N/A')}")
            
        # Test access control - employee should not access
        if 'employee' in self.tokens:
            self.run_test(
                "Analytics access denied for employee",
                "GET",
                "analytics/dashboard",
                403,
                role="employee"
            )

    def test_employees_api(self):
        """Test employee management APIs"""
        print("\n" + "="*50)
        print("TESTING EMPLOYEE APIS")
        print("="*50)
        
        # Test get all employees (admin)
        success, response = self.run_test(
            "Get all employees (Admin)",
            "GET",
            "employees",
            200,
            role="admin"
        )
        
        if success:
            employees = response if isinstance(response, list) else []
            print(f"   Found {len(employees)} employees")
            if employees:
                print(f"   Sample employee: {employees[0].get('employee_id')} - {employees[0].get('first_name')} {employees[0].get('last_name')}")
        
        # Test access control - employee should not access all employees
        if 'employee' in self.tokens:
            self.run_test(
                "Employee list access denied for employee role",
                "GET",
                "employees",
                403,
                role="employee"
            )
            
        # Test get specific employee (employee can access their own)
        if 'employee' in self.users and self.users['employee'].get('employee_id'):
            employee_id = self.users['employee']['employee_id']
            self.run_test(
                f"Get own employee data ({employee_id})",
                "GET",
                f"employees/{employee_id}",
                200,
                role="employee"
            )

    def test_payroll_api(self):
        """Test payroll APIs"""
        print("\n" + "="*50)
        print("TESTING PAYROLL APIS")
        print("="*50)
        
        # Test get payroll records (admin)
        success, response = self.run_test(
            "Get payroll records (Admin)",
            "GET",
            "payroll",
            200,
            role="admin"
        )
        
        if success:
            payroll_records = response if isinstance(response, list) else []
            print(f"   Found {len(payroll_records)} payroll records")
            if payroll_records:
                record = payroll_records[0]
                print(f"   Sample record: {record.get('employee_id')} - {record.get('month')}/{record.get('year')} - ${record.get('net_salary', 0):,.2f}")
        
        # Test employee access to own payroll
        if 'employee' in self.tokens:
            success, response = self.run_test(
                "Get own payroll records (Employee)",
                "GET",
                "payroll",
                200,
                role="employee"
            )
            
            if success:
                employee_records = response if isinstance(response, list) else []
                print(f"   Employee has {len(employee_records)} payroll records")

    def test_reimbursements_api(self):
        """Test reimbursement APIs"""
        print("\n" + "="*50)
        print("TESTING REIMBURSEMENT APIS")
        print("="*50)
        
        # Test get reimbursements (admin)
        success, response = self.run_test(
            "Get all reimbursements (Admin)",
            "GET",
            "reimbursements",
            200,
            role="admin"
        )
        
        if success:
            reimbursements = response if isinstance(response, list) else []
            print(f"   Found {len(reimbursements)} reimbursements")
            if reimbursements:
                reimb = reimbursements[0]
                print(f"   Sample: {reimb.get('employee_id')} - {reimb.get('category')} - ${reimb.get('amount', 0):.2f} - {reimb.get('status')}")
        
        # Test employee access to own reimbursements
        if 'employee' in self.tokens:
            success, response = self.run_test(
                "Get own reimbursements (Employee)",
                "GET",
                "reimbursements",
                200,
                role="employee"
            )
            
            if success:
                employee_reimb = response if isinstance(response, list) else []
                print(f"   Employee has {len(employee_reimb)} reimbursements")
                
        # Test create reimbursement (employee)
        if 'employee' in self.tokens:
            test_reimbursement = {
                "category": "travel",
                "amount": 150.00,
                "description": "Test travel reimbursement for API testing"
            }
            
            self.run_test(
                "Create new reimbursement (Employee)",
                "POST",
                "reimbursements",
                200,
                data=test_reimbursement,
                role="employee"
            )

    def test_role_based_access_control(self):
        """Test role-based access control"""
        print("\n" + "="*50)
        print("TESTING ROLE-BASED ACCESS CONTROL")
        print("="*50)
        
        # Employee should not access admin endpoints
        if 'employee' in self.tokens:
            self.run_test(
                "Employee denied analytics access",
                "GET",
                "analytics/dashboard",
                403,
                role="employee"
            )
            
            self.run_test(
                "Employee denied all employees access",
                "GET",
                "employees",
                403,
                role="employee"
            )
        
        # Test without authentication
        self.run_test(
            "Unauthenticated analytics access denied",
            "GET",
            "analytics/dashboard",
            401
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Payroll Management System API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_authentication():
            print("\n❌ Authentication tests failed. Cannot proceed with other tests.")
            return False
            
        # Run other tests
        self.test_analytics_dashboard()
        self.test_employees_api()
        self.test_payroll_api()
        self.test_reimbursements_api()
        self.test_role_based_access_control()
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            failed = self.tests_run - self.tests_passed
            print(f"⚠️  {failed} tests failed")
            return False

def main():
    tester = PayrollAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())