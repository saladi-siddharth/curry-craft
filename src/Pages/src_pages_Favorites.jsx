import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import RecipeCard from '../components/Recipe/RecipeCard';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import { getDocs, collection } from 'firebase/firestore';

function Favorites() {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setError('Please log in to view favorites');
        setLoading(false);
        return;
      }
      try {
        const favDocs = await getDocs(collection(db, 'users', user.uid, 'favorites'));
        const favList = favDocs.docs.map(doc => doc.data());
        setFavorites(favList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
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
      <h2 className="text-2xl font-bold mb-4">Your Favorites</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {favorites.map((recipe, i) => (
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

export default Favorites;