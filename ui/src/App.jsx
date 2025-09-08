import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Assets from './pages/Assets';
import Categories from './pages/Categories';

function App() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="assets" element={<Assets />} />
          <Route path="categories" element={<Categories />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;