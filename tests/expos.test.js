const request = require('supertest');
const { startDB, stopDB, clearDB, makeUser, makeExpo } = require('./helpers');
const app = require('../server');
const Expo = require('../models/Expo');
const Booth = require('../models/Booth');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');

let admin, exhibitor, attendee, expo;

beforeAll(startDB);
afterAll(stopDB);

beforeEach(async () => {
  await clearDB();
  admin = await makeUser('admin');
  exhibitor = await makeUser('exhibitor');
  attendee = await makeUser('attendee');
  expo = await makeExpo(admin.user);
});

const newExpo = {
  title: 'Food Fest', description: 'Food', theme: 'Food', location: 'Lahore',
  startDate: '2027-01-05', endDate: '2027-01-06',
};

describe('POST /api/expos', () => {
  test('admin creates an expo', async () => {
    const res = await request(app).post('/api/expos').set(admin.auth).send(newExpo);
    expect(res.status).toBe(201);
    expect(res.body.createdBy).toBe(String(admin.user._id));
  });

  test('exhibitor → 403', async () => {
    const res = await request(app).post('/api/expos').set(exhibitor.auth).send(newExpo);
    expect(res.status).toBe(403);
  });

  test('missing fields → 400', async () => {
    const res = await request(app).post('/api/expos').set(admin.auth).send({ title: 'Only title' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/expos/:id', () => {
  test('anyone can read one expo', async () => {
    const res = await request(app).get(`/api/expos/${expo._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tech Expo');
  });

  test('unknown id → 404, bad id → 400', async () => {
    const missing = await request(app).get('/api/expos/64b000000000000000000000');
    const bad = await request(app).get('/api/expos/not-an-id');
    expect(missing.status).toBe(404);
    expect(bad.status).toBe(400);
  });
});

describe('PUT /api/expos/:id', () => {
  test('admin changes only the fields sent', async () => {
    const res = await request(app)
      .put(`/api/expos/${expo._id}`).set(admin.auth).send({ location: 'Islamabad' });

    expect(res.status).toBe(200);
    expect(res.body.location).toBe('Islamabad');
    expect(res.body.title).toBe('Tech Expo');
  });

  test('attendee → 403', async () => {
    const res = await request(app)
      .put(`/api/expos/${expo._id}`).set(attendee.auth).send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  test('empty title → 400', async () => {
    const res = await request(app)
      .put(`/api/expos/${expo._id}`).set(admin.auth).send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('no body → 200 with nothing changed (not a 500)', async () => {
    const res = await request(app).put(`/api/expos/${expo._id}`).set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tech Expo');
  });
});

describe('DELETE /api/expos/:id', () => {
  test('also deletes its booths, sessions and feedback (only for this expo)', async () => {
    const other = await makeExpo(admin.user, { title: 'Other Expo' });
    await Booth.create([
      { expo: expo._id, boothNumber: 'A1' },
      { expo: other._id, boothNumber: 'Z1' },
    ]);
    await Session.create({
      expo: expo._id, title: 'Talk', description: 'd', speakerName: 's', topic: 'AI',
      hallLocation: 'H1', date: '2026-12-10', startTime: '10:00', endTime: '11:00',
    });
    await Feedback.create({ user: attendee.user._id, expo: expo._id, rating: 5, comment: 'Nice' });

    const res = await request(app).delete(`/api/expos/${expo._id}`).set(admin.auth);

    expect(res.status).toBe(200);
    expect(await Expo.findById(expo._id)).toBeNull();
    expect(await Booth.countDocuments({ expo: expo._id })).toBe(0);
    expect(await Session.countDocuments({ expo: expo._id })).toBe(0);
    expect(await Feedback.countDocuments({ expo: expo._id })).toBe(0);
    // The other expo's booth is untouched
    expect(await Booth.countDocuments({ expo: other._id })).toBe(1);
  });

  test('no token → 401', async () => {
    const res = await request(app).delete(`/api/expos/${expo._id}`);
    expect(res.status).toBe(401);
    expect(await Expo.findById(expo._id)).not.toBeNull();
  });

  test('exhibitor → 403', async () => {
    const res = await request(app).delete(`/api/expos/${expo._id}`).set(exhibitor.auth);
    expect(res.status).toBe(403);
  });
});
