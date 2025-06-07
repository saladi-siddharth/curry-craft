import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { db, storage } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function RecipeForm() {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a recipe');
      return;
    }
    try {
      const recipeId = Date.now().toString();
      const recipeData = {
        title,
        ingredients: ingredients.split('\n').filter(i => i.trim()),
        instructions: instructions.split('\n').filter(i => i.trim()),
        userId: user.uid,
        createdAt: new Date(),
      };

      if (photo) {
        const photoRef = ref(storage, `recipe-photos/${recipeId}`);
        await uploadBytes(photoRef, photo);
        recipeData.image = await getDownloadURL(photoRef);
      }

      await setDoc(doc(db, 'recipes', recipeId), recipeData);
      setTitle('');
      setIngredients('');
      setInstructions('');
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Create Recipe</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Recipe Title"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ingredients (one per line)"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions (one per line)"
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
          className="p-2"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full bg-blue-500 text-white btn"
        >
          Submit Recipe
        </motion.button>
      </form>
    </motion.div>
  );
}

export default RecipeForm;