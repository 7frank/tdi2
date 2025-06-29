// src/components/Router.tsx
import React, { useState } from 'react';

interface Route {
  path: string;
  component: React.ReactNode;
  title: string;
  description: string;
}

interface RouterProps {
  routes: Route[];
  defaultRoute?: string;
}

export const Router: React.FC<RouterProps> = ({ routes, defaultRoute }) => {
  const [currentPath, setCurrentPath] = useState(defaultRoute || routes[0]?.path || '/');

  const currentRoute = routes.find(route => route.path === currentPath) || routes[0];

  const handleNavigation = (path: string) => {
    setCurrentPath(path);
    // Update URL without page reload
    window.history.pushState({}, '', path);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                🎯 TDI2 - Interface-Based Dependency Injection
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {routes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleNavigation(route.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPath === route.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {route.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>



      {/* Page Header */}
      {currentRoute && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h2 className="text-3xl font-bold text-gray-900">{currentRoute.title}</h2>
            <p className="mt-2 text-gray-600">{currentRoute.description}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto">
        {currentRoute?.component}
      </main>
    </div>
  );
};