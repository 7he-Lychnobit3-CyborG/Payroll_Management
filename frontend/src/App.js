import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { toast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';

// Icons
import { Users, DollarSign, FileText, Calculator, TrendingUp, Clock, Award, Building, Phone, Mail, Calendar, CreditCard, Receipt, Filter, Download, Plus, Edit, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
      toast({
        title: "Login Successful",
        description: "Welcome to Payroll Management System"
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Payroll Central</CardTitle>
            <CardDescription className="text-slate-600">
              Comprehensive Payroll Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-center text-slate-600 mb-3">Demo Credentials:</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-slate-50 p-2 rounded">
                  <span className="font-medium">Admin:</span>
                  <span>admin / admin123</span>
                </div>
                <div className="flex justify-between bg-slate-50 p-2 rounded">
                  <span className="font-medium">Payroll Officer:</span>
                  <span>payroll / payroll123</span>
                </div>
                <div className="flex justify-between bg-slate-50 p-2 rounded">
                  <span className="font-medium">Employee:</span>
                  <span>gary.le / employee123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Dashboard Components
const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }) => (
  <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className="text-xs text-slate-500 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Admin Dashboard
const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isProcessPayrollOpen, setIsProcessPayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joining_date: '',
    base_salary: '',
    bank_account: '',
    tax_id: '',
    address: ''
  });

  const [payrollData, setPayrollData] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    overtime_hours: 0,
    bonuses: 0
  });

  useEffect(() => {
    fetchAnalytics();
    fetchEmployees();
    fetchPayrollRecords();
    fetchReimbursements();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      const response = await axios.get(`${API}/payroll`);
      setPayrollRecords(response.data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    }
  };

  const fetchReimbursements = async () => {
    try {
      const response = await axios.get(`${API}/reimbursements`);
      setReimbursements(response.data);
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/employees`, {
        ...newEmployee,
        joining_date: new Date(newEmployee.joining_date).toISOString(),
        base_salary: parseFloat(newEmployee.base_salary)
      });
      
      toast({
        title: "Success",
        description: "Employee added successfully"
      });
      
      setIsAddEmployeeOpen(false);
      setNewEmployee({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        joining_date: '',
        base_salary: '',
        bank_account: '',
        tax_id: '',
        address: ''
      });
      fetchEmployees();
      fetchAnalytics();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add employee",
        variant: "destructive"
      });
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/employees/${selectedEmployee.employee_id}`, {
        ...selectedEmployee,
        joining_date: new Date(selectedEmployee.joining_date).toISOString(),
        base_salary: parseFloat(selectedEmployee.base_salary)
      });
      
      toast({
        title: "Success",
        description: "Employee updated successfully"
      });
      
      setIsEditEmployeeOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive"
      });
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/payroll`, payrollData);
      
      toast({
        title: "Success",
        description: "Payroll processed successfully"
      });
      
      setIsProcessPayrollOpen(false);
      setPayrollData({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        overtime_hours: 0,
        bonuses: 0
      });
      fetchPayrollRecords();
      fetchAnalytics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive"
      });
    }
  };

  const handleApproveReimbursement = async (reimbursementId) => {
    try {
      await axios.put(`${API}/reimbursements/${reimbursementId}/approve`);
      toast({
        title: "Success",
        description: "Reimbursement approved"
      });
      fetchReimbursements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve reimbursement",
        variant: "destructive"
      });
    }
  };

  const handleRejectReimbursement = async (reimbursementId) => {
    try {
      await axios.put(`${API}/reimbursements/${reimbursementId}`, {
        status: 'rejected'
      });
      toast({
        title: "Success",
        description: "Reimbursement rejected"
      });
      fetchReimbursements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject reimbursement",
        variant: "destructive"
      });
    }
  };

  const exportData = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || '0'}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Comprehensive payroll management overview</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={analytics.total_employees}
            icon={Users}
            trend="+12% from last month"
            color="blue"
          />
          <StatCard
            title="Monthly Payroll"
            value={formatCurrency(analytics.monthly_payroll_cost)}
            icon={DollarSign}
            trend="+8% from last month"
            color="emerald"
          />
          <StatCard
            title="Processed Payrolls"
            value={analytics.processed_payrolls}
            icon={CheckCircle}
            trend="Current month"
            color="purple"
          />
          <StatCard
            title="Pending Reimbursements"
            value={analytics.pending_reimbursements}
            icon={AlertCircle}
            trend="Needs attention"
            color="orange"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Employees
          </TabsTrigger>
          <TabsTrigger value="payroll" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Payroll
          </TabsTrigger>
          <TabsTrigger value="reimbursements" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Reimbursements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payroll Activity */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Recent Payroll Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payrollRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{record.employee_id}</p>
                        <p className="text-xs text-slate-500">
                          {record.month}/{record.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(record.net_salary)}
                        </p>
                        <Badge variant={record.status === 'processed' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deductions Breakdown */}
            {analytics?.deductions_breakdown && (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Deductions Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.deductions_breakdown).map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>Manage employee information and records</CardDescription>
              </div>
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>Enter employee information to add them to the system</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee_id">Employee ID</Label>
                        <Input
                          id="employee_id"
                          value={newEmployee.employee_id}
                          onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                          placeholder="EMP0001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={newEmployee.first_name}
                          onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={newEmployee.last_name}
                          onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newEmployee.phone}
                          onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee({...newEmployee, department: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engineering">Engineering</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={newEmployee.position}
                          onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="base_salary">Base Salary</Label>
                        <Input
                          id="base_salary"
                          type="number"
                          value={newEmployee.base_salary}
                          onChange={(e) => setNewEmployee({...newEmployee, base_salary: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="joining_date">Joining Date</Label>
                        <Input
                          id="joining_date"
                          type="date"
                          value={newEmployee.joining_date}
                          onChange={(e) => setNewEmployee({...newEmployee, joining_date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax_id">Tax ID</Label>
                        <Input
                          id="tax_id"
                          value={newEmployee.tax_id}
                          onChange={(e) => setNewEmployee({...newEmployee, tax_id: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account">Bank Account</Label>
                      <Input
                        id="bank_account"
                        value={newEmployee.bank_account}
                        onChange={(e) => setNewEmployee({...newEmployee, bank_account: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={newEmployee.address}
                        onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        Add Employee
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{formatCurrency(employee.base_salary)}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsEditEmployeeOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>Update employee information</DialogDescription>
              </DialogHeader>
              {selectedEmployee && (
                <form onSubmit={handleEditEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name">First Name</Label>
                      <Input
                        id="edit_first_name"
                        value={selectedEmployee.first_name}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name">Last Name</Label>
                      <Input
                        id="edit_last_name"
                        value={selectedEmployee.last_name}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={selectedEmployee.email}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_phone">Phone</Label>
                      <Input
                        id="edit_phone"
                        value={selectedEmployee.phone}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_department">Department</Label>
                      <Select 
                        value={selectedEmployee.department} 
                        onValueChange={(value) => setSelectedEmployee({...selectedEmployee, department: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_position">Position</Label>
                      <Input
                        id="edit_position"
                        value={selectedEmployee.position}
                        onChange={(e) => setSelectedEmployee({...selectedEmployee, position: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_base_salary">Base Salary</Label>
                    <Input
                      id="edit_base_salary"
                      type="number"
                      value={selectedEmployee.base_salary}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, base_salary: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Update Employee
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Records</CardTitle>
                <CardDescription>Process and manage employee payroll</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => exportData(payrollRecords, 'payroll_records')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Dialog open={isProcessPayrollOpen} onOpenChange={setIsProcessPayrollOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Process Payroll
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Process New Payroll</DialogTitle>
                      <DialogDescription>Process payroll for an employee</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProcessPayroll} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payroll_employee">Select Employee</Label>
                        <Select 
                          value={payrollData.employee_id} 
                          onValueChange={(value) => setPayrollData({...payrollData, employee_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.employee_id} value={employee.employee_id}>
                                {employee.employee_id} - {employee.first_name} {employee.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payroll_month">Month</Label>
                          <Select 
                            value={payrollData.month.toString()} 
                            onValueChange={(value) => setPayrollData({...payrollData, month: parseInt(value)})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 12}, (_, i) => (
                                <SelectItem key={i+1} value={(i+1).toString()}>
                                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payroll_year">Year</Label>
                          <Select 
                            value={payrollData.year.toString()} 
                            onValueChange={(value) => setPayrollData({...payrollData, year: parseInt(value)})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payroll_overtime">Overtime Hours</Label>
                        <Input
                          id="payroll_overtime"
                          type="number"
                          min="0"
                          step="0.5"
                          value={payrollData.overtime_hours}
                          onChange={(e) => setPayrollData({...payrollData, overtime_hours: parseFloat(e.target.value) || 0})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payroll_bonuses">Bonuses ($)</Label>
                        <Input
                          id="payroll_bonuses"
                          type="number"
                          min="0"
                          step="0.01"
                          value={payrollData.bonuses}
                          onChange={(e) => setPayrollData({...payrollData, bonuses: parseFloat(e.target.value) || 0})}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                          Process Payroll
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsProcessPayrollOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee_id}</TableCell>
                      <TableCell>{record.month}/{record.year}</TableCell>
                      <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(record.total_deductions)}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        {formatCurrency(record.net_salary)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'processed' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reimbursements" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Reimbursement Requests</CardTitle>
              <CardDescription>Review and approve employee reimbursements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reimbursements.map((reimbursement) => (
                    <TableRow key={reimbursement.id}>
                      <TableCell className="font-medium">{reimbursement.employee_id}</TableCell>
                      <TableCell className="capitalize">{reimbursement.category}</TableCell>
                      <TableCell>{formatCurrency(reimbursement.amount)}</TableCell>
                      <TableCell className="max-w-xs truncate">{reimbursement.description}</TableCell>
                      <TableCell>
                        <Badge variant={
                          reimbursement.status === 'approved' ? 'default' :
                          reimbursement.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {reimbursement.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(reimbursement.submitted_date)}</TableCell>
                      <TableCell>
                        {reimbursement.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApproveReimbursement(reimbursement.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectReimbursement(reimbursement.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {reimbursement.status !== 'pending' && (
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Employee Dashboard
const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({
    category: '',
    amount: '',
    description: '',
    receipt_url: ''
  });

  useEffect(() => {
    if (user?.employee_id) {
      fetchPayrollRecords();
      fetchReimbursements();
    }
  }, [user]);

  const fetchPayrollRecords = async () => {
    try {
      const response = await axios.get(`${API}/payroll`);
      setPayrollRecords(response.data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    }
  };

  const fetchReimbursements = async () => {
    try {
      const response = await axios.get(`${API}/reimbursements`);
      setReimbursements(response.data);
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
    }
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/reimbursements`, {
        ...newClaim,
        amount: parseFloat(newClaim.amount)
      });
      
      toast({
        title: "Success",
        description: "Reimbursement claim submitted successfully"
      });
      
      setIsNewClaimOpen(false);
      setNewClaim({
        category: '',
        amount: '',
        description: '',
        receipt_url: ''
      });
      fetchReimbursements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit reimbursement claim",
        variant: "destructive"
      });
    }
  };

  const downloadPayslip = (record) => {
    // Create a simple HTML payslip
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${record.employee_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { border-top: 2px solid #000; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payroll Central</h1>
          <h2>Employee Payslip</h2>
        </div>
        <div class="details">
          <div class="row"><span>Employee ID:</span><span>${record.employee_id}</span></div>
          <div class="row"><span>Period:</span><span>${record.month}/${record.year}</span></div>
          <div class="row"><span>Base Salary:</span><span>$${record.base_salary.toLocaleString()}</span></div>
          <div class="row"><span>Overtime:</span><span>$${(record.overtime_hours * record.overtime_rate).toLocaleString()}</span></div>
          <div class="row"><span>Bonuses:</span><span>$${record.bonuses.toLocaleString()}</span></div>
          <div class="row"><span>Gross Salary:</span><span>$${record.gross_salary.toLocaleString()}</span></div>
          <div class="row"><span>Total Deductions:</span><span>-$${record.total_deductions.toLocaleString()}</span></div>
          <div class="row total"><span>Net Salary:</span><span>$${record.net_salary.toLocaleString()}</span></div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([payslipHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payslip_${record.employee_id}_${record.month}_${record.year}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Payslip downloaded successfully"
    });
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || '0'}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const latestPayroll = payrollRecords[0];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.username}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Current Salary"
          value={latestPayroll ? formatCurrency(latestPayroll.net_salary) : "$0"}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Reimbursements"
          value={reimbursements.length}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Pending Claims"
          value={reimbursements.filter(r => r.status === 'pending').length}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Payslip */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Latest Payslip
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestPayroll ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Period:</span>
                  <span className="font-medium">{latestPayroll.month}/{latestPayroll.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Base Salary:</span>
                  <span className="font-medium">{formatCurrency(latestPayroll.base_salary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Bonuses:</span>
                  <span className="font-medium">{formatCurrency(latestPayroll.bonuses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Deductions:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(latestPayroll.total_deductions)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Net Salary:</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    {formatCurrency(latestPayroll.net_salary)}
                  </span>
                </div>
                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download Payslip
                </Button>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No payroll records found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reimbursements */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              My Reimbursements
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reimbursements.slice(0, 5).map((reimbursement) => (
                <div key={reimbursement.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize">{reimbursement.category}</p>
                    <p className="text-xs text-slate-500">{formatDate(reimbursement.submitted_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(reimbursement.amount)}</p>
                    <Badge variant={
                      reimbursement.status === 'approved' ? 'default' :
                      reimbursement.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {reimbursement.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary History */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Salary History</CardTitle>
          <CardDescription>Your payroll records over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.month}/{record.year}</TableCell>
                  <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                  <TableCell>{formatCurrency(record.overtime_hours * record.overtime_rate)}</TableCell>
                  <TableCell>{formatCurrency(record.bonuses)}</TableCell>
                  <TableCell className="text-red-600">-{formatCurrency(record.total_deductions)}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    {formatCurrency(record.net_salary)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Payroll Officer Dashboard
const PayrollOfficerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [activeTab, setActiveTab] = useState('process');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payrollData, setPayrollData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    overtime_hours: 0,
    bonuses: 0
  });

  useEffect(() => {
    fetchAnalytics();
    fetchEmployees();
    fetchPayrollRecords();
    fetchDeductions();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      const response = await axios.get(`${API}/payroll`);
      setPayrollRecords(response.data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    }
  };

  const fetchDeductions = async () => {
    try {
      const response = await axios.get(`${API}/deductions`);
      setDeductions(response.data);
    } catch (error) {
      console.error('Error fetching deductions:', error);
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayroll(true);
    try {
      await axios.post(`${API}/payroll`, {
        employee_id: selectedEmployee,
        ...payrollData
      });
      
      toast({
        title: "Success",
        description: "Payroll processed successfully"
      });
      
      fetchPayrollRecords();
      fetchAnalytics();
      setSelectedEmployee('');
      setPayrollData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        overtime_hours: 0,
        bonuses: 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleBulkProcessPayroll = async () => {
    setIsProcessingPayroll(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Process payroll for all active employees
      const promises = employees.map(employee => 
        axios.post(`${API}/payroll`, {
          employee_id: employee.employee_id,
          month: currentMonth,
          year: currentYear,
          overtime_hours: 0,
          bonuses: 0
        })
      );

      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: `Processed payroll for ${employees.length} employees`
      });
      
      fetchPayrollRecords();
      fetchAnalytics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk payroll",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || '0'}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payroll Officer Dashboard</h1>
          <p className="text-slate-600">Process salaries and manage payroll operations</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={analytics.total_employees}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Monthly Payroll"
            value={formatCurrency(analytics.monthly_payroll_cost)}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Processed This Month"
            value={analytics.processed_payrolls}
            icon={CheckCircle}
            color="purple"
          />
          <StatCard
            title="Pending Processing"
            value={analytics.total_employees - analytics.processed_payrolls}
            icon={Clock}
            color="orange"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-sm">
          <TabsTrigger value="process" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Process Payroll
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Payroll Records
          </TabsTrigger>
          <TabsTrigger value="deductions" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Manage Deductions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Individual Payroll Processing */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Process Individual Payroll
                </CardTitle>
                <CardDescription>Process payroll for a specific employee</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProcessPayroll} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Select Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.employee_id} value={employee.employee_id}>
                            {employee.employee_id} - {employee.first_name} {employee.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Month</Label>
                      <Select 
                        value={payrollData.month.toString()} 
                        onValueChange={(value) => setPayrollData({...payrollData, month: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                            <SelectItem key={i+1} value={(i+1).toString()}>
                              {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Select 
                        value={payrollData.year.toString()} 
                        onValueChange={(value) => setPayrollData({...payrollData, year: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overtime">Overtime Hours</Label>
                    <Input
                      id="overtime"
                      type="number"
                      min="0"
                      step="0.5"
                      value={payrollData.overtime_hours}
                      onChange={(e) => setPayrollData({...payrollData, overtime_hours: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonuses">Bonuses ($)</Label>
                    <Input
                      id="bonuses"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payrollData.bonuses}
                      onChange={(e) => setPayrollData({...payrollData, bonuses: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isProcessingPayroll}
                  >
                    {isProcessingPayroll ? 'Processing...' : 'Process Payroll'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Bulk Payroll Processing */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Bulk Payroll Processing
                </CardTitle>
                <CardDescription>Process payroll for all employees at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {employees.length}
                  </div>
                  <p className="text-slate-600">Active Employees</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Month:</span>
                    <span className="font-medium">
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Cost:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(employees.reduce((sum, emp) => sum + emp.base_salary, 0))}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleBulkProcessPayroll}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isProcessingPayroll}
                >
                  {isProcessingPayroll ? 'Processing All...' : 'Process All Employee Payrolls'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payroll Records</CardTitle>
                <CardDescription>View and manage processed payrolls</CardDescription>
              </div>
              <Button variant="outline" className="text-emerald-600">
                <Download className="w-4 h-4 mr-2" />
                Export Records
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.slice(0, 20).map((record) => {
                    const employee = employees.find(emp => emp.employee_id === record.employee_id);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employee_id}</TableCell>
                        <TableCell>
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'N/A'}
                        </TableCell>
                        <TableCell>{record.month}/{record.year}</TableCell>
                        <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                        <TableCell>{formatCurrency(record.gross_salary)}</TableCell>
                        <TableCell className="text-red-600">-{formatCurrency(record.total_deductions)}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {formatCurrency(record.net_salary)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'processed' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Manage Deductions</CardTitle>
              <CardDescription>View and manage payroll deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deduction Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate/Amount</TableHead>
                    <TableHead>Mandatory</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">{deduction.name}</TableCell>
                      <TableCell className="capitalize">{deduction.type}</TableCell>
                      <TableCell>
                        {deduction.is_percentage 
                          ? `${deduction.percentage}%` 
                          : formatCurrency(deduction.amount)
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={deduction.is_mandatory ? 'default' : 'secondary'}>
                          {deduction.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">Payroll Central</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="text-slate-600 hover:text-slate-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardRouter />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'payroll_officer') {
    return <PayrollOfficerDashboard />;
  } else if (user?.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return <Navigate to="/login" replace />;
};

export default App;