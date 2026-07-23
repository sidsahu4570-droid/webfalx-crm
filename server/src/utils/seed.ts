import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { ActivityLog } from '../models/ActivityLog';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.MONGODB_URI);
    }
    console.log('[Seeder] Connected to MongoDB for seeding...');

    // 1. Ensure Default Primary Admin exists
    let admin = await User.findOne({ email: 'admin@crm.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@crm.com',
        password: 'Admin@123456',
        role: 'admin',
        isActive: true
      });
      console.log('[Seeder] Default Admin created: admin@crm.com / Admin@123456');
    }

    // 2. Ensure Default Demo Caller exists for immediate testing/demo button
    let caller = await User.findOne({ email: 'sarah@crm.com' });
    if (!caller) {
      caller = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah@crm.com',
        password: 'Caller@123456',
        role: 'caller',
        isActive: true
      });
      console.log('[Seeder] Default Demo Caller created: sarah@crm.com / Caller@123456');
    }

    console.log('[Seeder] Initial environment setup complete.');
  } catch (error) {
    console.error('[Seeder Error]', error);
  }
};

export const clearDemoData = async () => {
  try {
    // 1. Wipe all leads
    await Lead.deleteMany({});

    // 2. Wipe activity logs
    await ActivityLog.deleteMany({});

    // 3. Ensure Default Demo Caller exists
    let caller = await User.findOne({ email: 'sarah@crm.com' });
    if (!caller) {
      await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah@crm.com',
        password: 'Caller@123456',
        role: 'caller',
        isActive: true
      });
    }

    // 4. Wipe any other extra demo callers except admin and sarah@crm.com
    await User.deleteMany({ email: { $nin: ['admin@crm.com', 'sarah@crm.com'] } });

    console.log('[Seeder] All leads cleared. Clean admin and caller accounts ready.');
    return true;
  } catch (error) {
    console.error('[Clear Demo Data Error]', error);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
