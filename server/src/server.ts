import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './socket/socketHandler';

// Import Route Handlers
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import leadRoutes from './routes/leadRoutes';
import adminRoutes from './routes/adminRoutes';
import reportRoutes from './routes/reportRoutes';
import convertedClientRoutes from './routes/convertedClientRoutes';
import appRevenueRoutes from './routes/appRevenueRoutes';
import deletedRecordRoutes from './routes/deletedRecordRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import activityTimelineRoutes from './routes/activityTimelineRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import bonusRoutes from './routes/bonusRoutes';
import categoryRoutes from './routes/categoryRoutes';
import { seedDefaultCategories } from './utils/seedCategories';
import cityRoutes from './routes/cityRoutes';
import { seedDefaultCities } from './utils/seedCities';
import salaryRoutes from './routes/salaryRoutes';
import salaryPaymentRoutes from './routes/salaryPaymentRoutes';
import resourceRoutes from './routes/resourceRoutes';

const app = express();
const server = http.createServer(app);

// Security & Utility Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 mins
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CRM MERN Backend Server'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/converted-clients', convertedClientRoutes);
app.use('/api/app-revenue', appRevenueRoutes);
app.use('/api/deleted-records', deletedRecordRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/activity-timeline', activityTimelineRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/salary-payments', salaryPaymentRoutes);
app.use('/api/resources', resourceRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'ProspectCRM API Server is running successfully!' });
});

// Error Handling Middleware
app.use(errorHandler);

// Initialize Socket.io
initSocket(server);

// Start Server & DB
const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultCategories();
    await seedDefaultCities();

    server.listen(env.PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 CRM Server running in ${env.NODE_ENV} mode`);
      console.log(`🌐 Server Port: http://localhost:${env.PORT}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
