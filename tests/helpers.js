// Shared test helpers: a fresh in-memory MongoDB for each test file,
// so tests never touch the real Atlas database.
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Expo = require('../models/Expo');

let mongo;

// Set test env values BEFORE the app is loaded (dotenv won't override them)
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const startDB = async () => {
  // Slow machines (WSL) can need more than the default 10 s to start mongod
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  process.env.MONGO_URI = mongo.getUri();
  // Jest blocks the driver's own `import('os')`, so we hand it `os` directly.
  await mongoose.connect(process.env.MONGO_URI, { runtimeAdapters: { os: require('os') } });
};

const stopDB = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

const clearDB = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

// Make a user and return it with a Bearer header ready for Supertest
const makeUser = async (role, extra = {}) => {
  const user = await User.create({
    name: `${role} user`,
    email: `${role}${Date.now()}${Math.random()}@test.com`,
    password: 'password123',
    role,
    ...extra,
  });
  const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET);
  return { user, auth: { Authorization: `Bearer ${token}` } };
};

// Make an expo owned by the given admin user
const makeExpo = (adminUser, extra = {}) =>
  Expo.create({
    title: 'Tech Expo', description: 'Test', theme: 'AI', location: 'Karachi',
    startDate: '2026-12-10', endDate: '2026-12-12', createdBy: adminUser._id,
    ...extra,
  });

module.exports = { startDB, stopDB, clearDB, makeUser, makeExpo };
