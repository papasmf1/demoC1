import { useUsers } from '../hooks/use-users';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { UserCard } from '../components/ui/user-card';

export const UsersPage = () => {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading users</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};