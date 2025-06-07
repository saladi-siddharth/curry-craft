import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

function CalendarView() {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return;
      try {
        const mealDocs = await getDocs(collection(db, 'users', user.uid, 'meals'));
        const mealData = {};
        mealDocs.forEach(doc => {
          mealData[doc.id] = doc.data();
        });
        setMeals(mealData);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMeals();
  }, [user]);

  const handleAddMeal = async (recipe) => {
    if (!user) {
      setError('You must be logged in to add meals');
      return;
    }
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await setDoc(doc(db, 'users', user.uid, 'meals', dateStr), { recipe, date: dateStr });
      setMeals({ ...meals, [dateStr]: recipe });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Meal Planner</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        className="p-2 border rounded"
      />
      <div className="mt-4">
        {meals[selectedDate.toISOString().split('T')[0]] && (
          <p>Planned: {meals[selectedDate.toISOString().split('T')[0]].recipe.title}</p>
        )}
      </div>
      {/* Example button to add a recipe (replace with actual recipe selection UI) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleAddMeal({ title: 'Sample Recipe', ingredients: [], instructions: [] })}
        className="bg-blue-500 text-white btn mt-4"
      >
        Add Sample Meal
      </motion.button>
    </motion.div>
  );
}

export default CalendarView;