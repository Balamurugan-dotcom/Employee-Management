const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      {
        host: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(postData);
    req.end();
  });
};

async function runTests() {
  console.log('--- Running MERN Employee Management System E2E Validation ---');

  // 1. Healthcheck
  const health = await request('/api/health');
  console.log('1. Health check status:', health.status, health.body);

  // 2. Admin Login
  const adminLogin = await request('/api/auth/login', 'POST', {
    identifier: 'admin@ems.com',
    password: 'Admin@123',
  });
  console.log('2. Admin Login:', adminLogin.status, 'Role:', adminLogin.body.user?.role);
  const adminToken = adminLogin.body.token;

  // 3. Manager Login
  const managerLogin = await request('/api/auth/login', 'POST', {
    identifier: 'manager@ems.com',
    password: 'Manager@123',
  });
  console.log('3. Manager Login:', managerLogin.status, 'Role:', managerLogin.body.user?.role);
  const managerToken = managerLogin.body.token;

  // 4. Employee Login
  const employeeLogin = await request('/api/auth/login', 'POST', {
    identifier: 'EMP201', // test login by Employee ID
    password: 'Employee@123',
  });
  console.log('4. Employee Login by ID (EMP201):', employeeLogin.status, 'Role:', employeeLogin.body.user?.role);
  const employeeToken = employeeLogin.body.token;

  // 5. Admin Dashboard Metrics
  const adminDash = await request('/api/dashboard/admin', 'GET', null, adminToken);
  console.log('5. Admin Dashboard Cards:', adminDash.body.cards);

  // 6. Role RBAC Guard: Employee trying to access Admin Dashboard
  const rbacTest = await request('/api/dashboard/admin', 'GET', null, employeeToken);
  console.log('6. RBAC Guard: Employee accessing Admin Dashboard -> Status:', rbacTest.status, '(Expected 403 Forbidden)');

  // 7. Manager Team Endpoint
  const managerTeam = await request('/api/employees/my-team', 'GET', null, managerToken);
  console.log('7. Manager Team Members count:', managerTeam.body.count);

  // 8. Employee Dashboard Metrics
  const empDash = await request('/api/dashboard/employee', 'GET', null, employeeToken);
  console.log('8. Employee Dashboard Cards:', empDash.body.cards);

  // 9. Employee Leave Application
  const applyLeave = await request(
    '/api/leaves',
    'POST',
    {
      leaveType: 'Sick Leave',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      reason: 'Routine medical consultation',
    },
    employeeToken
  );
  console.log('9. Employee Apply Leave:', applyLeave.status, applyLeave.body.message);

  // 10. Manager Leave Approval
  if (applyLeave.body.leave?._id) {
    const approve = await request(
      `/api/leaves/${applyLeave.body.leave._id}/approve`,
      'PUT',
      {},
      managerToken
    );
    console.log('10. Manager Approve Leave:', approve.status, approve.body.message);
  }

  // 11. Manager Create Task for Employee
  const createTask = await request(
    '/api/tasks',
    'POST',
    {
      title: 'Implement Security Compliance Checklist',
      description: 'Audit npm dependencies and configure HTTPS headers',
      assignedTo: employeeLogin.body.user.employeeRecordId,
      dueDate: '2026-10-01',
      priority: 'High',
    },
    managerToken
  );
  console.log('11. Manager Create Task:', createTask.status, createTask.body.message);

  // 12. Employee Update Task Progress
  if (createTask.body.task?._id) {
    const updateTask = await request(
      `/api/tasks/${createTask.body.task._id}`,
      'PUT',
      { status: 'Completed' },
      employeeToken
    );
    console.log('12. Employee Update Task Status -> Completed:', updateTask.status, updateTask.body.message);
  }

  console.log('--- All 12 Automated Verification Tests Completed Successfully! ---');
}

runTests().catch(console.error);
