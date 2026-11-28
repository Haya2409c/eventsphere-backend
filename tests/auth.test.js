const request = require('supertest');
const { startDB, stopDB, clearDB, makeUser } = require('./helpers');
const app = require('../server');
const User = require('../models/User');

beforeAll(startDB);
afterAll(stopDB);
beforeEach(clearDB);

const newUser = (extra = {}) => ({
  name: 'Ali', email: 'ali@test.com', password: 'password123', ...extra,
});

describe('POST /api/auth/register', () => {
  test('attendee signs up and gets a token', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser());

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('attendee');
    expect(res.body.token).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  test('exhibitor signs up but waits for admin approval', async () => {
    const res = await request(app)
      .post('/api/auth/register').send(newUser({ role: 'exhibitor' }));

    expect(res.status).toBe(201);
    expect(res.body.isApproved).toBe(false);
  });

  test('role "admin" is blocked (400) and no user is saved', async () => {
    const res = await request(app)
      .post('/api/auth/register').send(newUser({ role: 'admin' }));

    expect(res.status).toBe(400);
    expect(await User.countDocuments({ role: 'admin' })).toBe(0);
  });

  test('missing fields → 400 naming them', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ali' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email, password/);
  });

  test('no body at all → 400, not 500', async () => {
    const res = await request(app).post('/api/auth/register');
    expect(res.status).toBe(400);
  });

  test('same email twice → 400', async () => {
    await request(app).post('/api/auth/register').send(newUser());
    const res = await request(app)
      .post('/api/auth/register').send(newUser({ email: 'ALI@test.com' }));
    expect(res.status).toBe(400);
  });

  test('bad email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register').send(newUser({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(newUser());
  });

  test('right password → token', async () => {
    const res = await request(app)
      .post('/api/auth/login').send({ email: 'ali@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login').send({ email: 'ali@test.com', password: 'wrong-pass' });
    expect(res.status).toBe(401);
  });

  test('NoSQL injection object instead of text → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  test('suspended account → 403', async () => {
    await User.updateOne({ email: 'ali@test.com' }, { isActive: false });
    const res = await request(app)
      .post('/api/auth/login').send({ email: 'ali@test.com', password: 'password123' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/users/:id/status', () => {
  test('admin approves an exhibitor; the password hash is not sent back', async () => {
    const admin = await makeUser('admin');
    const exhibitor = await makeUser('exhibitor', { isApproved: false });

    const res = await request(app)
      .patch(`/api/users/${exhibitor.user._id}/status`)
      .set(admin.auth)
      .send({ isApproved: true });

    expect(res.status).toBe(200);
    expect(res.body.user.isApproved).toBe(true);
    expect(res.body.user.password).toBeUndefined();
  });

  test('exhibitor cannot approve themselves (403)', async () => {
    const exhibitor = await makeUser('exhibitor', { isApproved: false });

    const res = await request(app)
      .patch(`/api/users/${exhibitor.user._id}/status`)
      .set(exhibitor.auth)
      .send({ isApproved: true });

    expect(res.status).toBe(403);
  });
});
