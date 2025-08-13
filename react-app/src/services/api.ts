import { User, ApiResponse } from '../types';

// Mock API service - replace with real API calls
export const userService = {
  getUsers: async (): Promise<User[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    ];
  },

  getUser: async (id: string): Promise<User> => {
    const users = await userService.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },
};