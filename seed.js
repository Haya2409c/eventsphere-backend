// Seed script: fills the database with demo data.
// Run with: npm run seed
// It only deletes and re-creates its OWN demo data (emails ending in @eventsphere.test),
// so real users and expos are never touched.

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Expo = require('./models/Expo');
const Booth = require('./models/Booth');
const Session = require('./models/Session');

dotenv.config();

const DEMO_DOMAIN = '@eventsphere.test';

// Date string (YYYY-MM-DD) that is `days` days from today
const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const seed = async () => {
  // Demo password comes from .env, so it is never stored in the code on GitHub
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    console.error('❌ Set SEED_PASSWORD (at least 8 characters) in backend/.env first.');
    process.exit(1);
  }

  await connectDB();

  // 1. Remove old demo data (only things made by this script)
  const oldUsers = await User.find({ email: { $regex: `${DEMO_DOMAIN.replace('.', '\\.')}$` } });
  const oldUserIds = oldUsers.map((u) => u._id);
  const oldExpos = await Expo.find({ createdBy: { $in: oldUserIds } });
  const oldExpoIds = oldExpos.map((e) => e._id);
  await Booth.deleteMany({ expo: { $in: oldExpoIds } });
  await Session.deleteMany({ expo: { $in: oldExpoIds } });
  await Expo.deleteMany({ _id: { $in: oldExpoIds } });
  await User.deleteMany({ _id: { $in: oldUserIds } });

  // 2. Users (User.create runs the pre-save hook, so passwords get hashed)
  const admin = await User.create({
    name: 'Demo Admin',
    email: `admin${DEMO_DOMAIN}`,
    password,
    role: 'admin',
  });

  const exhibitor1 = await User.create({
    name: 'Sara Khan',
    email: `exhibitor1${DEMO_DOMAIN}`,
    password,
    role: 'exhibitor',
    companyName: 'GreenTech Solutions',
    companyCategory: 'Technology',
    isApproved: true,
  });

  // Not approved yet, so the admin can test the approval flow
  const exhibitor2 = await User.create({
    name: 'Ali Raza',
    email: `exhibitor2${DEMO_DOMAIN}`,
    password,
    role: 'exhibitor',
    companyName: 'FreshBite Foods',
    companyCategory: 'Food & Beverage',
    isApproved: false,
  });

  const attendee = await User.create({
    name: 'Ayesha Malik',
    email: `attendee${DEMO_DOMAIN}`,
    password,
    role: 'attendee',
    interests: ['Technology', 'AI'],
  });

  // 3. Expos (one soon, one later)
  const expo1 = await Expo.create({
    title: 'Karachi Tech Expo 2026',
    description: 'Startups, AI tools and gadgets under one roof.',
    theme: 'Technology',
    location: 'Expo Centre, Karachi',
    startDate: daysFromNow(1),
    endDate: daysFromNow(3),
    createdBy: admin._id,
    registeredAttendees: [attendee._id],
  });

  const expo2 = await Expo.create({
    title: 'Lahore Food Festival',
    description: 'Local food brands, cooking shows and tasting stalls.',
    theme: 'Food & Beverage',
    location: 'Expo Centre, Lahore',
    startDate: daysFromNow(14),
    endDate: daysFromNow(15),
    createdBy: admin._id,
  });

  // 4. Booths: A1 booked, A2 pending request, the rest free
  await Booth.insertMany([
    { expo: expo1._id, boothNumber: 'A1', floorSection: 'Hall A', status: 'booked', exhibitor: exhibitor1._id, productsShowcase: 'Solar chargers, smart meters' },
    { expo: expo1._id, boothNumber: 'A2', floorSection: 'Hall A', status: 'pending', exhibitor: exhibitor2._id },
    { expo: expo1._id, boothNumber: 'A3', floorSection: 'Hall A' },
    { expo: expo1._id, boothNumber: 'B1', floorSection: 'Hall B', size: '20x10 ft' },
    { expo: expo2._id, boothNumber: 'F1', floorSection: 'Food Court' },
    { expo: expo2._id, boothNumber: 'F2', floorSection: 'Food Court' },
  ]);

  // 5. Sessions (attendee has bookmarked the first one)
  await Session.insertMany([
    { expo: expo1._id, title: 'AI for Small Businesses', description: 'Simple AI tools you can use today.', speakerName: 'Dr. Usman Tariq', topic: 'AI', hallLocation: 'Hall A Stage', date: daysFromNow(1), startTime: '10:00', endTime: '11:00', registeredAttendees: [attendee._id] },
    { expo: expo1._id, title: 'Green Energy at Home', description: 'Solar and smart meters explained.', speakerName: 'Sara Khan', topic: 'Technology', hallLocation: 'Hall B Stage', date: daysFromNow(2), startTime: '14:00', endTime: '15:00' },
    { expo: expo2._id, title: 'Street Food Goes Global', description: 'How local brands grow.', speakerName: 'Chef Bilal', topic: 'Food & Beverage', hallLocation: 'Main Stage', date: daysFromNow(14), startTime: '12:00', endTime: '13:00' },
  ]);

  console.log('\n✅ Seed done. Demo logins (password = SEED_PASSWORD from .env):');
  console.table([
    { role: 'admin', email: admin.email },
    { role: 'exhibitor (approved)', email: exhibitor1.email },
    { role: 'exhibitor (pending)', email: exhibitor2.email },
    { role: 'attendee', email: attendee.email },
  ]);
};

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
