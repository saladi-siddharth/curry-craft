import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <motion.nav
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-blue-600 text-white p-4 sticky top-0 z-10"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/search" className="hover:underline">Search</Link>
          <Link to="/favorites" className="hover:underline">Favorites</Link>
          <Link to="/meal-planner" className="hover:underline">Meal Planner</Link>
          <Link to="/user-recipes" className="hover:underline">My Recipes</Link>
          {user?.isAdmin && <Link to="/admin" className="hover:underline">Admin</Link>}
        </div>
        <div className="flex space-x-4 items-center">
          <ThemeToggle />
          <LanguageSelector />
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="hover:underline"
            >
              Logout
            </motion.button>
          ) : (
            <Link to="/login" className="hover:underline">Login</Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;