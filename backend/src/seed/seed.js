require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Employee = require('../models/Employee');

async function run() {
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ems');
  await Employee.deleteMany({});

  const superAdmin = await Employee.create({
    employeeId: 'EMS-0001',
    name: 'Aditi Sharma',
    email: 'admin@ems.com',
    phone: '+919876543210',
    password: 'Admin@12345',
    department: 'Executive',
    designation: 'CEO',
    salary: 250000,
    joiningDate: new Date('2020-01-10'),
    status: 'ACTIVE',
    role: 'SUPER_ADMIN',
  });

  const hr = await Employee.create({
    employeeId: 'EMS-0002',
    name: 'Rahul Verma',
    email: 'hr@ems.com',
    phone: '+919876543211',
    password: 'Hr@123456',
    department: 'Human Resources',
    designation: 'HR Manager',
    salary: 90000,
    joiningDate: new Date('2021-03-15'),
    status: 'ACTIVE',
    role: 'HR_MANAGER',
    reportingManager: superAdmin._id,
  });

  const teamLead = await Employee.create({
    employeeId: 'EMS-0003',
    name: 'Sneha Patil',
    email: 'sneha.lead@ems.com',
    phone: '+919876543212',
    password: 'Employee@123',
    department: 'Engineering',
    designation: 'Engineering Manager',
    salary: 140000,
    joiningDate: new Date('2021-06-01'),
    status: 'ACTIVE',
    role: 'EMPLOYEE',
    reportingManager: superAdmin._id,
  });

  await Employee.create([
    {
      employeeId: 'EMS-0004',
      name: 'Karan Mehta',
      email: 'karan@ems.com',
      phone: '+919876543213',
      password: 'Employee@123',
      department: 'Engineering',
      designation: 'Software Engineer',
      salary: 85000,
      joiningDate: new Date('2022-08-20'),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      reportingManager: teamLead._id,
    },
    {
      employeeId: 'EMS-0005',
      name: 'Priya Nair',
      email: 'priya@ems.com',
      phone: '+919876543214',
      password: 'Employee@123',
      department: 'Engineering',
      designation: 'Software Engineer',
      salary: 82000,
      joiningDate: new Date('2023-01-05'),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      reportingManager: teamLead._id,
    },
    {
      employeeId: 'EMS-0006',
      name: 'Vikram Singh',
      email: 'vikram@ems.com',
      phone: '+919876543215',
      password: 'Employee@123',
      department: 'Sales',
      designation: 'Sales Executive',
      salary: 65000,
      joiningDate: new Date('2023-04-18'),
      status: 'INACTIVE',
      role: 'EMPLOYEE',
      reportingManager: hr._id,
    },
  ]);

  console.log('Seed complete. Demo logins:');
  console.log('  Super Admin: admin@ems.com / Admin@12345');
  console.log('  HR Manager : hr@ems.com / Hr@123456');
  console.log('  Employee   : karan@ems.com / Employee@123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
