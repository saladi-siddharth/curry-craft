import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext } from '../../context/LanguageContext';

function LanguageSelector() {
  const { setLanguage } = useContext(LanguageContext);

  return (
    <motion.select
      whileHover={{ scale: 1.05 }}
      onChange={(e) => setLanguage(e.target.value)}
      className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
    >
      <option value="en">English</option>
      <option value="hi">Hindi</option>
      <option value="ta">Tamil</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </motion.select>
  );
}

export default LanguageSelector;