import React from 'react';
import { Users, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2 p-1.5 bg-primary-600 rounded-md text-white">
            <Users size={24} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">HR Candidates Dashboard</h1>
        </div>
        
        <nav className="hidden md:flex space-x-1">
          <Link 
            to="/"
            className={`px-4 py-2 rounded-md flex items-center space-x-1 transition-colors ${
              isActive('/') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={18} />
            <span>Candidates</span>
          </Link>
          
          <Link 
            to="/insights"
            className={`px-4 py-2 rounded-md flex items-center space-x-1 transition-colors ${
              isActive('/insights') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={18} />
            <span>Insights</span>
          </Link>
        </nav>
        
        <div className="md:hidden">
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;