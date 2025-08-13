export const HomePage = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to React App
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Built with Vite, React, TypeScript, Tailwind CSS, React Router, and React Query
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">⚡ Vite</h3>
          <p className="text-gray-600">Fast build tool and development server</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">🎨 Tailwind CSS</h3>
          <p className="text-gray-600">Utility-first CSS framework</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">🚀 React Query</h3>
          <p className="text-gray-600">Powerful data synchronization</p>
        </div>
      </div>
    </div>
  );
};