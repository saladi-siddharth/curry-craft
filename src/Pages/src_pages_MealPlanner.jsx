import React from 'react';
import { motion } from 'framer-motion';
import CalendarView from '../components/MealPlanner/CalendarView';
import GroceryList from '../components/MealPlanner/GroceryList';

function MealPlanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Meal Planner</h2>
      <CalendarView />
      <GroceryList />
    </motion.div>
  );
}

export default MealPlanner;