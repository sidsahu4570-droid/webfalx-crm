import { api } from './api';
import { ResourceNote, Resource, CallerAssignment } from '../types';

export const resourceService = {
  // Notes CRUD
  getNotes: async (): Promise<{ success: boolean; notes: ResourceNote[] }> => {
    const res = await api.get('/resources/notes');
    return res.data;
  },

  createNote: async (title: string, content: string): Promise<{ success: boolean; note: ResourceNote; message: string }> => {
    const res = await api.post('/resources/notes', { title, content });
    return res.data;
  },

  updateNote: async (id: string, title: string, content: string): Promise<{ success: boolean; note: ResourceNote; message: string }> => {
    const res = await api.put(`/resources/notes/${id}`, { title, content });
    return res.data;
  },

  deleteNote: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/resources/notes/${id}`);
    return res.data;
  },

  // Image Resources CRUD
  getResources: async (): Promise<{ success: boolean; resources: Resource[] }> => {
    const res = await api.get('/resources/images');
    return res.data;
  },

  createResource: async (title: string, description: string, imageUrl: string): Promise<{ success: boolean; resource: Resource; message: string }> => {
    const res = await api.post('/resources/images', { title, description, imageUrl });
    return res.data;
  },

  updateResource: async (id: string, title: string, description: string, imageUrl?: string): Promise<{ success: boolean; resource: Resource; message: string }> => {
    const res = await api.put(`/resources/images/${id}`, { title, description, imageUrl });
    return res.data;
  },

  deleteResource: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/resources/images/${id}`);
    return res.data;
  },

  // Assignment mappings
  getAssignments: async (): Promise<{ success: boolean; assignments: CallerAssignment[] }> => {
    const res = await api.get('/resources/assignments');
    return res.data;
  },

  saveAssignment: async (
    callerId: string,
    assignedNotes: string[],
    assignedResources: string[]
  ): Promise<{ success: boolean; assignment: CallerAssignment; message: string }> => {
    const res = await api.post('/resources/assignments', { callerId, assignedNotes, assignedResources });
    return res.data;
  },

  // Caller View
  getCallerResources: async (): Promise<{ success: boolean; notes: ResourceNote[]; resources: Resource[] }> => {
    const res = await api.get('/resources/caller-view');
    return res.data;
  }
};
