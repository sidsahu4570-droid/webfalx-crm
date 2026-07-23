import { Request, Response } from 'express';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { logActivity } from '../services/activityService';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    // Attach lead counts per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const leadCount = await Lead.countDocuments({ userId: u._id });
        const dueFollowUps = await Lead.countDocuments({
          userId: u._id,
          nextFollowUpDate: { $lte: new Date() }
        });

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          joiningDate: u.joiningDate,
          joiningDateStatus: u.joiningDateStatus || 'Pending Approval',
          joiningDateSubmittedAt: u.joiningDateSubmittedAt,
          joiningDateApprovedBy: u.joiningDateApprovedBy,
          leadCount,
          dueFollowUps,
          createdAt: u.createdAt
        };
      })
    );

    res.json({ success: true, users: usersWithStats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User email already exists' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'caller',
      isActive: true
    });

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CREATE_USER',
        details: `Admin created caller account: ${newUser.name} (${newUser.email})`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Caller account created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password) user.password = password; // Pre-save hook will hash it

    await user.save();

    // If caller name or email changed, update leads assigned to this caller
    if (name || email) {
      await Lead.updateMany(
        { userId: user._id },
        { callerName: user.name, callerEmail: user.email }
      );
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'UPDATE_USER',
        details: `Updated caller account: ${user.name} (Active: ${user.isActive})`
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete primary admin user' });
    }

    await User.findByIdAndDelete(id);

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'DELETE_USER',
        details: `Deleted caller account: ${user.name} (${user.email})`
      });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const submitJoiningDate = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { joiningDate } = req.body;

    if (!joiningDate) {
      return res.status(400).json({ success: false, message: 'Joining date is required' });
    }

    const currentUser = await User.findById(user.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetDate = new Date(joiningDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rule: Callers CANNOT select past / backdated joining dates!
    if (user.role === 'caller' && targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Callers cannot select past or backdated joining dates. Please select today or a future date.'
      });
    }

    // Rule: Callers can edit joining date for ONLY 2 days (48 hours) after submission
    if (user.role === 'caller' && currentUser.joiningDateSubmittedAt) {
      const diffMs = today.getTime() - new Date(currentUser.joiningDateSubmittedAt).getTime();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      if (diffMs > twoDaysMs) {
        return res.status(403).json({
          success: false,
          message: 'Joining Date Locked. Contact Admin for changes.'
        });
      }
    }

    currentUser.joiningDate = targetDate;
    if (!currentUser.joiningDateSubmittedAt) {
      currentUser.joiningDateSubmittedAt = new Date();
    }
    currentUser.joiningDateStatus = 'Pending Approval';
    await currentUser.save();

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'SUBMIT_JOINING_DATE',
      details: `Submitted joining date: ${targetDate.toISOString().substring(0, 10)} (Pending Approval)`
    });

    res.json({
      success: true,
      message: 'Joining date submitted successfully. Status: Pending Approval.',
      joiningDate: currentUser.joiningDate,
      joiningDateStatus: currentUser.joiningDateStatus
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const approveJoiningDate = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const { userId } = req.params;
    const { status, joiningDate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (joiningDate) {
      user.joiningDate = new Date(joiningDate);
    }
    if (status) {
      user.joiningDateStatus = status;
    }
    user.joiningDateApprovedBy = adminUser.name;
    await user.save();

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'APPROVE_JOINING_DATE',
      details: `Updated joining date for ${user.name}: ${user.joiningDate?.toISOString().substring(0, 10)} (${user.joiningDateStatus})`
    });

    res.json({
      success: true,
      message: `Joining date status updated to ${user.joiningDateStatus}`,
      user: {
        id: user._id,
        joiningDate: user.joiningDate,
        joiningDateStatus: user.joiningDateStatus
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
