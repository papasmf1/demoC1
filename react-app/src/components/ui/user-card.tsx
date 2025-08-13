import { User } from '../../types';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
};