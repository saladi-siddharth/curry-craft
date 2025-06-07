import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { getDocs, collection } from 'firebase/firestore';

function GroceryList() {
  const { user } = useContext(AuthContext);
  const [groceryList, setGroceryList] = useState([]);
  const [inStock, setInStock] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return;
      try {
        const mealDocs = await getDocs(collection(db, 'users', user.uid, 'meals'));
        const ingredients = [];
        mealDocs.forEach(doc => {
          ingredients.push(...(doc.data().recipe.ingredients || []));
        });
        setGroceryList([...new Set(ingredients)]); // Remove duplicates
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMeals();
  }, [user]);

  const handleToggleStock = (item) => {
    setInStock({ ...inStock, [item]: !inStock[item] });
  };

  const shareList = () => {
    const listText = groceryList.map(item => `${inStock[item] ? '[x]' : '[ ]'} ${item}`).join('\n');
    const shareUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(listText)}`;
    const a = document.createElement('a');
    a.href = shareUrl;
    a.download = 'grocery-list.txt';
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Grocery List</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {groceryList.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <input
              type="checkbox"
              checked={inStock[item] || false}
              onChange={() => handleToggleStock(item)}
              className="mr-2"
            />
            {item}
          </motion.li>
        ))}
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareList}
        className="bg-blue-500 text-white btn mt-4"
      >
        Share List
      </motion.button>
    </motion.div>
  );
}

export default GroceryList;