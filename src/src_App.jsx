import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import { motion } from 'framer-motion';
import Navbar from './components/UI/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import MealPlanner from './pages/MealPlanner';
import UserRecipes from './pages/UserRecipes';
import AdminDashboard from './pages/AdminDashboard';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

function App() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}
    >
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={user ? <Favorites /> : <Login />} />
          <Route path="/meal-planner" element={user ? <MealPlanner /> : <Login />} />
          <Route path="/user-recipes" element={user ? <UserRecipes /> : <Login />} />
          <Route path="/admin" element={user?.isAdmin ? <AdminDashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recipe/:id" element={<RecipeDetails />} />
        </Routes>
      </Router>
    </motion.div>
  );
}

export default App;