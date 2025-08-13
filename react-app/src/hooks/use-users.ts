import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/api';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  });
};