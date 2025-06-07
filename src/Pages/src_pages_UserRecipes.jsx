import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import RecipeForm from '../components/Recipe/RecipeForm';
import RecipeCard from '../components/Recipe/RecipeCard';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import { getDocs, collection, query, where } from 'firebase/firestore';

function UserRecipes() {
  const { user } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!user) {
        setError('Please log in to view your recipes');
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
        const recipeDocs = await getDocs(q);
        const recipeList = recipeDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecipes(recipeList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRecipes();
  }, [user]);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Your Recipes</h2>
      <RecipeForm />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {recipes.map((recipe, i) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <RecipeCard recipe={recipe} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default UserRecipes;