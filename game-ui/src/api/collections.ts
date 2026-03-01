import { apiClient } from './client';

export const createCollection = async (name: string, description = '') => {
  const res = await apiClient.post('/gallery/collections/', { name, description });
  return res.data;
};

export const listCollections = async () => {
  const res = await apiClient.get('/gallery/collections/');
  return res.data;
};
