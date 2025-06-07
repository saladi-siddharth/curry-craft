import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import { getDocs, collection } from 'firebase/firestore';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState({ searches: [], users: [], recipes: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.isAdmin) {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }
      try {
        const searchDocs = await getDocs(collection(db, 'searches'));
        const userDocs = await getDocs(collection(db, 'users'));
        const recipeDocs = await getDocs(collection(db, 'recipes'));
        setAnalytics({
          searches: searchDocs.docs.map(doc => doc.data()),
          users: userDocs.docs.map(doc => doc.data()),
          recipes: recipeDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-xl font-bold">Most Searched Ingredients</h3>
          <ul className="space-y-2">
            {analytics.searches.slice(0, 5).map((search, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {search.query}
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold">User Engagement</h3>
          <p>Active Users: {analytics.users.length}</p>
        </div>
        <div>
          <h3 className="text-xl font-bold">Recipe Popularity</h3>
          <ul className="space-y-2">
            {analytics.recipes.slice(0, 5).map((recipe, i) => (
              <motion.li
                key={recipe.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {recipe.title}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminDashboard;