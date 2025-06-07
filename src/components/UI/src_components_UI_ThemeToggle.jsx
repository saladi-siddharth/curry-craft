import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded bg-gray-200 dark:bg-gray-700"
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </motion.button>
  );
}

export default ThemeToggle;