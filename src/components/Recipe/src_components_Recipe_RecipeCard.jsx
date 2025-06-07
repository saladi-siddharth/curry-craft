import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

function RecipeCard({ recipe }) {
  const { user } = useContext(AuthContext);

  const handleFavorite = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'favorites', recipe.id.toString()), recipe);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="card"
    >
      <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover rounded" />
      <h3 className="text-lg font-bold mt-2">{recipe.title}</h3>
      <p>{recipe.summary?.substring(0, 100)}...</p>
      <Link to={`/recipe/${recipe.id}`} className="text-blue-500 hover:underline">
        View Details
      </Link>
      {user && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFavorite}
          className="mt-2 bg-red-500 text-white btn"
        >
          Add to Favorites
        </motion.button>
      )}
    </motion.div>
  );
}

export default RecipeCard;