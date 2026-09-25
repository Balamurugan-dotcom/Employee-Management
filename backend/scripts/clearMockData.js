require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Payroll = require('../models/Payroll');

async function clearMockData() {
  console.log('\n==============================================');
  console.log('       CLEARING MOCK DATA FROM MONGODB        ');
  console.log('==============================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems_database';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    // 1. Identify Admin User
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Admin user not found. Creating default admin account...');
      adminUser = await User.create({
        name: 'Eleanor Vance (System Admin)',
        email: 'admin@ems.com',
        password: 'Admin@123',
        role: 'admin',
        employeeId: 'ADM001',
        status: 'Active',
      });
      await Employee.create({
        employeeId: 'ADM001',
        user: adminUser._id,
        name: 'Eleanor Vance',
        email: 'admin@ems.com',
        department: 'Executive Administration',
        designation: 'Chief Technology Director / Admin',
        status: 'Active',
      });
    }

    console.log(`Preserving Admin: ${adminUser.name} (${adminUser.email})`);

    // 2. Remove all non-admin users
    const userResult = await User.deleteMany({ _id: { $ne: adminUser._id } });
    console.log(` • Deleted ${userResult.deletedCount} dummy user accounts.`);

    // 3. Remove all non-admin employee records
    const empResult = await Employee.deleteMany({ employeeId: { $ne: adminUser.employeeId || 'ADM001' } });
    console.log(` • Deleted ${empResult.deletedCount} dummy employee profiles.`);

    // 4. Remove all dummy attendance records
    const attResult = await Attendance.deleteMany({});
    console.log(` • Deleted ${attResult.deletedCount} dummy attendance punches.`);

    // 5. Remove all dummy leave applications
    const leaveResult = await Leave.deleteMany({});
    console.log(` • Deleted ${leaveResult.deletedCount} dummy leave requests.`);

    // 6. Remove all dummy tasks
    const taskResult = await Task.deleteMany({});
    console.log(` • Deleted ${taskResult.deletedCount} dummy tasks.`);

    // 7. Remove all dummy projects
    const projResult = await Project.deleteMany({});
    console.log(` • Deleted ${projResult.deletedCount} dummy projects.`);

    // 8. Remove all dummy payroll records
    const payResult = await Payroll.deleteMany({});
    console.log(` • Deleted ${payResult.deletedCount} dummy payroll logs.`);

    // 9. Reset department associations
    const deptResult = await Department.updateMany({}, { manager: null, employees: [] });
    console.log(` • Reset references in ${deptResult.matchedCount} departments.`);

    console.log('\n==============================================');
    console.log('🟢 SUCCESS: All mock / dummy data has been removed!');
    console.log('Only the main Admin account remains active:');
    console.log(` - Email:    admin@ems.com`);
    console.log(` - Role:     admin`);
    console.log(` - Password: Admin@123`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n🔴 Error clearing mock data:', err.message);
    process.exit(1);
  }
}

clearMockData();
