const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Payroll = require('../models/Payroll');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems_database');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Payroll.deleteMany({});

    console.log('Existing data cleared.');

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'Eleanor Vance (System Admin)',
      email: 'admin@ems.com',
      password: 'Admin@123',
      role: 'admin',
      employeeId: 'ADM001',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const adminEmp = await Employee.create({
      employeeId: 'ADM001',
      user: adminUser._id,
      name: 'Eleanor Vance',
      email: 'admin@ems.com',
      phone: '+1 (555) 019-2834',
      dateOfBirth: new Date('1988-04-12'),
      gender: 'Female',
      address: '742 Evergreen Terrace, Suite 100, San Francisco, CA',
      department: 'Executive Administration',
      designation: 'Chief Technology Director / Admin',
      manager: null,
      managerName: 'Board of Directors',
      joiningDate: new Date('2021-01-15'),
      salary: 145000,
      profileImage: adminUser.avatar,
      status: 'Active',
    });

    // 2. Create Managers
    const manager1User = await User.create({
      name: 'Sarah Connor',
      email: 'manager@ems.com',
      password: 'Manager@123',
      role: 'manager',
      employeeId: 'MGR101',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });

    const manager1Emp = await Employee.create({
      employeeId: 'MGR101',
      user: manager1User._id,
      name: 'Sarah Connor',
      email: 'manager@ems.com',
      phone: '+1 (555) 234-5678',
      dateOfBirth: new Date('1990-08-22'),
      gender: 'Female',
      address: '101 Cyberdyne Way, Silicon Valley, CA',
      department: 'Engineering',
      designation: 'Engineering Team Lead & Manager',
      manager: adminUser._id,
      managerName: adminUser.name,
      joiningDate: new Date('2022-03-01'),
      salary: 115000,
      profileImage: manager1User.avatar,
      status: 'Active',
    });

    const manager2User = await User.create({
      name: 'David Miller',
      email: 'david.manager@ems.com',
      password: 'Manager@123',
      role: 'manager',
      employeeId: 'MGR102',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    const manager2Emp = await Employee.create({
      employeeId: 'MGR102',
      user: manager2User._id,
      name: 'David Miller',
      email: 'david.manager@ems.com',
      phone: '+1 (555) 345-6789',
      dateOfBirth: new Date('1991-11-05'),
      gender: 'Male',
      address: '52 Innovation Boulevard, Austin, TX',
      department: 'Design & UX',
      designation: 'Head of Product Design',
      manager: adminUser._id,
      managerName: adminUser.name,
      joiningDate: new Date('2022-06-15'),
      salary: 108000,
      profileImage: manager2User.avatar,
      status: 'Active',
    });

    // 3. Create Employees
    const emp1User = await User.create({
      name: 'Alex Morgan',
      email: 'employee@ems.com',
      password: 'Employee@123',
      role: 'employee',
      employeeId: 'EMP201',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    });

    const emp1 = await Employee.create({
      employeeId: 'EMP201',
      user: emp1User._id,
      name: 'Alex Morgan',
      email: 'employee@ems.com',
      phone: '+1 (555) 456-7890',
      dateOfBirth: new Date('1995-02-18'),
      gender: 'Male',
      address: '88 Market Street, Apt 4B, San Francisco, CA',
      department: 'Engineering',
      designation: 'Senior Full Stack Developer',
      manager: manager1User._id,
      managerName: manager1User.name,
      joiningDate: new Date('2023-01-10'),
      salary: 88000,
      profileImage: emp1User.avatar,
      status: 'Active',
    });

    const emp2User = await User.create({
      name: 'Emily Davis',
      email: 'emily.davis@ems.com',
      password: 'Employee@123',
      role: 'employee',
      employeeId: 'EMP202',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    const emp2 = await Employee.create({
      employeeId: 'EMP202',
      user: emp2User._id,
      name: 'Emily Davis',
      email: 'emily.davis@ems.com',
      phone: '+1 (555) 567-8901',
      dateOfBirth: new Date('1996-07-29'),
      gender: 'Female',
      address: '240 Willow Road, Palo Alto, CA',
      department: 'Engineering',
      designation: 'Frontend Engineer',
      manager: manager1User._id,
      managerName: manager1User.name,
      joiningDate: new Date('2023-04-12'),
      salary: 76000,
      profileImage: emp2User.avatar,
      status: 'Active',
    });

    const emp3User = await User.create({
      name: 'Michael Brown',
      email: 'michael.brown@ems.com',
      password: 'Employee@123',
      role: 'employee',
      employeeId: 'EMP203',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    });

    const emp3 = await Employee.create({
      employeeId: 'EMP203',
      user: emp3User._id,
      name: 'Michael Brown',
      email: 'michael.brown@ems.com',
      phone: '+1 (555) 678-9012',
      dateOfBirth: new Date('1994-09-14'),
      gender: 'Male',
      address: '12 Congress Ave, Austin, TX',
      department: 'Design & UX',
      designation: 'UI/UX Visual Designer',
      manager: manager2User._id,
      managerName: manager2User.name,
      joiningDate: new Date('2023-08-01'),
      salary: 72000,
      profileImage: emp3User.avatar,
      status: 'Active',
    });

    const emp4User = await User.create({
      name: 'Jessica Taylor',
      email: 'jessica.taylor@ems.com',
      password: 'Employee@123',
      role: 'employee',
      employeeId: 'EMP204',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    });

    const emp4 = await Employee.create({
      employeeId: 'EMP204',
      user: emp4User._id,
      name: 'Jessica Taylor',
      email: 'jessica.taylor@ems.com',
      phone: '+1 (555) 789-0123',
      dateOfBirth: new Date('1993-05-30'),
      gender: 'Female',
      address: '450 Pine Street, Seattle, WA',
      department: 'Human Resources',
      designation: 'HR Talent Specialist',
      manager: adminUser._id,
      managerName: adminUser.name,
      joiningDate: new Date('2023-09-20'),
      salary: 68000,
      profileImage: emp4User.avatar,
      status: 'Active',
    });

    // 4. Create Departments
    await Department.create([
      {
        departmentName: 'Engineering',
        departmentCode: 'ENG',
        description: 'Core software development, cloud infrastructure, and DevOps.',
        manager: manager1User._id,
        employees: [emp1._id, emp2._id],
      },
      {
        departmentName: 'Design & UX',
        departmentCode: 'DSN',
        description: 'Product design, design systems, UI wireframing, and user research.',
        manager: manager2User._id,
        employees: [emp3._id],
      },
      {
        departmentName: 'Human Resources',
        departmentCode: 'HR',
        description: 'Talent acquisition, employee welfare, compliance, and culture.',
        manager: adminUser._id,
        employees: [emp4._id],
      },
      {
        departmentName: 'Finance',
        departmentCode: 'FIN',
        description: 'Payroll accounting, budget forecasts, and financial auditing.',
        manager: null,
        employees: [],
      },
      {
        departmentName: 'Marketing',
        departmentCode: 'MKT',
        description: 'Brand positioning, digital campaigns, and community growth.',
        manager: null,
        employees: [],
      },
    ]);

    // 5. Create Projects
    const proj1 = await Project.create({
      projectName: 'Enterprise Cloud Migration 2026',
      description: 'Transitioning monolithic legacy services to scalable Kubernetes clusters.',
      manager: manager1User._id,
      teamMembers: [emp1._id, emp2._id],
      startDate: new Date('2026-08-01'),
      deadline: new Date('2026-12-15'),
      status: 'In Progress',
      progress: 65,
    });

    const proj2 = await Project.create({
      projectName: 'Mobile Design System 2.0',
      description: 'Unified cross-platform Figma token library and accessible components.',
      manager: manager2User._id,
      teamMembers: [emp3._id, emp2._id],
      startDate: new Date('2026-09-01'),
      deadline: new Date('2026-11-30'),
      status: 'In Progress',
      progress: 40,
    });

    // 6. Create Tasks
    await Task.create([
      {
        title: 'Architect JWT Auth Middleware & Role Guard',
        description: 'Implement token validation, role hierarchy, and secure cookies.',
        assignedTo: emp1._id,
        assignedBy: manager1User._id,
        project: proj1._id,
        priority: 'High',
        startDate: new Date('2026-09-20'),
        dueDate: new Date('2026-09-28'),
        status: 'In Progress',
        feedback: 'Great initial progress on role checks. Keep it clean!',
      },
      {
        title: 'Design Dashboard Glassmorphism UI Components',
        description: 'Create responsive stats widgets, cards, and data table layouts in CSS.',
        assignedTo: emp3._id,
        assignedBy: manager2User._id,
        project: proj2._id,
        priority: 'High',
        startDate: new Date('2026-09-21'),
        dueDate: new Date('2026-09-29'),
        status: 'Completed',
        feedback: 'Sensational visual hierarchy and vibrant palette.',
      },
      {
        title: 'Implement Interactive Attendance Check-In / Out',
        description: 'Build real-time punch-in punch-out with timestamp logging and hours counter.',
        assignedTo: emp1._id,
        assignedBy: manager1User._id,
        project: proj1._id,
        priority: 'Medium',
        startDate: new Date('2026-09-22'),
        dueDate: new Date('2026-09-30'),
        status: 'Pending',
      },
      {
        title: 'Optimize API Response Caching for Leaves',
        description: 'Benchmark leave request queries and add index on status and dates.',
        assignedTo: emp2._id,
        assignedBy: manager1User._id,
        project: proj1._id,
        priority: 'Medium',
        startDate: new Date('2026-09-23'),
        dueDate: new Date('2026-10-02'),
        status: 'In Progress',
      },
    ]);

    // 7. Create Today's and Historical Attendance
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    
    // Check in Alex Morgan today
    const checkInTime = new Date();
    checkInTime.setHours(9, 15, 0, 0);

    await Attendance.create({
      employee: emp1._id,
      user: emp1User._id,
      date: todayStr,
      checkIn: checkInTime,
      checkOut: null,
      status: 'Present',
      workingHours: 0,
      notes: 'Morning shift started on time',
    });

    // Check in Emily Davis today with checkout
    const emilyIn = new Date();
    emilyIn.setHours(9, 0, 0, 0);
    const emilyOut = new Date();
    emilyOut.setHours(17, 30, 0, 0);

    await Attendance.create({
      employee: emp2._id,
      user: emp2User._id,
      date: todayStr,
      checkIn: emilyIn,
      checkOut: emilyOut,
      status: 'Present',
      workingHours: 8.5,
      notes: 'Completed full day tasks',
    });

    // Manager Sarah Connor attendance
    await Attendance.create({
      employee: manager1Emp._id,
      user: manager1User._id,
      date: todayStr,
      checkIn: new Date(),
      status: 'Present',
      workingHours: 0,
    });

    // 8. Create Leaves
    await Leave.create([
      {
        employee: emp1._id,
        user: emp1User._id,
        leaveType: 'Casual Leave',
        startDate: new Date('2026-10-05'),
        endDate: new Date('2026-10-07'),
        reason: 'Attending sibling wedding ceremony in hometown.',
        status: 'Pending',
      },
      {
        employee: emp2._id,
        user: emp2User._id,
        leaveType: 'Sick Leave',
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-11'),
        reason: 'Viral fever recovery and rest.',
        status: 'Approved',
        approvedBy: manager1User._id,
      },
      {
        employee: emp3._id,
        user: emp3User._id,
        leaveType: 'Paid Leave',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-16'),
        reason: 'Personal renewal break.',
        status: 'Approved',
        approvedBy: manager2User._id,
      },
    ]);

    // 9. Create Payroll records
    await Payroll.create([
      {
        employee: emp1._id,
        month: 'August 2026',
        basicSalary: 7333,
        allowances: 800,
        deductions: 450,
        netSalary: 7683,
        paymentStatus: 'Paid',
        paymentDate: new Date('2026-08-31'),
      },
      {
        employee: emp1._id,
        month: 'September 2026',
        basicSalary: 7333,
        allowances: 850,
        deductions: 450,
        netSalary: 7733,
        paymentStatus: 'Paid',
        paymentDate: new Date('2026-09-24'),
      },
      {
        employee: emp2._id,
        month: 'September 2026',
        basicSalary: 6333,
        allowances: 600,
        deductions: 350,
        netSalary: 6583,
        paymentStatus: 'Paid',
        paymentDate: new Date('2026-09-24'),
      },
    ]);

    console.log('Database seeded successfully!');
    console.log('---------------------------------------------------------');
    console.log('Demo Credentials Ready:');
    console.log('ADMIN:    admin@ems.com        / Admin@123    (ID: ADM001)');
    console.log('MANAGER:  manager@ems.com      / Manager@123  (ID: MGR101)');
    console.log('EMPLOYEE: employee@ems.com     / Employee@123 (ID: EMP201)');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
