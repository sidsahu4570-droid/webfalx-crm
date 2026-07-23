import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { AttendanceSession } from '../models/AttendanceSession';
import { logActivity } from '../services/activityService';
import { emitToAdmin } from '../socket/socketHandler';

export const clockIn = async (req: Request, res: Response) => {
  try {
    const callerUser = req.user!;
    const today = new Date().toISOString().split('T')[0];

    // Find today's existing sessions
    const sessions = await AttendanceSession.find({ userId: callerUser.id, date: today }).sort({ sessionIndex: 1 });
    
    // Check if maximum 3 sessions reached
    if (sessions.length >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 login sessions per day reached' });
    }

    // Check if there is an active session (not clocked out yet)
    const activeSession = sessions.find(s => !s.logoutTime);
    if (activeSession) {
      return res.status(400).json({ success: false, message: 'You are already clocked in. Please clock out first.' });
    }

    const loginTime = new Date();
    // Late check: after 9:30 AM (only for the first session of the day)
    const isFirstSession = sessions.length === 0;
    const isLate = isFirstSession && (loginTime.getHours() > 9 || (loginTime.getHours() === 9 && loginTime.getMinutes() > 30));

    // Create session record
    const nextSessionIndex = sessions.length + 1;
    const session = await AttendanceSession.create({
      userId: callerUser.id,
      callerName: callerUser.name,
      callerEmail: callerUser.email,
      date: today,
      sessionIndex: nextSessionIndex,
      loginTime,
      isLateLogin: isLate
    });

    // Create or update daily Attendance record
    let record = await Attendance.findOne({ userId: callerUser.id, date: today });
    if (!record) {
      record = await Attendance.create({
        userId: callerUser.id,
        callerName: callerUser.name,
        callerEmail: callerUser.email,
        date: today,
        loginTime, // store first login time
        status: isLate ? 'Late' : 'Present'
      });
    } else {
      // If daily record exists, update status only if it's the first session
      if (isFirstSession) {
        record.status = isLate ? 'Late' : 'Present';
        await record.save();
      }
    }

    await logActivity({
      userId: callerUser.id,
      userName: callerUser.name,
      userEmail: callerUser.email,
      action: 'CLOCK_IN',
      details: `Clocked in for Session ${nextSessionIndex} at ${loginTime.toLocaleTimeString()} (${isLate ? 'Late' : 'On Time'})`
    });

    emitToAdmin('attendance_updated', { record, session });

    res.status(201).json({ success: true, message: 'Clocked in successfully', session, attendance: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const callerUser = req.user!;
    const today = new Date().toISOString().split('T')[0];

    // Find active session for today
    const session = await AttendanceSession.findOne({ userId: callerUser.id, date: today, logoutTime: { $exists: false } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active clock-in session found' });
    }

    const logoutTime = new Date();
    session.logoutTime = logoutTime;

    // Calculate session duration in hours
    const durationMs = logoutTime.getTime() - session.loginTime.getTime();
    session.workingHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

    // Check early logout: before 6:00 PM (only for session 3 or final session)
    const isEarly = logoutTime.getHours() < 18;
    session.isEarlyLogout = isEarly;

    await session.save();

    // Recalculate daily total working hours
    const allSessions = await AttendanceSession.find({ userId: callerUser.id, date: today });
    const totalWorkingHours = allSessions.reduce((sum, s) => sum + (s.workingHours || 0), 0);

    const record = await Attendance.findOne({ userId: callerUser.id, date: today });
    if (record) {
      record.logoutTime = logoutTime; // update to latest logout
      record.totalWorkingHours = Number(totalWorkingHours.toFixed(2));
      record.activeHours = Math.max(0, Number((totalWorkingHours - (record.breakTime || 0) / 60).toFixed(2)));
      await record.save();
    }

    await logActivity({
      userId: callerUser.id,
      userName: callerUser.name,
      userEmail: callerUser.email,
      action: 'CLOCK_OUT',
      details: `Clocked out for Session ${session.sessionIndex} at ${logoutTime.toLocaleTimeString()} (${session.workingHours} hrs active)`
    });

    emitToAdmin('attendance_updated', { record, session });

    res.json({ success: true, message: 'Clocked out successfully', session, attendance: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordBreak = async (req: Request, res: Response) => {
  try {
    const callerUser = req.user!;
    const { breakMinutes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ userId: callerUser.id, date: today });
    if (!record) {
      return res.status(404).json({ success: false, message: 'No attendance record found for today' });
    }

    record.breakTime = (record.breakTime || 0) + Number(breakMinutes || 0);
    record.activeHours = Math.max(0, Number((record.totalWorkingHours - record.breakTime / 60).toFixed(2)));
    await record.save();

    res.json({ success: true, message: `Logged ${breakMinutes} mins break`, attendance: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const callerUser = req.user!;
    const today = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ userId: callerUser.id, date: today });
    const sessions = await AttendanceSession.find({ userId: callerUser.id, date: today }).sort({ sessionIndex: 1 });

    res.json({
      success: true,
      attendance: record || null,
      sessions: sessions || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { callerId, startDate, endDate, status } = req.query;

    const filter: any = {};
    if (callerId) filter.userId = callerId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = String(startDate);
      if (endDate) filter.date.$lte = String(endDate);
    }

    // Callers can only view their own attendance report
    if (req.user!.role === 'caller') {
      filter.userId = req.user!.id;
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    // Fetch matching sessions to attach
    const recordDates = records.map(r => r.date);
    const userIds = records.map(r => r.userId);
    const sessions = await AttendanceSession.find({
      userId: { $in: userIds },
      date: { $in: recordDates }
    }).sort({ sessionIndex: 1 });

    // Combine them
    const combined = records.map(record => {
      const recordSessions = sessions.filter(
        s => s.userId.toString() === record.userId.toString() && s.date === record.date
      );
      return {
        ...record.toObject(),
        sessions: recordSessions
      };
    });

    res.json({ success: true, records: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
