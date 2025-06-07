import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RecipeCard from '../components/Recipe/RecipeCard';
import { fetchTrendingRecipes } from '../services/api';
import { getRecommendedRecipes } from '../services/recommendation';

function Home() {
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const trending = await fetchTrendingRecipes('906bb98b3aa044778b0fc6e3a8fea54e');
        const recommended = await getRecommendedRecipes();
        setTrendingRecipes(trending.recipes || []);
        setRecommendedRecipes(recommended);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Trending Recipes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trendingRecipes.map((recipe, i) => (
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
      <h2 className="text-2xl font-bold mt-8 mb-4">Recommended for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedRecipes.map((recipe, i) => (
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

export default Home;