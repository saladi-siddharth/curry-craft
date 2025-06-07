const API_KEY = process.env.REACT_APP_SPOONACULAR_API_KEY;

export const searchRecipes = async (query, filters) => {
  const { diet = '', cuisine = '', time = '', calories = '' } = filters || {};
  try {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&diet=${diet}&cuisine=${cuisine}&maxReadyTime=${time}&maxCalories=${calories}&apiKey=${API_KEY}&addRecipeInformation=true&number=10`
    );
    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('API quota exceeded. Please check your Spoonacular API plan.');
      }
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('Error searching recipes:', err);
    throw new Error(`Error searching recipes: ${err.message}`);
  }
};

export const fetchRecipeDetails = async (id) => {
  try {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}&includeNutrition=true`
    );
    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('API quota exceeded. Please check your Spoonacular API plan.');
      }
      throw new Error(`Failed to fetch recipe details: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching recipe details:', err);
    throw new Error(`Error fetching recipe details: ${err.message}`);
  }
};