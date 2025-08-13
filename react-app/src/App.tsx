import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './contexts/query-client';
import { Layout } from './components/layout/layout';
import { HomePage } from './pages/home-page';
import { AboutPage } from './pages/about-page';
import { UsersPage } from './pages/users-page';
import { DataTableDemo } from './pages/data-table-demo';

const App = () => {
  return (
    <QueryProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/data-table" element={<DataTableDemo />} />
          </Routes>
        </Layout>
      </Router>
    </QueryProvider>
  );
};

export default App;
