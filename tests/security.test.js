const request = require('supertest');
const { startDB, stopDB, clearDB, makeUser, makeExpo } = require('./helpers');
const app = require('../server');

beforeAll(startDB);
afterAll(stopDB);

beforeEach(async () => {
  await clearDB();
  const admin = await makeUser('admin');
  await makeExpo(admin.user, { title: 'C++ Summit' });
  await makeExpo(admin.user, { title: 'Tech Expo' });
});

describe('Regex escaping in searches', () => {
  test('"C++" is searched as plain text (no 500 from a broken regex)', async () => {
    const res = await request(app).get('/api/expos').query({ search: 'C++' });

    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.title)).toEqual(['C++ Summit']);
  });

  test('"." matches only a real dot, not any letter', async () => {
    const res = await request(app).get('/api/expos').query({ search: 'Tech.' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('ReDoS pattern returns fast with no results', async () => {
    const res = await request(app).get('/api/exhibitors/search').query({ keyword: '(a+)+$' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('CORS', () => {
  test('our frontend (CLIENT_URL) is allowed', async () => {
    const res = await request(app).get('/api/expos').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('another website gets no CORS header (browser blocks it)', async () => {
    const res = await request(app).get('/api/expos').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
