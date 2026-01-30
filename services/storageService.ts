import { Resource, Project } from '../types';
import { INITIAL_RESOURCES, MOCK_PROJECTS } from '../constants';

const KEYS = {
  RESOURCES: 'optiresource_data',
  PROJECTS: 'optiresource_projects'
};

/**
 * StorageService handles data persistence.
 * Currently uses LocalStorage, but can be swapped for Supabase/Firebase 
 * by replacing these methods with API calls.
 */
export const StorageService = {
  getResources: (): Resource[] => {
    try {
      const stored = localStorage.getItem(KEYS.RESOURCES);
      return stored ? JSON.parse(stored) : INITIAL_RESOURCES;
    } catch (error) {
      console.error('Failed to load resources:', error);
      return INITIAL_RESOURCES;
    }
  },

  saveResources: (resources: Resource[]): void => {
    try {
      localStorage.setItem(KEYS.RESOURCES, JSON.stringify(resources));
    } catch (error) {
      console.error('Failed to save resources:', error);
    }
  },

  getProjects: (): Project[] => {
    try {
      const stored = localStorage.getItem(KEYS.PROJECTS);
      return stored ? JSON.parse(stored) : MOCK_PROJECTS;
    } catch (error) {
      console.error('Failed to load projects:', error);
      return MOCK_PROJECTS;
    }
  },

  saveProjects: (projects: Project[]): void => {
    try {
      localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }
};