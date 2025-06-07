import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecipeCard from '../components/Recipe/RecipeCard';
import { searchRecipes } from '../services/api';

function Search() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ diet: '', cuisine: '', time: '', calories: '' });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const recipes = await searchRecipes(query, filters, '906bb98b3aa044778b0fc6e3a8fea54e');
      setResults(recipes.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-4">Search Recipes</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter ingredients (e.g., chicken, tomato)"
          className="w-full p-2 border rounded"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            onChange={(e) => setFilters({ ...filters, diet: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">Diet</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="glutenFree">Gluten-Free</option>
          </select>
          <select
            onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">Cuisine</option>
            <option value="indian">Indian</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
          </select>
          <input
            type="number"
            placeholder="Max Time (min)"
            onChange={(e) => setFilters({ ...filters, time: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Max Calories"
            onChange={(e) => setFilters({ ...filters, calories: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          className="bg-blue-500 text-white btn"
        >
          {loading ? 'Searching...' : 'Search'}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {results.map((recipe, i) => (
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

export default Search;