import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          React App
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link to="/about" className="hover:text-blue-200">
            About
          </Link>
          <Link to="/users" className="hover:text-blue-200">
            Users
          </Link>
          <Link to="/data-table" className="hover:text-blue-200">
            DataTable Demo
          </Link>
        </div>
      </div>
    </nav>
  );
};