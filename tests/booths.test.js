const request = require('supertest');
const { startDB, stopDB, clearDB, makeUser, makeExpo } = require('./helpers');
const app = require('../server');
const Booth = require('../models/Booth');

let admin, exhibitor, otherExhibitor, attendee, expo, booth;

beforeAll(startDB);
afterAll(stopDB);

beforeEach(async () => {
  await clearDB();
  admin = await makeUser('admin');
  exhibitor = await makeUser('exhibitor');
  otherExhibitor = await makeUser('exhibitor');
  attendee = await makeUser('attendee');
  expo = await makeExpo(admin.user);
  booth = await Booth.create({ expo: expo._id, boothNumber: 'A1' });
});

describe('PUT /api/booths/:id (admin edit + assign)', () => {
  test('admin edits a booth and assigns an exhibitor → booked', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}`)
      .set(admin.auth)
      .send({ boothNumber: 'A9', size: '20x10 ft', exhibitor: exhibitor.user._id });

    expect(res.status).toBe(200);
    expect(res.body.boothNumber).toBe('A9');
    expect(res.body.size).toBe('20x10 ft');
    expect(res.body.status).toBe('booked');
    expect(res.body.exhibitor).toBe(String(exhibitor.user._id));
  });

  test('exhibitor: null frees the booth and clears its details', async () => {
    await Booth.findByIdAndUpdate(booth._id, {
      status: 'booked', exhibitor: exhibitor.user._id,
      productsShowcase: 'Chargers', staff: [{ name: 'Ali' }],
    });

    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ exhibitor: null });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('available');
    expect(res.body.exhibitor).toBeNull();
    expect(res.body.staff).toEqual([]);
  });

  test('moving a booth to a new exhibitor clears the old products + staff', async () => {
    await Booth.findByIdAndUpdate(booth._id, {
      status: 'booked', exhibitor: exhibitor.user._id,
      productsShowcase: 'Chargers', staff: [{ name: 'Ali' }],
    });

    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ exhibitor: otherExhibitor.user._id });

    expect(res.status).toBe(200);
    expect(res.body.exhibitor).toBe(String(otherExhibitor.user._id));
    expect(res.body.productsShowcase).toBe('');
    expect(res.body.staff).toEqual([]);
  });

  test('same exhibitor again keeps products + staff', async () => {
    await Booth.findByIdAndUpdate(booth._id, {
      status: 'pending', exhibitor: exhibitor.user._id, staff: [{ name: 'Ali' }],
    });

    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ exhibitor: exhibitor.user._id });

    expect(res.status).toBe(200);
    expect(res.body.staff).toEqual([{ name: 'Ali', role: '' }]);
  });

  test('mixed-up requests → 400', async () => {
    const a = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ status: 'booked', exhibitor: null });
    const b = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth)
      .send({ status: 'available', exhibitor: exhibitor.user._id });

    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
  });

  test('exhibitor cannot edit booths (403)', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(exhibitor.auth).send({ boothNumber: 'X' });
    expect(res.status).toBe(403);
  });

  test('assigning a non-exhibitor user → 400', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ exhibitor: attendee.user._id });
    expect(res.status).toBe(400);
  });

  test('bad status → 400', async () => {
    await Booth.findByIdAndUpdate(booth._id, { exhibitor: exhibitor.user._id, status: 'booked' });
    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ status: 'sold' });
    expect(res.status).toBe(400);
  });

  test('booked without an exhibitor → 400', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}`).set(admin.auth).send({ status: 'booked' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/booths/:id/approve', () => {
  test('admin approves a pending request → booked', async () => {
    await Booth.findByIdAndUpdate(booth._id, { status: 'pending', exhibitor: exhibitor.user._id });
    const res = await request(app).patch(`/api/booths/${booth._id}/approve`).set(admin.auth).send({});
    expect(res.status).toBe(200);
    expect(res.body.booth.status).toBe('booked');
  });

  test('a booth nobody requested cannot be approved (400)', async () => {
    const res = await request(app).patch(`/api/booths/${booth._id}/approve`).set(admin.auth).send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/booths/:id', () => {
  test('admin deletes a booth', async () => {
    const res = await request(app).delete(`/api/booths/${booth._id}`).set(admin.auth);
    expect(res.status).toBe(200);
    expect(await Booth.findById(booth._id)).toBeNull();
  });

  test('no token → 401', async () => {
    const res = await request(app).delete(`/api/booths/${booth._id}`);
    expect(res.status).toBe(401);
  });

  test('bad id → 400', async () => {
    const res = await request(app).delete('/api/booths/not-an-id').set(admin.auth);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/booths/:id/details (owner exhibitor)', () => {
  beforeEach(async () => {
    await Booth.findByIdAndUpdate(booth._id, { status: 'booked', exhibitor: exhibitor.user._id });
  });

  test('owner saves products and staff', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}/details`)
      .set(exhibitor.auth)
      .send({ productsShowcase: 'Solar panels', staff: [{ name: 'Sara', role: 'Sales' }] });

    expect(res.status).toBe(200);
    expect(res.body.productsShowcase).toBe('Solar panels');
    expect(res.body.staff).toEqual([{ name: 'Sara', role: 'Sales' }]);
  });

  test('another exhibitor → 403', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}/details`)
      .set(otherExhibitor.auth)
      .send({ productsShowcase: 'Hacked' });
    expect(res.status).toBe(403);
  });

  test('staff member without a name → 400', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}/details`)
      .set(exhibitor.auth)
      .send({ staff: [{ role: 'Sales' }] });
    expect(res.status).toBe(400);
  });

  test('staff that is not a list → 400', async () => {
    const res = await request(app)
      .put(`/api/booths/${booth._id}/details`)
      .set(exhibitor.auth)
      .send({ staff: 'Sara' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/booths/mine', () => {
  test('returns only my booths, with expo info', async () => {
    await Booth.findByIdAndUpdate(booth._id, { status: 'pending', exhibitor: exhibitor.user._id });
    await Booth.create({ expo: expo._id, boothNumber: 'B1', status: 'booked', exhibitor: otherExhibitor.user._id });

    const res = await request(app).get('/api/booths/mine').set(exhibitor.auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].boothNumber).toBe('A1');
    expect(res.body[0].expo.title).toBe('Tech Expo');
  });

  test('attendee → 403', async () => {
    const res = await request(app).get('/api/booths/mine').set(attendee.auth);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/booths/:id/view', () => {
  test('adds 1 view each time', async () => {
    await request(app).post(`/api/booths/${booth._id}/view`);
    const res = await request(app).post(`/api/booths/${booth._id}/view`);
    expect(res.status).toBe(200);
    expect(res.body.views).toBe(2);
  });

  test('unknown booth → 404', async () => {
    const res = await request(app).post('/api/booths/64b000000000000000000000/view');
    expect(res.status).toBe(404);
  });
});
