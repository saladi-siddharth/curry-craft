import { db } from './firebase';
import { getDocs, collection } from 'firebase/firestore';
import { fetchTrendingRecipes } from './api';

export const getRecommendedRecipes = async () => {
  try {
    const userDocs = await getDocs(collection(db, 'users'));
    const preferences = userDocs.docs.map(doc => doc.data().preferences || {});
    // Mock recommendation logic: combine user preferences with trending recipes
    const trending = await fetchTrendingRecipes('906bb98b3aa044778b0fc6e3a8fea54e');
    return trending.recipes.slice(0, 5); // Return top 5 trending as mock recommendations
  } catch (err) {
    console.error('Recommendation error:', err);
    return [
      { id: 1, title: 'Fallback Recipe 1', image: '', summary: 'A delicious fallback recipe' },
      { id: 2, title: 'Fallback Recipe 2', image: '', summary: 'Another tasty fallback' },
    ];
  }
};