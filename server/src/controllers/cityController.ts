import { Request, Response } from 'express';
import { City } from '../models/City';
import { logActivity } from '../services/activityService';
import { emitToAll } from '../socket/socketHandler';

export const getCities = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const filter: any = {};
    
    // Callers should only see enabled cities
    if (user.role === 'caller') {
      filter.isEnabled = true;
    }

    const cities = await City.find(filter).sort({ name: 1 });
    res.json({ success: true, cities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const adminUser = req.user!;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }

    const trimmedName = name.trim();
    const existing = await City.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'City already exists' });
    }

    const city = await City.create({ name: trimmedName, isEnabled: true });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CREATE_CITY',
      details: `Created city: ${trimmedName}`
    });

    // Real-time socket broadcast update
    emitToAll('city_updated', { action: 'create', city });

    res.status(201).json({ success: true, message: 'City created successfully', city });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const adminUser = req.user!;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }

    const trimmedName = name.trim();
    const existing = await City.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Another city with this name already exists' });
    }

    const city = await City.findByIdAndUpdate(
      id,
      { name: trimmedName },
      { new: true }
    );

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'UPDATE_CITY',
      details: `Updated city name to: ${trimmedName}`
    });

    // Real-time socket broadcast update
    emitToAll('city_updated', { action: 'update', city });

    res.json({ success: true, message: 'City updated successfully', city });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const toggleCityStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    const adminUser = req.user!;

    const city = await City.findByIdAndUpdate(
      id,
      { isEnabled: !!isEnabled },
      { new: true }
    );

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'TOGGLE_CITY',
      details: `Toggled city: ${city.name} (${isEnabled ? 'Enabled' : 'Disabled'})`
    });

    // Real-time socket broadcast update
    emitToAll('city_updated', { action: 'toggle', city });

    res.json({ success: true, message: `City ${isEnabled ? 'enabled' : 'disabled'} successfully`, city });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const city = await City.findByIdAndDelete(id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_CITY',
      details: `Deleted city: ${city.name}`
    });

    // Real-time socket broadcast update
    emitToAll('city_updated', { action: 'delete', city });

    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
