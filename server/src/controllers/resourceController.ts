import { Request, Response } from 'express';
import { Note } from '../models/Note';
import { Resource } from '../models/Resource';
import { CallerAssignment } from '../models/CallerAssignment';
import { logActivity } from '../services/activityService';
import { emitToAll, emitToUser } from '../socket/socketHandler';

// ==========================================
// 1. NOTES & SCRIPTS (ADMIN ONLY)
// ==========================================

export const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const adminUser = req.user!;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Note title and content are required' });
    }

    const note = await Note.create({
      title,
      content,
      createdBy: adminUser.id
    });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CREATE_NOTE',
      details: `Created script: ${title}`
    });

    emitToAll('resources_updated', { action: 'create_note', noteId: note._id });

    res.status(201).json({ success: true, message: 'Note created successfully', note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const adminUser = req.user!;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Note title and content are required' });
    }

    const note = await Note.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'UPDATE_NOTE',
      details: `Updated script: ${title}`
    });

    emitToAll('resources_updated', { action: 'update_note', noteId: note._id });

    res.json({ success: true, message: 'Note updated successfully', note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const note = await Note.findByIdAndDelete(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Clean up assignments referencing this note
    await CallerAssignment.updateMany(
      { assignedNotes: id },
      { $pull: { assignedNotes: id } }
    );

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_NOTE',
      details: `Deleted script: ${note.title}`
    });

    emitToAll('resources_updated', { action: 'delete_note', noteId: id });

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ==========================================
// 2. IMAGE RESOURCES (ADMIN ONLY)
// ==========================================

export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createResource = async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl } = req.body;
    const adminUser = req.user!;

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Image title and file are required' });
    }

    const resource = await Resource.create({
      title,
      description,
      imageUrl
    });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CREATE_RESOURCE',
      details: `Created image resource: ${title}`
    });

    emitToAll('resources_updated', { action: 'create_resource', resourceId: resource._id });

    res.status(201).json({ success: true, message: 'Resource created successfully', resource });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl } = req.body;
    const adminUser = req.user!;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Image title is required' });
    }

    const updateFields: any = { title, description };
    if (imageUrl) {
      updateFields.imageUrl = imageUrl;
    }

    const resource = await Resource.findByIdAndUpdate(id, updateFields, { new: true });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'UPDATE_RESOURCE',
      details: `Updated image resource: ${title}`
    });

    emitToAll('resources_updated', { action: 'update_resource', resourceId: resource._id });

    res.json({ success: true, message: 'Resource updated successfully', resource });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const resource = await Resource.findByIdAndDelete(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Clean up assignments referencing this resource
    await CallerAssignment.updateMany(
      { assignedResources: id },
      { $pull: { assignedResources: id } }
    );

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_RESOURCE',
      details: `Deleted image resource: ${resource.title}`
    });

    emitToAll('resources_updated', { action: 'delete_resource', resourceId: id });

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ==========================================
// 3. CALLER ASSIGNMENTS (ADMIN ONLY)
// ==========================================

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await CallerAssignment.find();
    res.json({ success: true, assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const saveAssignment = async (req: Request, res: Response) => {
  try {
    const { callerId, assignedNotes, assignedResources } = req.body;
    const adminUser = req.user!;

    if (!callerId) {
      return res.status(400).json({ success: false, message: 'Caller selection is required' });
    }

    const assignment = await CallerAssignment.findOneAndUpdate(
      { callerId },
      {
        assignedNotes: assignedNotes || [],
        assignedResources: assignedResources || [],
        assignedBy: adminUser.id,
        assignedAt: new Date()
      },
      { new: true, upsert: true }
    );

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'ASSIGN_RESOURCES',
      details: `Updated resources assignment mapping for caller ID: ${callerId}`
    });

    // Notify caller instantly
    emitToUser(callerId, 'resources_updated', { action: 'assign' });

    res.json({ success: true, message: 'Assignments saved successfully', assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ==========================================
// 4. CALLER WORKSPACE (CALLER ONLY)
// ==========================================

export const getCallerResources = async (req: Request, res: Response) => {
  try {
    const callerId = req.user!.id;

    // Fetch caller assignment mapping
    const assignment = await CallerAssignment.findOne({ callerId })
      .populate('assignedNotes')
      .populate('assignedResources');

    if (!assignment) {
      return res.json({
        success: true,
        notes: [],
        resources: []
      });
    }

    res.json({
      success: true,
      notes: assignment.assignedNotes || [],
      resources: assignment.assignedResources || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
