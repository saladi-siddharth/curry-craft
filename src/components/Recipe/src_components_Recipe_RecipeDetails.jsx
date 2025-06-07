import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRecipeDetails } from '../../services/api';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import VoiceAssistant from '../VoiceAssistant/VoiceAssistant';
import { generatePDF } from '../../services/pdfGenerator';
import { db, storage } from '../../services/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function RecipeDetails() {
  const { id } = useParams();
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [timers, setTimers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const data = await fetchRecipeDetails(id, '906bb98b3aa044778b0fc6e3a8fea54e');
        if (data) {
          setRecipe(data);
        } else {
          setError('Failed to load recipe');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id]);

  const handleRating = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'recipes', id, 'ratings', user.uid), { rating, timestamp: new Date() });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComment = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'recipes', id, 'comments', user.uid), { comment, timestamp: new Date() });
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhotoUpload = async () => {
    if (!user || !photo) return;
    try {
      const photoRef = ref(storage, `recipe-photos/${id}/${user.uid}`);
      await uploadBytes(photoRef, photo);
      const url = await getDownloadURL(photoRef);
      await setDoc(doc(db, 'recipes', id, 'photos', user.uid), { url, timestamp: new Date() });
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportPDF = () => {
    if (recipe) {
      generatePDF(recipe, user?.displayName || 'Anonymous');
    }
  };

  const handleCompleteRecipe = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;
  if (!recipe) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 relative"
    >
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            className="confetti absolute inset-0 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full absolute"
                style={{ left: `${Math.random() * 100}%`, top: 0 }}
                animate={{ y: '100vh', rotate: 360 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <h1 className="text-3xl font-bold">{t(recipe.title)}</h1>
      <img src={recipe.image} alt={recipe.title} className="w-full h-64 object-cover rounded" />
      <VoiceAssistant steps={recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step) || []} />
      <div>
        <h2 className="text-xl font-bold mt-4">{t('Ingredients')}</h2>
        <ul>
          {recipe.extendedIngredients?.map((ing, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {t(ing.original)}
            </motion.li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-bold mt-4">{t('Instructions')}</h2>
        {recipe.analyzedInstructions?.[0]?.steps?.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p>{t(step.step)}</p>
            {step.step.toLowerCase().includes('minutes') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimers([...timers, { step: step.step, time: 300 }])}
                className="bg-blue-500 text-white btn"
              >
                Start Timer
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-bold mt-4">{t('Nutrition')}</h2>
        <p>Calories: {recipe.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 'N/A'}</p>
        <p>Protein: {recipe.nutrition?.nutrients.find(n => n.name === 'Protein')?.amount || 'N/A'}</p>
        <p>Carbs: {recipe.nutrition?.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 'N/A'}</p>
        <p>Fat: {recipe.nutrition?.nutrients.find(n => n.name === 'Fat')?.amount || 'N/A'}</p>
      </div>
      {user && (
        <>
          <div>
            <h2 className="text-xl font-bold mt-4">{t('Rate this Recipe')}</h2>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="p-2 border rounded"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRating}
              className="bg-blue-500 text-white btn ml-2"
            >
              Submit Rating
            </motion.button>
          </div>
          <div>
            <h2 className="text-xl font-bold mt-4">{t('Comments')}</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComment}
              className="bg-blue-500 text-white btn mt-2"
            >
              Post Comment
            </motion.button>
          </div>
          <div>
            <h2 className="text-xl font-bold mt-4">{t('Upload Photo')}</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="p-2"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePhotoUpload}
              className="bg-blue-500 text-white btn mt-2"
            >
              Upload
            </motion.button>
          </div>
        </>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleExportPDF}
        className="bg-green-500 text-white btn mt-4"
      >
        Export as PDF
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCompleteRecipe}
        className="bg-purple-500 text-white btn mt-4 ml-2"
      >
        Mark as Completed
      </motion.button>
    </motion.div>
  );
}

export default RecipeDetails;