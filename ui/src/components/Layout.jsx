
import { Link, Outlet } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiDollarSign, FiMenu, FiGrid } from 'react-icons/fi';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();

  const navItems = [
    { name: t('dashboard'), icon: FiHome, path: '/' },
    { name: t('expenses'), icon: FiTrendingUp, path: '/expenses' },
    { name: t('assets'), icon: FiDollarSign, path: '/assets' },
    { name: t('categories'), icon: FiGrid, path: '/categories' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-md flex flex-col`}>
        <div className="flex items-center justify-between p-4 h-16 border-b dark:border-gray-700">
            <span className={`font-bold text-xl text-blue-600 dark:text-blue-400 ${!isSidebarOpen && 'hidden'}`}>{t('sidebarTitle')}</span>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                <FiMenu />
            </button>
        </div>
        <nav className="flex-grow pt-4">
          <ul>
            {navItems.map(item => (
              <li key={item.name} className="px-4 py-2">
                <Link to={item.path} className="flex items-center p-2 text-base font-normal rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                  <item.icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  <span className={`ml-3 transition-opacity duration-300 ${!isSidebarOpen && 'opacity-0 hidden'}`}>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 border-b dark:border-gray-700">
            <h1 className="text-2xl font-semibold">{t('appTitle')}</h1>
            <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <Outlet /> {/* This is where the page content will be rendered */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
