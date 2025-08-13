export const AboutPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">About</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          This is a modern React application built with the latest tools and best practices.
        </p>
        <h2 className="text-xl font-semibold mb-3">Tech Stack</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• React 18 with TypeScript</li>
          <li>• Vite for fast development and building</li>
          <li>• Tailwind CSS for styling</li>
          <li>• React Router for navigation</li>
          <li>• TanStack Query for data fetching</li>
        </ul>
      </div>
    </div>
  );
};