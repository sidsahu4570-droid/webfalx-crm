import { Request, Response } from 'express';
import { LeadCategory } from '../models/LeadCategory';
import { logActivity } from '../services/activityService';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const filter: any = {};
    
    // Callers should only see enabled categories
    if (user.role === 'caller') {
      filter.isEnabled = true;
    }

    const categories = await LeadCategory.find(filter).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const adminUser = req.user!;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await LeadCategory.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await LeadCategory.create({ name: trimmedName, isEnabled: true });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CREATE_LEAD_CATEGORY',
      details: `Created lead category: ${trimmedName}`
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const adminUser = req.user!;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await LeadCategory.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Another category with this name already exists' });
    }

    const category = await LeadCategory.findByIdAndUpdate(
      id,
      { name: trimmedName },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'UPDATE_LEAD_CATEGORY',
      details: `Updated category name to: ${trimmedName}`
    });

    res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    const adminUser = req.user!;

    const category = await LeadCategory.findByIdAndUpdate(
      id,
      { isEnabled: !!isEnabled },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'TOGGLE_LEAD_CATEGORY',
      details: `Toggled lead category: ${category.name} (${isEnabled ? 'Enabled' : 'Disabled'})`
    });

    res.json({ success: true, message: `Category ${isEnabled ? 'enabled' : 'disabled'} successfully`, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const category = await LeadCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_LEAD_CATEGORY',
      details: `Deleted lead category: ${category.name}`
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
