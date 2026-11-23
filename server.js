const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// CORS Setup (Frontend aur saare Vercel preview links allow karne ke liye)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options('*', cors());

app.use(express.json());

// Role #1: Auth & User Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Role #4: Expo, Booth, Exhibitor, Attendee, Sessions, Search & Feedback APIs
app.use('/api', require('./routes/expoBoothRoutes'));
app.use('/api', require('./routes/sessionAttendeeRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

app.get('/', (req, res) => {
  res.send('🚀 EventSphere Management API is running...');
});

// Local development ke liye
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
}

// Vercel ke liye zaroori export
module.exports = app;