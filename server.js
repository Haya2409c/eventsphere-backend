const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Only our frontend may call the API. CLIENT_URL can list several, comma-separated.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('⚠️  CLIENT_URL is not set: the browser will block every request from the frontend (CORS).');
}

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Express 5 leaves req.body undefined when no JSON was sent; use {} so
// controllers give a clear 400 instead of crashing with a 500
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

// Har request se pehle DB connection ensure karein (Serverless safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Connection Error:", err);
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api', require('./routes/expoBoothRoutes'));
app.use('/api', require('./routes/sessionAttendeeRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

app.get('/', (req, res) => {
  res.send('🚀 EventSphere Management API is running...');
});

// Don't start a server on Vercel (production) or in tests (Supertest calls the app directly)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
}

module.exports = app;