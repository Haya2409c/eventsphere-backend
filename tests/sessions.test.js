const request = require('supertest');
const { startDB, stopDB, clearDB, makeUser, makeExpo } = require('./helpers');
const app = require('../server');
const Session = require('../models/Session');

let admin, attendee, exhibitor, session;

beforeAll(startDB);
afterAll(stopDB);

beforeEach(async () => {
  await clearDB();
  admin = await makeUser('admin');
  attendee = await makeUser('attendee');
  exhibitor = await makeUser('exhibitor');
  const expo = await makeExpo(admin.user);
  session = await Session.create({
    expo: expo._id, title: 'AI Talk', description: 'd', speakerName: 'Dr. Sana', topic: 'AI',
    hallLocation: 'Hall 1', date: '2026-12-10', startTime: '10:00', endTime: '11:00',
  });
});

describe('PUT /api/sessions/:id', () => {
  test('admin edits a session', async () => {
    const res = await request(app)
      .put(`/api/sessions/${session._id}`).set(admin.auth).send({ hallLocation: 'Hall 2' });

    expect(res.status).toBe(200);
    expect(res.body.hallLocation).toBe('Hall 2');
  });

  test('attendee → 403', async () => {
    const res = await request(app)
      .put(`/api/sessions/${session._id}`).set(attendee.auth).send({ title: 'X' });
    expect(res.status).toBe(403);
  });

  test('empty title → 400', async () => {
    const res = await request(app)
      .put(`/api/sessions/${session._id}`).set(admin.auth).send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('cannot set registeredAttendees from the body', async () => {
    const res = await request(app)
      .put(`/api/sessions/${session._id}`).set(admin.auth)
      .send({ registeredAttendees: [attendee.user._id] });

    expect(res.status).toBe(200);
    expect(res.body.registeredAttendees).toEqual([]);
  });
});

describe('DELETE /api/sessions/:id', () => {
  test('admin deletes a session', async () => {
    const res = await request(app).delete(`/api/sessions/${session._id}`).set(admin.auth);
    expect(res.status).toBe(200);
    expect(await Session.findById(session._id)).toBeNull();
  });

  test('unknown session → 404', async () => {
    const res = await request(app)
      .delete('/api/sessions/64b000000000000000000000').set(admin.auth);
    expect(res.status).toBe(404);
  });
});

describe('Bookmark / un-bookmark', () => {
  test('attendee bookmarks, then un-bookmarks a session', async () => {
    const add = await request(app)
      .post(`/api/attendee/bookmark-session/${session._id}`).set(attendee.auth);
    expect(add.status).toBe(200);

    const remove = await request(app)
      .delete(`/api/attendee/bookmark-session/${session._id}`).set(attendee.auth);
    expect(remove.status).toBe(200);
    expect(remove.body.session.registeredAttendees).toEqual([]);
  });

  test('exhibitor cannot un-bookmark (403)', async () => {
    const res = await request(app)
      .delete(`/api/attendee/bookmark-session/${session._id}`).set(exhibitor.auth);
    expect(res.status).toBe(403);
  });

  test('bad session id → 400', async () => {
    const res = await request(app)
      .delete('/api/attendee/bookmark-session/not-an-id').set(attendee.auth);
    expect(res.status).toBe(400);
  });
});
