/**
 * Integration tests using mongodb-memory-server.
 * NOTE: On first run this downloads a MongoDB binary, which requires
 * outbound internet access to fastdl.mongodb.org. If your environment
 * blocks that, point MONGO_URI at a real local/dev MongoDB instance
 * instead and skip mongodb-memory-server.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

const { createApp } = require('../src/app');
const Employee = require('../src/models/Employee');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();

  await Employee.create({
    employeeId: 'EMS-0001',
    name: 'Test Admin',
    email: 'admin@test.com',
    phone: '+919999999999',
    password: 'Password@123',
    department: 'Executive',
    designation: 'CEO',
    salary: 200000,
    joiningDate: new Date('2020-01-01'),
    role: 'SUPER_ADMIN',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Auth flow', () => {
  test('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  test('logs in with valid credentials and returns an access token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('protects employee routes without a token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  test('allows access to employee list with a valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password@123' });
    const token = login.body.accessToken;

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('RBAC on employee creation', () => {
  let hrToken;
  let employeeToken;

  beforeAll(async () => {
    await Employee.create({
      employeeId: 'EMS-0002',
      name: 'HR One',
      email: 'hr@test.com',
      phone: '+919999999998',
      password: 'Password@123',
      department: 'HR',
      designation: 'HR Manager',
      salary: 90000,
      joiningDate: new Date('2021-01-01'),
      role: 'HR_MANAGER',
    });
    await Employee.create({
      employeeId: 'EMS-0003',
      name: 'Regular Employee',
      email: 'emp@test.com',
      phone: '+919999999997',
      password: 'Password@123',
      department: 'Engineering',
      designation: 'Engineer',
      salary: 60000,
      joiningDate: new Date('2022-01-01'),
      role: 'EMPLOYEE',
    });

    const hrLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hr@test.com', password: 'Password@123' });
    hrToken = hrLogin.body.accessToken;

    const empLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@test.com', password: 'Password@123' });
    employeeToken = empLogin.body.accessToken;
  });

  test('blocks a plain EMPLOYEE from creating a new employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: 'EMS-0099',
        name: 'Should Fail',
        email: 'fail@test.com',
        phone: '+919999999996',
        password: 'Password@123',
        department: 'Sales',
        designation: 'Rep',
        salary: 50000,
        joiningDate: '2023-01-01',
      });
    expect(res.status).toBe(403);
  });

  test('allows HR_MANAGER to create an employee but not assign SUPER_ADMIN', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: 'EMS-0100',
        name: 'New Hire',
        email: 'newhire@test.com',
        phone: '+919999999995',
        password: 'Password@123',
        department: 'Sales',
        designation: 'Rep',
        salary: 50000,
        joiningDate: '2023-01-01',
        role: 'SUPER_ADMIN',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('EMPLOYEE'); // silently downgraded, not SUPER_ADMIN
  });
});
