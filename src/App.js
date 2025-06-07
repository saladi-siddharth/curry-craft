import React, { useState, useEffect, useRef, useCallback } from 'react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup,
  signInWithCustomToken, // Import signInWithCustomToken
  signInAnonymously // Import signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

// YOUR SPOONACULAR API KEY
// IMPORTANT: For production deployment, consider moving this API key to a server-side proxy
// or environment variables to prevent client-side exposure.
const SPOONACULAR_API_KEY = '96d9cb981707407ebcf670ed5134907a';

// Gemini API Key (left empty as per instructions for Canvas runtime injection)
const GEMINI_API_KEY = ""; // Canvas will provide this at runtime

// Screen names for navigation
const SCREENS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  PHONE_LOGIN: 'phone_login',
  HOME: 'home',
  RECIPE_LIST: 'recipe_list',
  RECIPE_DETAIL: 'recipe_detail',
  PROCEDURE: 'procedure',
  COMPLETED: 'completed',
  SETTINGS: 'settings', // New settings screen
};

// Translations for static UI text
const translations = {
  en: {
    welcomeBack: "Welcome Back!",
    createAccount: "Create Account",
    loginWithPhone: "Login with Phone",
    loginWithGoogle: "Login with Google", // New translation key
    email: "Email",
    password: "Password",
    loginWithEmail: "Login with Email",
    dontHaveAccount: "Don't have an account?",
    signUp: "Sign Up",
    alreadyHaveAccount: "Already have an account?",
    backToEmailLogin: "Back to Email Login",
    enterPhoneNumber: "Enter phone number (e.g., +1234567890)",
    sendOtp: "Send OTP",
    enterVerificationCode: "Enter verification code", // Used for placeholder
    verifyOtp: "Verify OTP",
    otpSent: "OTP sent to your phone!",
    whatsInKitchen: "What's in your kitchen?",
    enterIngredient: "Enter ingredient (e.g., 'chicken', 'rice')",
    addIngredient: "Add Ingredient",
    yourIngredients: "Your Ingredients:",
    clearAll: "Clear All",
    selectCuisine: "Select Cuisine (Optional):",
    anyCuisine: "Any Cuisine",
    findRecipes: "Find Recipes",
    recommendedRecipes: "Recommended Recipes",
    backToIngredients: "Back to Ingredients",
    ingredients: "Ingredients",
    description: "Description",
    startCookingProcedure: "Start Cooking Procedure",
    copyRecipe: "Copy Recipe",
    copied: "Copied!",
    cookingProcedure: "Cooking Procedure",
    step: "Step",
    previousStep: "Previous Step",
    nextStep: "Next Step",
    finishCooking: "Finish Cooking!",
    congratulations: "🎉 Congratulations! 🎉",
    recipeCompleted: "You've successfully completed the recipe:",
    cookAnotherRecipe: "Cook Another Recipe",
    logout: "Logout",
    loadingApp: "Loading app...",
    error: "Error:",
    pleaseAddIngredient: "Please add at least one ingredient to find recipes.",
    failedToFetchRecipes: "Failed to fetch recipes:",
    noRecipesFound: "No recipes found for your ingredients and cuisine. Try adding more or changing the cuisine!",
    settings: "Settings",
    language: "Language",
    popularDishes: "Popular Dishes",
    viewPopularDishes: "View Popular Dishes",
    backToHome: "Back to Home",
    noInstructions: "No detailed instructions available for this recipe.",
    failedToLoadUserData: "Failed to load user data. Please try again.",
    failedToSaveIngredient: "Failed to save ingredient to the cloud. Please try again.",
    failedToRemoveIngredient: "Failed to remove ingredient from the cloud. Please try again.",
    failedToClearIngredients: "Failed to clear ingredients in the cloud. Please try again.",
    securityCheckNotReady: "Security check not ready. Please try again.",
    firebaseAuthNotInitialized: "Firebase Auth not initialized.",
    pleaseSendOtpFirst: "Please send OTP first.",
    enterVerificationCodeError: "Please enter the verification code.", // Used for error message
    otpExpired: "Recaptcha expired. Please try sending OTP again.",
    failedToLoadSecurity: "Failed to load security check. Please refresh.",
    failedToInitAuth: "Failed to initialize authentication. Please check your Firebase config.",
    translatingContent: "Translating content",
    yourDish: "Your Dish",
    addSomeIngredients: "Add some ingredients to get started!",
    noDescription: "No description available.",
    recipe: "Recipe",
    backToRecipes: "Back to Recipes",
    defaultCuisine: "Default Cuisine", // New translation key
    backToDetails: "Back to Details", // New translation for procedure screen
    substitute: "Substitute", // New translation key
    ingredientSubstitutions: "Ingredient Substitutions for", // New translation key
    creativeRecipeIdea: "Creative Recipe Idea", // New translation key
    generateCreativeIdea: "Generate Creative Idea", // New translation key
    recipeName: "Recipe Name", // New translation key
    keyIngredients: "Key Ingredients", // New translation key
    close: "Close", // New translation key
    generatingIdea: "Generating idea...", // New translation key
    findingSubstitutions: "Finding substitutions...", // New translation key
    shortProcedure: "Short Procedure", // New translation key
    noIdeaGenerated: "No idea generated.", // New translation key
    noSuggestionsFound: "No suggestions found.", // New translation key
  },
  hi: { // Hindi
    welcomeBack: "वापस स्वागत है!",
    createAccount: "खाता बनाएं",
    loginWithPhone: "फोन से लॉगिन करें",
    loginWithGoogle: "गूगल से लॉगिन करें", // New translation key
    email: "ईमेल",
    password: "पासवर्ड",
    loginWithEmail: "ईमेल से लॉगिन करें",
    dontHaveAccount: "खाता नहीं है?",
    signUp: "साइन अप करें",
    alreadyHaveAccount: "पहले से ही खाता है?",
    backToEmailLogin: "ईमेल लॉगिन पर वापस",
    enterPhoneNumber: "फोन नंबर दर्ज करें (उदाहरण: +919876543210)",
    sendOtp: "ओटीपी भेजें",
    enterVerificationCode: "सत्यापन कोड दर्ज करें", // Used for placeholder
    verifyOtp: "ओटीपी सत्यापित करें",
    otpSent: "आपके फोन पर ओटीपी भेजा गया है!",
    whatsInKitchen: "आपके रसोई में क्या है?",
    enterIngredient: "सामग्री दर्ज करें (उदाहरण: 'चिकन', 'चावल')",
    addIngredient: "सामग्री जोड़ें",
    yourIngredients: "आपकी सामग्री:",
    clearAll: "सभी साफ करें",
    selectCuisine: "व्यंजन चुनें (वैकल्पिक):",
    anyCuisine: "कोई भी व्यंजन",
    findRecipes: "रेसिपी खोजें",
    recommendedRecipes: "अनुशंसित व्यंजन",
    backToIngredients: "सामग्री पर वापस",
    ingredients: "सामग्री",
    description: "विवरण",
    startCookingProcedure: "खाना पकाने की विधि शुरू करें",
    copyRecipe: "रेसिपी कॉपी करें",
    copied: "कॉपी किया गया!",
    cookingProcedure: "खाना पकाने की विधि",
    step: "चरण",
    previousStep: "पिछला चरण",
    nextStep: "अगला चरण",
    finishCooking: "खाना पकाना समाप्त करें!",
    congratulations: "🎉 बधाई हो! 🎉",
    recipeCompleted: "आपने सफलतापूर्वक रेसिपी पूरी कर ली है:",
    cookAnotherRecipe: "एक और रेसिपी बनाएं",
    logout: "लॉग आउट",
    loadingApp: "ऐप लोड हो रहा है...",
    error: "त्रुटि:",
    pleaseAddIngredient: "रेसिपी खोजने के लिए कृपया कम से कम एक सामग्री जोड़ें।",
    failedToFetchRecipes: "रेसिपी लाने में विफल:",
    noRecipesFound: "आपकी सामग्री और व्यंजन के लिए कोई रेसिपी नहीं मिली। अधिक जोड़ें या व्यंजन बदलें!",
    settings: "सेटिंग्स",
    language: "भाषा",
    popularDishes: "लोकप्रिय व्यंजन",
    viewPopularDishes: "लोकप्रिय व्यंजन देखें",
    backToHome: "होम पर वापस",
    noInstructions: "इस रेसिपी के लिए कोई विस्तृत निर्देश उपलब्ध नहीं हैं।",
    failedToLoadUserData: "उपयोगकर्ता डेटा लोड करने में विफल। कृपया पुनः प्रयास करें।",
    failedToSaveIngredient: "सामग्री को क्लाउड पर सहेजने में विफल। कृपया पुनः प्रयास करें।",
    failedToRemoveIngredient: "सामग्री को क्लाउड से हटाने में विफल। कृपया पुनः प्रयास करें।",
    failedToClearIngredients: "क्लाउड में सामग्री साफ़ करने में विफल। कृपया पुनः प्रयास करें।",
    securityCheckNotReady: "सुरक्षा जांच तैयार नहीं है। कृपया पुनः प्रयास करें।",
    firebaseAuthNotInitialized: "फायरबेस प्रमाणीकरण प्रारंभ नहीं हुआ।",
    pleaseSendOtpFirst: "कृपया पहले ओटीपी भेजें।",
    enterVerificationCodeError: "कृपया सत्यापन कोड दर्ज करें।", // Used for error message
    otpExpired: "रिकैप्चा समाप्त हो गया। कृपया ओटीपी दोबारा भेजने का प्रयास करें।",
    failedToLoadSecurity: "सुरक्षा जांच लोड करने में विफल। कृपया रीफ्रेश करें।",
    failedToInitAuth: "प्रमाणीकरण प्रारंभ करने में विफल। कृपया अपनी फायरबेस कॉन्फ़िगरेशन जांचें。",
    translatingContent: "सामग्री का अनुवाद हो रहा है",
    yourDish: "आपका व्यंजन",
    addSomeIngredients: "शुरू करने के लिए कुछ सामग्री जोड़ें!",
    noDescription: "इस रेसिपी के लिए कोई विवरण उपलब्ध नहीं है।",
    recipe: "रेसिपी",
    backToRecipes: "रेसिपी पर वापस",
    defaultCuisine: "डिफ़ॉल्ट व्यंजन", // New translation key
    backToDetails: "विवरण पर वापस", // New translation for procedure screen
    substitute: "बदलें", // New translation key
    ingredientSubstitutions: "सामग्री के विकल्प", // New translation key
    creativeRecipeIdea: "रचनात्मक रेसिपी विचार", // New translation key
    generateCreativeIdea: "रचनात्मक विचार उत्पन्न करें", // New translation key
    recipeName: "रेसिपी का नाम", // New translation key
    keyIngredients: "मुख्य सामग्री", // New translation key
    close: "बंद करें", // New translation key
    generatingIdea: "विचार उत्पन्न हो रहा है...", // New translation key
    findingSubstitutions: "विकल्प खोजे जा रहे हैं...", // New translation key
    shortProcedure: "संक्षिप्त विधि", // New translation key
    noIdeaGenerated: "कोई विचार उत्पन्न नहीं हुआ।", // New translation key
    noSuggestionsFound: "कोई सुझाव नहीं मिला।", // New translation key
  },
  kn: { // Kannada
    welcomeBack: "ಮರಳಿ ಸ್ವಾಗತ!",
    createAccount: "ಖಾತೆ ರಚಿಸಿ",
    loginWithPhone: "ಫೋನ್ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ",
    loginWithGoogle: "ಗೂಗಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ", // New translation key
    email: "ಇಮೇಲ್",
    password: "ಪಾಸ್ವರ್ಡ್",
    loginWithEmail: "ಇಮೇಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ",
    dontHaveAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
    signUp: "ಸೈನ್ ಅಪ್ ಮಾಡಿ",
    alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    backToEmailLogin: "ಇಮೇಲ್ ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    enterPhoneNumber: "ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (ಉದಾ: +919876543210)",
    sendOtp: "OTP ಕಳುಹಿಸಿ",
    enterVerificationCode: "ಪರಿಶೀಲನಾ ಕೋಡ್ ನಮೂದಿಸಿ", // Used for placeholder
    verifyOtp: "OTP ಪರಿಶೀಲಿಸಿ",
    otpSent: "ನಿಮ್ಮ ಫೋನ್‌ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ!",
    whatsInKitchen: "ನಿಮ್ಮ ಅಡುಗೆಮನೆಯಲ್ಲಿ ಏನಿದೆ?",
    enterIngredient: "ಪದಾರ್ಥ ನಮೂದಿಸಿ (ಉದಾ: 'ಚಿಕನ್', 'ಅಕ್ಕಿ')",
    addIngredient: "ಪದಾರ್ಥ ಸೇರಿಸಿ",
    yourIngredients: "ನಿಮ್ಮ ಪದಾರ್ಥಗಳು:",
    clearAll: "ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ",
    selectCuisine: "ಅಡುಗೆ ಶೈಲಿ ಆಯ್ಕೆಮಾಡಿ (ಐಚ್ಛಿಕ):",
    anyCuisine: "ಯಾವುದೇ ಅಡುಗೆ ಶೈಲಿ",
    findRecipes: "ಪಾಕವಿಧಾನಗಳನ್ನು ಹುಡುಕಿ",
    recommendedRecipes: "ಶಿಫಾರಸು ಮಾಡಿದ ಪಾಕವಿಧಾನಗಳು",
    backToIngredients: "ಪದಾರ್ಥಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    ingredients: "ಪದಾರ್ಥಗಳು",
    description: "ವಿವರಣೆ",
    startCookingProcedure: "ಅಡುಗೆ ವಿಧಾನ ಪ್ರಾರಂಭಿಸಿ",
    copyRecipe: "ಪಾಕವಿಧಾನ ನಕಲಿಸಿ",
    copied: "ನಕಲಿಸಲಾಗಿದೆ!",
    cookingProcedure: "ಅಡುಗೆ ವಿಧಾನ",
    step: "ಹಂತ",
    previousStep: "ಹಿಂದಿನ ಹಂತ",
    nextStep: "ಮುಂದಿನ ಹಂತ",
    finishCooking: "ಅಡುಗೆ ಮುಗಿಸಿ!",
    congratulations: "🎉 ಅಭಿನಂದನೆಗಳು! 🎉",
    recipeCompleted: "ನೀವು ಪಾಕವಿಧಾನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ:",
    cookAnotherRecipe: "ಮತ್ತೊಂದು ಪಾಕವಿಧಾನ ಮಾಡಿ",
    logout: "ಲಾಗ್ ಔಟ್",
    loadingApp: "ಅಪ್ಲಿಕೇಶನ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    error: "ದೋಷ:",
    pleaseAddIngredient: "ಪಾಕವಿಧಾನಗಳನ್ನು ಹುಡುಕಲು ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಪದಾರ್ಥವನ್ನು ಸೇರಿಸಿ.",
    failedToFetchRecipes: "ಪಾಕವಿಧಾನಗಳನ್ನು ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ:",
    noRecipesFound: "ನಿಮ್ಮ ಪದಾರ್ಥಗಳು ಮತ್ತು ಅಡುಗೆ ಶೈಲಿಗೆ ಯಾವುದೇ ಪಾಕವಿಧಾನಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹೆಚ್ಚಿನದನ್ನು ಸೇರಿಸಿ ಅಥವಾ ಅಡುಗೆ ಶೈಲಿಯನ್ನು ಬದಲಾಯಿಸಿ!",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    language: "ಭಾಷೆ",
    popularDishes: "ಜನಪ್ರಿಯ ಖಾದ್ಯಗಳು",
    viewPopularDishes: "ಜನಪ್ರಿಯ ಖಾದ್ಯಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    backToHome: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    noInstructions: "ಈ ಪಾಕವಿಧಾನಕ್ಕೆ ಯಾವುದೇ ವಿವರವಾದ ಸೂಚನೆಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    failedToLoadUserData: "ಬಳಕೆದಾರ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    failedToSaveIngredient: "ಕ್ಲೌಡ್‌ಗೆ ಪದಾರ್ಥವನ್ನು ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    failedToRemoveIngredient: "ಕ್ಲೌಡ್‌ನಿಂದ ಪದಾರ್ಥವನ್ನು ತೆಗೆದುಹಾಕಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    failedToClearIngredients: "ಕ್ಲೌಡ್‌ನಲ್ಲಿರುವ ಪದಾರ್ಥಗಳನ್ನು ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    securityCheckNotReady: "ಭದ್ರತಾ ಪರಿಶೀಲನೆ ಸಿದ್ಧವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    firebaseAuthNotInitialized: "ಫೈರ್‌ಬೇಸ್ ದೃಢೀಕರಣ ಪ್ರಾರಂಭವಾಗಿಲ್ಲ.",
    pleaseSendOtpFirst: "ದಯವಿಟ್ಟು ಮೊದಲು OTP ಕಳುಹಿಸಿ.",
    enterVerificationCodeError: "ದಯವಿಟ್ಟು ಪರಿಶೀಲನಾ ಕೋಡ್ ನಮೂದಿಸಿ。", // Used for error message
    otpExpired: "ರೀಕ್ಯಾಪ್ಚಾ ಅವಧಿ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು OTP ಅನ್ನು ಮತ್ತೆ ಕಳುಹಿಸಲು ಪ್ರಯತ್ನಿಸಿ.",
    failedToLoadSecurity: "ಭದ್ರತಾ ಪರಿಶೀಲನೆಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ರಿಫ್ರೆಶ್ ಮಾಡಿ.",
    failedToInitAuth: "ದೃಢೀಕರಣವನ್ನು ಪ್ರಾರಂಭಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೈರ್‌ಬೇಸ್ ಕಾನ್ಫಿಗರೇಶನ್ ಪರಿಶೀಲಿಸಿ。",
    translatingContent: "ವಿಷಯವನ್ನು ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ",
    yourDish: "ನಿಮ್ಮ ಖಾದ್ಯ",
    addSomeIngredients: "ಪ್ರಾರಂಭಿಸಲು ಕೆಲವು ಪದಾರ್ಥಗಳನ್ನು ಸೇರಿಸಿ!",
    noDescription: "ಈ ಪಾಕವಿಧಾನಕ್ಕೆ ಯಾವುದೇ ವಿವರಣೆ ಲಭ್ಯವಿಲ್ಲ.",
    recipe: "ಪಾಕವಿಧಾನ",
    backToRecipes: "ಪಾಕವಿಧಾನಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    defaultCuisine: "ಡೀಫಾಲ್ಟ್ ಅಡುಗೆ ಶೈಲಿ", // New translation key
    backToDetails: "ವಿವರಗಳಿಗೆ ಹಿಂತಿರುಗಿ", // New translation for procedure screen
    substitute: "ಬದಲಾವಣೆ", // New translation key
    ingredientSubstitutions: "ಪದಾರ್ಥದ ಪರ್ಯಾಯಗಳು", // New translation key
    creativeRecipeIdea: "ಸೃಜನಾತ್ಮಕ ಪಾಕವಿಧಾನ ಕಲ್ಪನೆ", // New translation key
    generateCreativeIdea: "ಸೃಜನಾತ್ಮಕ ಕಲ್ಪನೆಯನ್ನು ರಚಿಸಿ", // New translation key
    recipeName: "ಪಾಕವಿಧಾನದ ಹೆಸರು", // New translation key
    keyIngredients: "ಪ್ರಮುಖ ಪದಾರ್ಥಗಳು", // New translation key
    close: "ಮುಚ್ಚಿ", // New translation key
    generatingIdea: "ಕಲ್ಪನೆ ರಚಿಸಲಾಗುತ್ತಿದೆ...", // New translation key
    findingSubstitutions: "ಪರ್ಯಾಯಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...", // New translation key
    shortProcedure: "ಸಂಕ್ಷಿಪ್ತ ವಿಧಾನ", // New translation key
    noIdeaGenerated: "ಯಾವುದೇ ಕಲ್ಪನೆ ರಚಿಸಲಾಗಿಲ್ಲ.", // New translation key
    noSuggestionsFound: "ಯಾವುದೇ ಸಲಹೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.", // New translation key
  },
  ta: { // Tamil
    welcomeBack: "மீண்டும் வருக!",
    createAccount: "கணக்கை உருவாக்கு",
    loginWithPhone: "தொலைபேசி மூலம் உள்நுழைக",
    loginWithGoogle: "கூகிள் மூலம் உள்நுழைக", // New translation key
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    loginWithEmail: "மின்னஞ்சல் மூலம் உள்நுழை",
    dontHaveAccount: "கணக்கு இல்லையா?",
    signUp: "பதிவு செய்க",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    backToEmailLogin: "மின்னஞ்சல் உள்நுழைவுக்குத் திரும்பு",
    enterPhoneNumber: "தொலைபேசி எண்ணை உள்ளிடவும் (எ.கா: +919876543210)",
    sendOtp: "OTP அனுப்பு",
    enterVerificationCode: "சரிபார்ப்பு குறியீட்டை உள்ளிடவும்", // Used for placeholder
    verifyOtp: "OTP சரிபார்க்கவும்",
    otpSent: "உங்கள் தொலைபேசிக்கு OTP அனுப்பப்பட்டது!",
    whatsInKitchen: "உங்கள் சமையலறையில் என்ன இருக்கிறது?",
    enterIngredient: "பொருளை உள்ளிடவும் (எ.கா: 'சிக்கன்', 'அரிசி')",
    addIngredient: "பொருளைச் சேர்",
    yourIngredients: "உங்கள் பொருட்கள்:",
    clearAll: "அனைத்தையும் அழி",
    selectCuisine: "சமையல் வகையைத் தேர்ந்தெடுக்கவும் (விரும்பினால்):",
    anyCuisine: "எந்த சமையல் வகை",
    findRecipes: "சமையல் குறிப்புகளைக் கண்டறியவும்",
    recommendedRecipes: "பரிந்துரைக்கப்பட்ட சமையல் குறிப்புகள்",
    backToIngredients: "பொருட்களுக்குத் திரும்பு",
    ingredients: "பொருட்கள்",
    description: "விளக்கம்",
    startCookingProcedure: "சமையல் செய்முறையைத் தொடங்கு",
    copyRecipe: "சமையல் குறிப்பை நகலெடு",
    copied: "நகலெடுக்கப்பட்டது!",
    cookingProcedure: "சமையல் செய்முறை",
    step: "படி",
    previousStep: "முந்தைய படி",
    nextStep: "அடுத்த படி",
    finishCooking: "சமையலை முடி!",
    congratulations: "🎉 வாழ்த்துக்கள்! 🎉",
    recipeCompleted: "நீங்கள் சமையல் குறிப்பை வெற்றிகரமாக முடித்துவிட்டீர்கள்:",
    cookAnotherRecipe: "மற்றொரு சமையல் குறிப்பை சமை",
    logout: "வெளியேறு",
    loadingApp: "பயன்பாடு ஏற்றப்படுகிறது...",
    error: "பிழை:",
    pleaseAddIngredient: "சமையல் குறிப்புகளைக் கண்டறிய குறைந்தபட்சம் ஒரு பொருளைச் சேர்க்கவும்.",
    failedToFetchRecipes: "சமையல் குறிப்புகளைப் பெற முடியவில்லை:",
    noRecipesFound: "உங்கள் பொருட்கள் மற்றும் சமையல் வகைக்கு சமையல் குறிப்புகள் எதுவும் இல்லை. மேலும் சேர்க்கவும் அல்லது சமையல் வகையை மாற்றவும்!",
    settings: "அமைப்புகள்",
    language: "மொழி",
    popularDishes: "பிரபலமான உணவுகள்",
    viewPopularDishes: "பிரபலமான உணவுகளைக் காண்க",
    backToHome: "முகப்புக்குத் திரும்பு",
    noInstructions: "இந்த செய்முறைக்கு விரிவான வழிமுறைகள் எதுவும் இல்லை.",
    failedToLoadUserData: "பயனர் தரவை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    failedToSaveIngredient: "கிளவுட்டில் பொருளை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    failedToRemoveIngredient: "கிளவுட்டில் இருந்து பொருளை அகற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    failedToClearIngredients: "கிளவுட்டில் உள்ள பொருட்களை அழிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    securityCheckNotReady: "பாதுகாப்புச் சரிபார்ப்பு தயாராக இல்லை. மீண்டும் முயற்சிக்கவும்.",
    firebaseAuthNotInitialized: "ஃபயர்பேஸ் அங்கீகாரம் தொடங்கப்படவில்லை.",
    pleaseSendOtpFirst: "தயவுசெய்து முதலில் OTP ஐ அனுப்பவும்.",
    enterVerificationCodeError: "தயவுசெய்து சரிபார்ப்பு குறியீட்டை உள்ளிடவும்。", // Used for error message
    otpExpired: "ரீகேப்சா காலாவதியானது. தயவுசெய்து OTP ஐ மீண்டும் அனுப்ப முயற்சிக்கவும்.",
    failedToLoadSecurity: "பாதுகாப்புச் சரிபார்ப்பை ஏற்ற முடியவில்லை. புதுப்பிக்கவும்.",
    failedToInitAuth: "அங்கீகாரத்தைத் தொடங்க முடியவில்லை. உங்கள் ஃபயர்பேஸ் உள்ளமைவைச் சரிபார்க்கவும்。",
    translatingContent: "உள்ளடக்கம் மொழிபெயர்க்கப்படுகிறது",
    yourDish: "உங்கள் டிஷ்",
    addSomeIngredients: "தொடங்குவதற்கு சில பொருட்களைச் சேர்க்கவும்!",
    noDescription: "இந்த செய்முறைக்கு விளக்கம் எதுவும் இல்லை。",
    recipe: "சமையல் குறிப்பு",
    backToRecipes: "சமையல் குறிப்புகளுக்குத் திரும்பு",
    defaultCuisine: "இயல்புநிலை சமையல் வகை", // New translation key
    backToDetails: "விவரங்களுக்குத் திரும்பு", // New translation for procedure screen
    substitute: "பதிலீடு", // New translation key
    ingredientSubstitutions: "பொருட்களின் பதிலீடுகள்", // New translation key
    creativeRecipeIdea: "படைப்பு சமையல் குறிப்பு யோசனை", // New translation key
    generateCreativeIdea: "படைப்பு யோசனையை உருவாக்கு", // New translation key
    recipeName: "சமையல் குறிப்பு பெயர்", // New translation key
    keyIngredients: "முக்கிய பொருட்கள்", // New translation key
    close: "மூடு", // New translation key
    generatingIdea: "யோசனை உருவாக்கப்படுகிறது...", // New translation key
    findingSubstitutions: "பதிலீடுகளைக் கண்டறிதல்...", // New translation key
    shortProcedure: "குறுகிய செயல்முறை", // New translation key
    noIdeaGenerated: "எந்த யோசனையும் உருவாக்கப்படவில்லை.", // New translation key
    noSuggestionsFound: "எந்த பரிந்துரைகளும் இல்லை.", // New translation key
  },
  ml: { // Malayalam
    welcomeBack: "സ്വാഗതം!",
    createAccount: "അക്കൗണ്ട് ഉണ്ടാക്കുക",
    loginWithPhone: "ഫോൺ നമ്പർ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക",
    loginWithGoogle: "ഗൂഗിൾ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക", // New translation key
    email: "ഇമെയിൽ",
    password: "പാസ്‌വേഡ്",
    loginWithEmail: "ഇമെയിൽ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക",
    dontHaveAccount: "അക്കൗണ്ട് ഇല്ലേ?",
    signUp: "സൈൻ അപ്പ് ചെയ്യുക",
    alreadyHaveAccount: "മുമ്പേ അക്കൗണ്ട് ഉണ്ടോ?",
    backToEmailLogin: "ഇമെയിൽ ലോഗിനിലേക്ക് തിരികെ",
    enterPhoneNumber: "ഫോൺ നമ്പർ നൽകുക (ഉദാ: +919876543210)",
    sendOtp: "OTP അയക്കുക",
    enterVerificationCode: "സ്ഥിരീകരണ കോഡ് നൽകുക", // Used for placeholder
    verifyOtp: "OTP സ്ഥിരീകരിക്കുക",
    otpSent: "നിങ്ങളുടെ ഫോണിലേക്ക് OTP അയച്ചിട്ടുണ്ട്!",
    whatsInKitchen: "നിങ്ങളുടെ അടുക്കളയിൽ എന്തൊക്കെയുണ്ട്?",
    enterIngredient: "ചേരുവ നൽകുക (ഉദാ: 'ചിക്കൻ', 'അരി')",
    addIngredient: "ചേരുവ ചേർക്കുക",
    yourIngredients: "നിങ്ങളുടെ ചേരുവകൾ:",
    clearAll: "എല്ലാം മായ്ക്കുക",
    selectCuisine: "പാചകരീതി തിരഞ്ഞെടുക്കുക (ഓപ്ഷണൽ):",
    anyCuisine: "ഏത് പാചകരീതിയും",
    findRecipes: "പാചകക്കുറിപ്പുകൾ കണ്ടെത്തുക",
    recommendedRecipes: "ശുപാർശ ചെയ്ത പാചകക്കുറിപ്പുകൾ",
    backToIngredients: "ചേരുവകളിലേക്ക് തിരികെ",
    ingredients: "ചേരുവകൾ",
    description: "വിവരണം",
    startCookingProcedure: "പാചകരീതി ആരംഭിക്കുക",
    copyRecipe: "പാചകക്കുറിപ്പ് പകർത്തുക",
    copied: "പകർത്തി!",
    cookingProcedure: "പാചകരീതി",
    step: "ഘട്ടം",
    previousStep: "മുമ്പത്തെ ഘട്ടം",
    nextStep: "അടുത്ത ഘട്ടം",
    finishCooking: "പാചകം പൂർത്തിയാക്കുക!",
    congratulations: "🎉 അഭിനന്ദനങ്ങൾ! 🎉",
    recipeCompleted: "നിങ്ങൾ പാചകക്കുറിപ്പ് വിജയകരമായി പൂർത്തിയാക്കിയിരിക്കുന്നു:",
    cookAnotherRecipe: "മറ്റൊരു പാചകക്കുറിപ്പ് ഉണ്ടാക്കുക",
    logout: "പുറത്തുകടക്കുക",
    loadingApp: "ആപ്പ് ലോഡ് ചെയ്യുന്നു...",
    error: "പിശക്:",
    pleaseAddIngredient: "പാചകക്കുറിപ്പുകൾ കണ്ടെത്താൻ കുറഞ്ഞത് ഒരു ചേരുവയെങ്കിലും ചേർക്കുക.",
    failedToFetchRecipes: "പാചകക്കുറിപ്പുകൾ ലഭിക്കുന്നതിൽ പരാജയപ്പെട്ടു:",
    noRecipesFound: "നിങ്ങളുടെ ചേരുവകൾക്കും പാചകരീതിക്കും പാചകക്കുറിപ്പുകളൊന്നും കണ്ടെത്തിയില്ല. കൂടുതൽ ചേർക്കുക അല്ലെങ്കിൽ പാചകരീതി മാറ്റുക!",
    settings: "ക്രമീകരണങ്ങൾ",
    language: "ഭാഷ",
    popularDishes: "പ്രശസ്ത വിഭവങ്ങൾ",
    viewPopularDishes: "പ്രശസ്ത വിഭവങ്ങൾ കാണുക",
    backToHome: "ഹോമിലേക്ക് തിരികെ",
    noInstructions: "ഈ പാചകക്കുറിപ്പിന് വിശദമായ നിർദ്ദേശങ്ങളൊന്നും ലഭ്യമല്ല.",
    failedToLoadUserData: "ഉപയോക്തൃ ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    failedToSaveIngredient: "ക്ലൗഡിലേക്ക് ചേരുവ സംരക്ഷിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    failedToRemoveIngredient: "ക്ലൗഡിൽ നിന്ന് ചേരുവ നീക്കം ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    failedToClearIngredients: "ക്ലൗഡിലെ ചേരുവകൾ മായ്ക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    securityCheckNotReady: "സുരക്ഷാ പരിശോധന തയ്യാറല്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    firebaseAuthNotInitialized: "ഫയർബേസ് ഓതന്റിക്കേഷൻ ആരംഭിച്ചിട്ടില്ല.",
    pleaseSendOtpFirst: "ദയവായി ആദ്യം OTP അയക്കുക.",
    enterVerificationCodeError: "ദയവായി സ്ഥിരീകരണ കോഡ് നൽകുക。", // Used for error message
    otpExpired: "റീകാപ്ചയുടെ കാലാവധി കഴിഞ്ഞു. ദയവായി OTP വീണ്ടും അയക്കാൻ ശ്രമിക്കുക.",
    failedToLoadSecurity: "സുരക്ഷാ പരിശോധന ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി റീഫ്രഷ് ചെയ്യുക。",
    translatingContent: "ഉള്ളടക്കം ലോഡ് ചെയ്യുന്നു",
    yourDish: "നിങ്ങളുടെ വിഭവം",
    addSomeIngredients: "തുടങ്ങാൻ ചില ചേരുവകൾ ചേർക്കുക!",
    noDescription: "ഈ പാചകക്കുറിപ്പിന് വിവരണം ലഭ്യമല്ല.",
    recipe: "പാചകക്കുറിപ്പ്",
    backToRecipes: "പാചകക്കുറിപ്പുകളിലേക്ക് തിരികെ",
    defaultCuisine: "സ്ഥിരസ്ഥിതി പാചകരീതി", // New translation key
    backToDetails: "വിവരങ്ങളിലേക്ക് തിരികെ", // New translation for procedure screen
    substitute: "പകരമുള്ളത്", // New translation key
    ingredientSubstitutions: "ചേരുവകൾക്ക് പകരമുള്ളവ", // New translation key
    creativeRecipeIdea: "ക്രിയേറ്റീവ് പാചകക്കുറിപ്പ് ആശയം", // New translation key
    generateCreativeIdea: "ക്രിയാത്മക ആശയം ഉണ്ടാക്കുക", // New translation key
    recipeName: "പാചകക്കുറിപ്പ് പേര്", // New translation key
    keyIngredients: "പ്രധാന ചേരുവകൾ", // New translation key
    close: "അടയ്ക്കുക", // New translation key
    generatingIdea: "ആശയം ഉണ്ടാക്കുന്നു...", // New translation key
    findingSubstitutions: "പകരമുള്ളവ കണ്ടെത്തുന്നു...", // New translation key
    shortProcedure: "ചുരുക്കിയ നടപടിക്രമം", // New translation key
    noIdeaGenerated: "ഒരു ആശയവും സൃഷ്ടിച്ചില്ല.", // New translation key
    noSuggestionsFound: "നിർദ്ദേശങ്ങളൊന്നും കണ്ടെത്തിയില്ല.", // New translation key
  },
  te: { // Telugu
    welcomeBack: "తిరిగి స్వాగతం!",
    createAccount: "ఖాతాను సృష్టించండి",
    loginWithPhone: "ఫోన్ ద్వారా లాగిన్ చేయండి",
    loginWithGoogle: "గూగుల్ ద్వారా లాగిన్ చేయండి", // New translation key
    email: "ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    loginWithEmail: "ఇమెయిల్ ద్వారా లాగిన్ చేయండి",
    dontHaveAccount: "ఖాతా లేదా?",
    signUp: "సైన్ అప్ చేయండి",
    alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా?",
    backToEmailLogin: "ఇమెయిల్ లాగిన్‌కు తిరిగి",
    enterPhoneNumber: "ఫోన్ నంబర్ నమోదు చేయండి (ఉదా: +919876543210)",
    sendOtp: "OTP పంపండి",
    enterVerificationCode: "ధృవీకరణ కోడ్‌ను నమోదు చేయండి", // Used for placeholder
    verifyOtp: "OTP ని ధృవీకరించండి",
    otpSent: "మీ ఫోన్‌కు OTP పంపబడింది!",
    whatsInKitchen: "మీ వంటగదిలో ఏముంది?",
    enterIngredient: "పదార్థం నమోదు చేయండి (ఉదా: 'చికెన్', 'బియ్యం')",
    addIngredient: "పదార్థం జోడించండి",
    yourIngredients: "మీ పదార్థాలు:",
    clearAll: "అన్నింటినీ క్లియర్ చేయండి",
    selectCuisine: "వంటకం ఎంచుకోండి (ఐచ్ఛికం):",
    anyCuisine: "ఏ వంటకం అయినా",
    findRecipes: "వంటకాలను కనుగొనండి",
    recommendedRecipes: "సిఫార్సు చేయబడిన వంటకాలు",
    backToIngredients: "పదార్థాలకు తిరిగి",
    ingredients: "పదార్థాలు",
    description: "వివరణ",
    startCookingProcedure: "వంట విధానాన్ని ప్రారంభించండి",
    copyRecipe: "వంటకాన్ని కాపీ చేయండి",
    copied: "కాపీ చేయబడింది!",
    cookingProcedure: "వంట విధానం",
    step: "దశ",
    previousStep: "మునుపటి దశ",
    nextStep: "తదుపరి దశ",
    finishCooking: "వంట పూర్తి చేయండి!",
    congratulations: "🎉 అభినందనలు! 🎉",
    recipeCompleted: "మీరు వంటకాన్ని విజయవంతంగా పూర్తి చేసారు:",
    cookAnotherRecipe: "మరొక వంటకం వండండి",
    logout: "లాగ్ అవుట్",
    loadingApp: "యాప్ లోడ్ అవుతోంది...",
    error: "లోపం:",
    pleaseAddIngredient: "వంటకాలను కనుగొనడానికి దయచేసి కనీసం ఒక పదార్థాన్ని జోడించండి.",
    failedToFetchRecipes: "వంటకాలను పొందడంలో విఫలమైంది:",
    noRecipesFound: "మీ పదార్థాలు మరియు వంటకానికి వంటకాలు కనుగొనబడలేదు. మరిన్ని జోడించండి లేదా వంటకాన్ని మార్చండి!",
    settings: "సెట్టింగ్‌లు",
    language: "భాష",
    popularDishes: "ప్రసిద్ధ వంటకాలు",
    viewPopularDishes: "ప్రసిద్ధ వంటకాలను చూడండి",
    backToHome: "హోమ్‌కు తిరిగి",
    noInstructions: "ఈ వంటకానికి వివరణాత్మక సూచనలు అందుబాటులో లేవు。",
    failedToClearIngredients: "క్లౌడ్‌లోని పదార్థాలను క్లియర్ చేయడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి。",
    securityCheckNotReady: "భద్రతా తనిఖీ సిద్ధంగా లేదు. దయచేసి మళ్ళీ ప్రయత్నించండి。",
    firebaseAuthNotInitialized: "ఫైర్‌బేస్ ప్రమాణీకరణ ప్రారంభించబడలేదు。",
    pleaseSendOtpFirst: "దయచేసి ముందుగా OTP పంపండి。",
    enterVerificationCodeError: "దయచేసి ధృవీకరణ కోడ్‌ను నమోదు చేయండి。", // Used for error message
    otpExpired: "రీక్యాప్చా గడువు ముగిసింది. దయచేసి OTP ని మళ్ళీ పంపడానికి ప్రయత్నించండి。",
    failedToLoadSecurity: "భద్రతా తనిఖీని లోడ్ చేయడంలో విఫలమైంది. దయచేసి రిఫ్రెష్ చేయండి。",
    translatingContent: "కంటెంట్ అనువదిస్తోంది",
    yourDish: "మీ డిష్",
    addSomeIngredients: "ప్రారంభించడానికి కొన్ని పదార్థాలను జోడించండి!",
    noDescription: "ఈ వంటకానికి వివరణ అందుబాటులో లేదు。",
    recipe: "వంటకం",
    backToRecipes: "వంటకాలకు తిరిగి",
    defaultCuisine: "డిఫాల్ట్ వంటకం", // New translation key
    backToDetails: "వివరాలకు తిరిగి", // New translation for procedure screen
    substitute: "ప్రత్యామ్నాయం", // New translation key
    ingredientSubstitutions: "పదార్థ ప్రత్యామ్నాయాలు", // New translation key
    creativeRecipeIdea: "క్రియేటివ్ వంటకం ఆలోచన", // New translation key
    generateCreativeIdea: "క్రియేటివ్ ఆలోచనను రూపొందించండి", // New translation key
    recipeName: "వంటకం పేరు", // New translation key
    keyIngredients: "కీ పదార్థాలు", // New translation key
    close: "మూసివేయి", // New translation key
    generatingIdea: "ఆలోచనను రూపొందిస్తుంది...", // New translation key
    findingSubstitutions: "ప్రత్యామ్నాయాలను కనుగొంటుంది...", // New translation key
    shortProcedure: "చిన్న విధానం", // New translation key
    noIdeaGenerated: "ఆలోచన రూపొందించబడలేదు.", // New translation key
    noSuggestionsFound: "సూచనలు కనుగొనబడలేదు.", // New translation key
  },
};


// CSS for custom animations (fadeIn, steam, stir, confetti)
const customAnimationsCss = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes steam {
  0% { transform: translateY(0px) translateX(0px); opacity: 0.8; }
  25% { transform: translateY(-5px) translateX(2px); opacity: 0.6; }
  50% { transform: translateY(-10px) translateX(-2px); opacity: 0.4; }
  75% { transform: translateY(-15px) translateX(2px); opacity: 0.2; }
  100% { transform: translateY(-20px) translateX(-2px); opacity: 0; }
}

@keyframes stir {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
.animate-steam {
  animation: steam 1.5s infinite ease-out;
}
.delay-100 {
  animation-delay: 0.1s;
}
.animate-stir {
  animation: stir 2s linear infinite;
  transform-origin: 50% 50%; /* Center of the pot */
}
.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--confetti-color);
  animation: confetti-fall var(--animation-duration) ease-out forwards;
  opacity: 0;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
  z-index: 9999; /* Ensure confetti is on top */
}
.animate-bounce-in {
  animation: bounceIn 0.8s ease-out;
}
@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
`;

// Loading Skeleton Component
const RecipeCardSkeleton = () => (
  <div className="bg-white bg-opacity-40 backdrop-blur-lg rounded-xl overflow-hidden mb-6 w-full shadow-xl animate-pulse border-2 border-gray-200 border-opacity-60">
    <div className="w-full h-56 bg-gray-300"></div>
    <div className="p-5">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

// Cooking Animation Component
const CookingAnimation = ({ step }) => {
  let svgContent = null;
  const animationType = step % 4; // Cycles through 4 animation types

  switch (animationType) {
    case 0: // Initial/Prep/Chopping
      svgContent = (
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="animate-fadeIn">
          <rect x="10" y="70" width="80" height="20" fill="#8B4513" rx="5" ry="5" /> {/* Cutting board */}
          <path d="M 70 60 L 60 80 L 80 80 Z" fill="#32CD32" /> {/* Veggie piece 1 */}
          <path d="M 50 65 L 40 75 L 60 75 Z" fill="#FFD700" /> {/* Veggie piece 2 */}
          <path d="M 40 50 L 35 70 L 55 70 Z" fill="#FF6347" /> {/* Veggie piece 3 */}
          <line x1="85" y1="50" x2="75" y2="70" stroke="#A9A9A9" strokeWidth="3" strokeLinecap="round" /> {/* Knife handle */}
          <line x1="75" y1="70" x2="65" y2="70" stroke="#D3D3D3" strokeWidth="3" strokeLinecap="round" /> {/* Knife blade */}
          <text x="50" y="20" fontSize="12" fill="#555" textAnchor="middle">Prepare Ingredients</text>
        </svg>
      );
      break;
    case 1: // Heating/Frying/Sautéing
      svgContent = (
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="animate-fadeIn">
          <rect x="25" y="60" width="50" height="20" fill="#A9A9A9" rx="5" ry="5" /> {/* Stove top */}
          <circle cx="50" cy="50" r="20" fill="#D3D3D3" stroke="#808080" strokeWidth="2" /> {/* Pan */}
          <circle cx="50" cy="50" r="15" fill="#FF8C00" /> {/* Heat/Oil */}
          <path d="M 50 30 Q 55 20 60 30" stroke="#fff" strokeWidth="2" fill="none" className="animate-steam" /> {/* Steam 1 */}
          <path d="M 40 35 Q 45 25 50 35" stroke="#fff" strokeWidth="2" fill="none" className="animate-steam delay-100" /> {/* Steam 2 */}
          <text x="50" y="20" fontSize="12" fill="#555" textAnchor="middle">Heat & Cook</text>
        </svg>
      );
      break;
    case 2: // Stirring/Mixing
      svgContent = (
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="animate-fadeIn">
          <circle cx="50" cy="50" r="25" fill="#A9A9A9" stroke="#808080" strokeWidth="2" /> {/* Pot */}
          <rect x="40" y="75" width="20" height="5" fill="#8B4513" /> {/* Pot handle */}
          <path d="M 60 40 L 70 30 L 80 40" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" /> {/* Spoon handle */}
          <circle cx="80" cy="40" r="5" fill="#8B4513" /> {/* Spoon head */}
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="2s"
            repeatCount="indefinite"
            className="animate-stir"
          />
          <text x="50" y="20" fontSize="12" fill="#555" textAnchor="middle">Stirring</text>
        </svg>
      );
      break;
    case 3: // Serving/Dish Ready
      svgContent = (
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="animate-fadeIn">
          <circle cx="50" cy="70" r="30" fill="#fff" stroke="#ccc" strokeWidth="2" /> {/* Plate */}
          <path d="M 30 60 Q 50 30 70 60 Q 50 90 30 60 Z" fill="#FFD700" stroke="#FF8C00" strokeWidth="2" /> {/* Food */}
          <path d="M 40 65 Q 50 40 60 65" fill="#32CD32" /> {/* Garnish */}
          <text x="50" y="20" fontSize="12" fill="#555" textAnchor="middle">Dish Ready!</text>
        </svg>
      );
      break;
    default: // Fallback for any other step, maybe a generic cooking icon
      svgContent = (
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="animate-fadeIn">
          <circle cx="50" cy="50" r="40" fill="#eee" stroke="#ccc" strokeWidth="2" />
          <path d="M 30 50 L 70 50 M 50 30 L 50 70" stroke="#aaa" strokeWidth="5" strokeLinecap="round" />
          <text x="50" y="20" fontSize="12" fill="#555" textAnchor="middle">Cooking Action</text>
        </svg>
      );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {svgContent}
    </div>
  );
};


const App = () => {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LOGIN); // Start at login screen
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [userIngredients, setUserIngredients] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // Corrected: Initialized with useState(null)
  const [loading, setLoading] = useState(false);
  const [currentProcedureStep, setCurrentProcedureStep] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [selectedCuisine, setSelectedCuisine] = useState(''); // Default to empty string for "Any Cuisine"
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false); // New state for translation loading

  // Firebase Auth States
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone Auth States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null); // Stores the result of sending OTP
  const recaptchaRef = useRef(null); // Ref for Recaptcha container
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null); // Stores the RecaptchaVerifier instance
  const [showOtpSentMessage, setShowOtpSentMessage] = useState(false); // New state for OTP sent message

  // LLM Feature States
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [substitutionResult, setSubstitutionResult] = null;
  const [substitutingIngredient, setSubstitutingIngredient] = useState('');
  const [showCreativeRecipeModal, setShowCreativeRecipeModal] = useState(false);
  const [creativeRecipeIdea, setCreativeRecipeIdea] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false); // Combined loading for LLM features

  // For animation, we'll use a simple CSS transition via state for opacity
  const [stepOpacity, setStepOpacity] = useState(1);
  const confettiContainerRef = useRef(null); // Ref for confetti container

  // Use useState for app, auth, and db instances to ensure they are reactive
  const [appInstance, setAppInstance] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);

  // New state for language selection, default to English
  const [language, setLanguage] = useState('en');

  // Helper function to get translated text
  const getTranslatedText = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Firebase Configuration - YOUR ACTUAL CONFIG IS HERE!
  // REPLACE THESE VALUES WITH YOUR PROJECT'S CONFIG FROM FIREBASE CONSOLE
  const firebaseConfig = {
    apiKey: "AIzaSyC-dFXiWiQXctEvSZPPPwVb_WEIsz-DGmc",
    authDomain: "curry-craft-daf8f.firebaseapp.com",
    projectId: "curry-craft-daf8f",
    storageBucket: "curry-craft-daf8f.firebasestorage.app",
    messagingSenderId: "905032476877",
    appId: "1:905032476877:web:1d5434f1fcbc86532fe184",
    measurementId: "G-VX5E06M3TN"
  };

  // Firebase Initialization and Auth Listener
  useEffect(() => {
    try {
      const initializedApp = initializeApp(firebaseConfig);
      const initializedAuth = getAuth(initializedApp);
      const initializedDb = getFirestore(initializedApp);

      setAppInstance(initializedApp);
      setAuthInstance(initializedAuth);
      setDbInstance(initializedDb);

      const unsubscribe = onAuthStateChanged(initializedAuth, async (user) => {
        if (user) {
          setCurrentUser(user);
          try {
            const userDocRef = doc(initializedDb, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUserIngredients(userData.userIngredients || []);
              // Set user's preferred language if stored, otherwise default
              setLanguage(userData.preferences?.language || 'en');
              // Set user's preferred cuisine if stored, otherwise default to empty (Any Cuisine)
              setSelectedCuisine(userData.preferences?.cuisine || '');
              console.log("User data loaded from Firestore:", userData);
            } else {
              console.log("No existing user document found. Creating one.");
              await setDoc(userDocRef, {
                  email: user.email || user.phoneNumber || user.providerData[0]?.email || 'N/A', // Handle Google email
                  userIngredients: [],
                  savedRecipeIds: [],
                  preferences: { cuisine: '', language: 'en' }, // Default to Any Cuisine
                  createdAt: new Date()
              });
              setUserIngredients([]);
              setLanguage('en');
              setSelectedCuisine(''); // Set default cuisine on new user creation
            }
          } catch (firestoreError) {
            console.error("Error loading user data from Firestore:", firestoreError);
            setApiError(getTranslatedText("failedToLoadUserData"));
            setUserIngredients([]);
          }
          if ([SCREENS.LOGIN, SCREENS.SIGNUP, SCREENS.PHONE_LOGIN].includes(currentScreen)) {
            setCurrentScreen(SCREENS.HOME);
          }
        } else {
          setCurrentUser(null);
          setUserIngredients([]);
          setCurrentScreen(SCREENS.LOGIN);
          // --- CRITICAL FIX START ---
          // Attempt to sign in with custom token if available (for Canvas environment)
          // Otherwise, sign in anonymously. This ensures all users are authenticated for Firestore.
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              await signInWithCustomToken(initializedAuth, __initial_auth_token);
              console.log("Signed in with custom token.");
            } catch (tokenError) {
              console.error("Error signing in with custom token, falling back to anonymous:", tokenError);
              try {
                await signInAnonymously(initializedAuth);
                console.log("Signed in anonymously.");
              } catch (anonError) {
                console.error("Error signing in anonymously:", anonError);
                setAuthError("Authentication failed. Please try again.");
              }
            }
          } else {
            // If no custom token is provided (e.g., local development outside Canvas)
            try {
              await signInAnonymously(initializedAuth);
              console.log("Signed in anonymously (no custom token).");
            } catch (anonError) {
              console.error("Error signing in anonymously:", anonError);
              setAuthError("Authentication failed. Please try again.");
            }
          }
          // --- CRITICAL FIX END ---
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase:", e);
      setAuthError(getTranslatedText("failedToInitAuth"));
      setAuthLoading(false);
      setCurrentScreen(SCREENS.HOME);
    }
  }, []);

  // Effect to update user's language and cuisine preference in Firestore
  useEffect(() => {
    if (currentUser && dbInstance) {
      const userDocRef = doc(dbInstance, "users", currentUser.uid);
      updateDoc(userDocRef, {
        'preferences.language': language,
        'preferences.cuisine': selectedCuisine // Persist selectedCuisine from Home/Settings
      }).catch(error => {
        console.error("Error updating user preferences:", error);
      });
    }
  }, [language, selectedCuisine, currentUser, dbInstance]);


  // Initialize RecaptchaVerifier when the phone login screen is active AND authInstance is available
  useEffect(() => {
    if (authInstance && currentScreen === SCREENS.PHONE_LOGIN && recaptchaRef.current && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(authInstance, recaptchaRef.current, {
          'size': 'invisible',
          'callback': (response) => {
            console.log("Recaptcha solved!");
          },
          'expired-callback': () => {
            console.warn("Recaptcha expired.");
            setAuthError(getTranslatedText("otpExpired"));
            setRecaptchaVerifier(null);
          }
        });
        verifier.render().then((widgetId) => {
          console.log("Recaptcha rendered:", widgetId);
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("Error initializing Recaptcha:", error);
        setAuthError(getTranslatedText("failedToLoadSecurity"));
      }
    }
  }, [authInstance, currentScreen, recaptchaVerifier, recaptchaRef, getTranslatedText]);


  useEffect(() => {
    if (currentScreen === SCREENS.PROCEDURE) {
      setStepOpacity(0);
      const timer = setTimeout(() => {
        setStepOpacity(1);
      }, 100);
      return () => clearTimeout(timer);
    }
    if (currentScreen === SCREENS.COMPLETED) {
      generateConfetti();
    }
  }, [currentProcedureStep, currentScreen]);

  // Function to generate confetti
  const generateConfetti = () => {
    if (!confettiContainerRef.current) return;

    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
    const numConfetti = 50;

    for (let i = 0; i < numConfetti; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = `${Math.random() * -20}vh`;
      confetti.style.animationDuration = `${2 + Math.random() * 3}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

      confettiContainerRef.current.appendChild(confetti);

      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  };

  // LLM Translation Function
  const translateText = useCallback(async (content, targetLanguage) => {
    if (targetLanguage === 'en') {
      return content; // No translation needed for English
    }

    setTranslationLoading(true);
    let prompt;
    let responseSchema;

    // Handle string content (e.g., individual recipe parts)
    if (typeof content === 'string') {
      prompt = `Translate the following text into ${targetLanguage}. Provide only the translated text as a string, no other formatting or explanation.`;
      responseSchema = { type: "STRING" };
      content = { text: content }; // Wrap string in an object for consistent processing
    } else {
      // Handle object content (e.g., full recipe object)
      prompt = `Translate the following JSON object's string values into ${targetLanguage}. Ensure the output is a valid JSON object with the same keys. Do not include any other text or formatting outside the JSON.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          ingredients: { type: "ARRAY", items: { type: "STRING" } },
          procedure: { type: "ARRAY", items: { type: "STRING" } }
        }
      };
    }

    const chatHistory = [{ role: "user", parts: [{ text: `${prompt}\n\nOriginal: ${JSON.stringify(content)}` }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        try {
          const parsedResult = JSON.parse(text);
          setTranslationLoading(false);
          return parsedResult;
        } catch (parseError) {
          console.error("Error parsing LLM response JSON:", parseError, "Raw text:", text);
          setTranslationLoading(false);
          return typeof content === 'string' ? content : content; // Return original content on JSON parse failure
        }
      } else {
        console.error("LLM translation failed: No candidates or content found.", result);
        setTranslationLoading(false);
        return typeof content === 'string' ? content : content; // Return original content on no candidates
      }
    } catch (llmError) {
      console.error("Error calling LLM for translation:", llmError);
      setTranslationLoading(false);
      return typeof content === 'string' ? content : content; // Return original content on fetch error
    }
  }, []);

  // LLM: Ingredient Substitution
  const handleIngredientSubstitution = async (ingredientName) => {
    setLlmLoading(true);
    setSubstitutionResult(null);
    setSubstitutingIngredient(ingredientName);

    const prompt = `What are some good substitutions for "${ingredientName}" in a recipe? Provide 2-3 common alternatives and a brief note on their use. Format as a JSON object with a 'substitutions' array, where each item is an object with 'name' and 'note' properties.`;
    const responseSchema = {
      type: "OBJECT",
      properties: {
        substitutions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              note: { type: "STRING" }
            }
          }
        }
      }
    };

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        try {
          const parsedResult = JSON.parse(text);
          setSubstitutionResult(parsedResult.substitutions || []);
        } catch (parseError) {
          console.error("Error parsing LLM substitution response JSON:", parseError, "Raw text:", text);
          setSubstitutionResult([{ name: "Error", note: "Could not parse substitution suggestions." }]);
        }
      } else {
        console.error("LLM substitution failed: No candidates or content found.", result);
        setSubstitutionResult([{ name: "No suggestions", note: "Could not find substitutions." }]);
      }
    } catch (llmError) {
      console.error("Error calling LLM for substitution:", llmError);
      setSubstitutionResult([{ name: "Error", note: "Failed to fetch substitutions." }]);
    } finally {
      setLlmLoading(false);
      setShowSubstitutionModal(true);
    }
  };

  // LLM: Generate Creative Recipe Idea
  const handleGenerateCreativeRecipeIdea = async () => {
    setLlmLoading(true);
    setCreativeRecipeIdea(null);
    setApiError(null); // Clear any previous API errors

    if (userIngredients.length === 0) {
      setApiError(getTranslatedText("pleaseAddIngredient"));
      setLlmLoading(false);
      return;
    }

    const ingredientsList = userIngredients.join(', ');
    const prompt = `Given the following ingredients: ${ingredientsList}, suggest a creative and unique recipe idea. Provide the recipe name, a brief description (3-5 sentences), a list of key ingredients (max 5), and a short, simple procedure (3-5 steps). Format as a JSON object with keys 'name' (string), 'description' (string), 'keyIngredients' (array of strings), and 'shortProcedure' (array of strings).`;
    const responseSchema = {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        description: { type: "STRING" },
        keyIngredients: { type: "ARRAY", items: { type: "STRING" } },
        shortProcedure: { type: "ARRAY", items: { type: "STRING" } }
      }
    };

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        try {
          const parsedResult = JSON.parse(text);
          setCreativeRecipeIdea(parsedResult);
        } catch (parseError) {
          console.error("Error parsing LLM creative idea response JSON:", parseError, "Raw text:", text);
          setCreativeRecipeIdea({ name: "Error", description: "Could not generate a creative idea.", keyIngredients: [], shortProcedure: [] });
        }
      } else {
        console.error("LLM creative idea failed: No candidates or content found.", result);
        setCreativeRecipeIdea({ name: "No Idea", description: "Could not generate a creative idea based on your ingredients.", keyIngredients: [], shortProcedure: [] });
      }
    } catch (llmError) {
      console.error("Error calling LLM for creative idea:", llmError);
      setCreativeRecipeIdea({ name: "Error", description: "Failed to generate a creative idea.", keyIngredients: [], shortProcedure: [] });
    } finally {
      setLlmLoading(false);
      setShowCreativeRecipeModal(true);
    }
  };


  // Auth Handlers
  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!authInstance) throw new Error(getTranslatedText("firebaseAuthNotInitialized"));
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!authInstance) throw new Error(getTranslatedText("firebaseAuthNotInitialized"));
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;

      if (dbInstance) {
          await setDoc(doc(dbInstance, "users", user.uid), {
              email: user.email,
              userIngredients: [],
              savedRecipeIds: [],
              preferences: { cuisine: '', language: language }, // Default to Any Cuisine
              createdAt: new Date()
          });
          console.log("New user document created in Firestore.");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!authInstance) throw new Error(getTranslatedText("firebaseAuthNotInitialized"));
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      // Check if user data exists in Firestore, if not, create it
      if (dbInstance) {
        const userDocRef = doc(dbInstance, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            userIngredients: [],
            savedRecipeIds: [],
            preferences: { cuisine: '', language: language }, // Default to Any Cuisine
            createdAt: new Date()
          });
          console.log("New user document created in Firestore for Google login.");
        } else {
          console.log("Existing user document found for Google login.");
        }
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };


  const handleSendOtp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    if (!phoneNumber) {
      setAuthError(getTranslatedText("enterPhoneNumber"));
      setAuthLoading(false);
      return;
    }
    if (!recaptchaVerifier) {
      setAuthError(getTranslatedText("securityCheckNotReady"));
      setAuthLoading(false);
      return;
    }
    if (!authInstance) {
      setAuthError(getTranslatedText("firebaseAuthNotInitialized"));
      setAuthLoading(false);
      return;
    }

    try {
      const result = await signInWithPhoneNumber(authInstance, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setAuthError(null);
      setShowOtpSentMessage(true);
      setTimeout(() => setShowOtpSentMessage(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error("Error sending OTP:", error);
      setAuthError(error.message);
      if (recaptchaVerifier && recaptchaVerifier.reset) {
        recaptchaVerifier.reset();
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    if (!confirmationResult) {
      setAuthError(getTranslatedText("pleaseSendOtpFirst"));
      setAuthLoading(false);
      return;
    }
    if (!verificationCode) {
      setAuthError(getTranslatedText("enterVerificationCodeError")); // Corrected key
      setAuthLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(verificationCode);
      setAuthError(null);
      setPhoneNumber('');
      setVerificationCode('');
      setConfirmationResult(null);
      if (recaptchaVerifier && recaptchaVerifier.reset) {
        recaptchaVerifier.reset();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setAuthError(error.message);
      if (recaptchaVerifier && recaptchaVerifier.reset) {
        recaptchaVerifier.reset();
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!authInstance) throw new Error(getTranslatedText("firebaseAuthNotInitialized"));
      await signOut(authInstance);
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Recipe App Handlers
  const handleAddIngredient = async () => {
    const trimmedInput = ingredientsInput.trim();
    if (trimmedInput && !userIngredients.includes(trimmedInput.toLowerCase())) {
      const newIngredient = trimmedInput.toLowerCase();
      const updatedIngredients = [...userIngredients, newIngredient];

      setUserIngredients(updatedIngredients);
      setIngredientsInput('');

      if (currentUser && dbInstance) {
          const userDocRef = doc(dbInstance, "users", currentUser.uid);
          try {
              await updateDoc(userDocRef, {
                  userIngredients: arrayUnion(newIngredient)
              });
              console.log("Ingredient saved to Firestore successfully!");
          } catch (error) {
              console.error("Error saving ingredient to Firestore:", error);
              alert(getTranslatedText("failedToSaveIngredient"));
              setUserIngredients(userIngredients);
          }
      } else {
          console.warn("Not logged in or Firestore not initialized, cannot save ingredient to cloud.");
      }
    }
  };

  const handleRemoveIngredient = async (ingredientToRemove) => {
    const updatedIngredients = userIngredients.filter(ing => ing !== ingredientToRemove);
    setUserIngredients(updatedIngredients);

    if (currentUser && dbInstance) {
        const userDocRef = doc(dbInstance, "users", currentUser.uid);
        try {
            await updateDoc(userDocRef, {
                userIngredients: arrayRemove(ingredientToRemove)
            });
            console.log("Ingredient removed from Firestore successfully!");
        } catch (error) {
            console.error("Error removing ingredient from Firestore:", error);
            alert(getTranslatedText("failedToRemoveIngredient"));
            setUserIngredients(userIngredients);
        }
    } else {
        console.warn("Not logged in or Firestore not initialized, cannot remove ingredient from cloud.");
    }
  };

  const handleClearAllIngredients = async () => {
    setUserIngredients([]);

    if (currentUser && dbInstance) {
        const userDocRef = doc(dbInstance, "users", currentUser.uid);
        try {
            await updateDoc(userDocRef, {
                userIngredients: []
            });
            console.log("All ingredients cleared in Firestore!");
        } catch (error) {
            console.error("Error clearing ingredients in Firestore:", error);
            alert(getTranslatedText("failedToClearIngredients"));
        }
    } else {
        console.warn("Not logged in or Firestore not initialized, cannot clear ingredients in cloud.");
    }
  };

  const fetchRecipes = async (type = 'ingredients') => {
    setLoading(true);
    setRecommendedRecipes([]);
    setApiError(null);
    setTranslationLoading(false); // Reset translation loading for new fetch

    let apiUrl = '';
    const baseUrl = 'https://api.spoonacular.com/recipes/';
    // addRecipeInformation and fillIngredients are useful for getting full details directly
    const commonParams = `number=15&apiKey=${SPOONACULAR_API_KEY}&addRecipeInformation=true&fillIngredients=true`;

    try {
        if (type === 'ingredients') {
            if (userIngredients.length === 0) {
                setLoading(false);
                setApiError(getTranslatedText("pleaseAddIngredient"));
                return;
            }
            const ingredientsString = userIngredients.join(',');
            apiUrl = `${baseUrl}findByIngredients?ingredients=${ingredientsString}&${commonParams}`;
            if (selectedCuisine) {
                apiUrl += `&cuisine=${selectedCuisine}`;
            }
        } else if (type === 'random') { // This is for "View Popular Dishes"
            let queryParams = commonParams;
            if (userIngredients.length > 0 && selectedCuisine) {
                // If ingredients and cuisine are present, prioritize recipes using them within the cuisine, sorted by popularity
                queryParams += `&includeIngredients=${userIngredients.join(',')}`;
                queryParams += `&cuisine=${selectedCuisine}`;
                queryParams += `&sort=popularity`; // Sort by popularity
                apiUrl = `${baseUrl}complexSearch?${queryParams}`;
            } else if (userIngredients.length > 0) {
                // If only ingredients are present, find recipes by ingredients, ranked by matching ingredients
                apiUrl = `${baseUrl}findByIngredients?ingredients=${userIngredients.join(',')}&number=15&ranking=1&apiKey=${SPOONACULAR_API_KEY}`;
            } else if (selectedCuisine) {
                // If only cuisine is selected, get popular recipes for that cuisine
                queryParams += `&cuisine=${selectedCuisine}&sort=popularity`;
                apiUrl = `${baseUrl}complexSearch?${queryParams}`;
            } else {
                // If no ingredients or cuisine, get truly random popular recipes
                apiUrl = `${baseUrl}random?${commonParams}`;
            }
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let recipesToProcess = [];
        // Handle different API response structures: /random returns { recipes: [...] }, complexSearch and findByIngredients return [...]
        if (apiUrl.includes('random') && data.recipes) {
            recipesToProcess = data.recipes;
        } else if (Array.isArray(data.results)) { // For complexSearch
            recipesToProcess = data.results;
        } else if (Array.isArray(data)) { // For findByIngredients
            recipesToProcess = data;
        } else {
            console.error("Unexpected data format from Spoonacular API:", data);
            setApiError("Received unexpected data format from recipe API. Please try again.");
            setLoading(false);
            setTranslationLoading(false);
            return;
        }

        const detailedRecipesPromises = recipesToProcess.map(async (recipe) => {
            // Since addRecipeInformation=true is used, often full details are already present.
            // But sometimes, especially for findByIngredients, 'instructions' or 'summary' might still be missing.
            let detailData = recipe;

            // Fetch full details if critical fields are missing or if it's from findByIngredients (which might not always return full info)
            if (!detailData.instructions || !detailData.summary || !detailData.extendedIngredients) {
                try {
                    const detailResponse = await fetch(
                        `${baseUrl}${recipe.id}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`
                    );
                    if (!detailResponse.ok) {
                        const errorDetailData = await detailResponse.json();
                        console.error(`Error fetching details for recipe ${recipe.id}:`, errorDetailData.message || detailResponse.status);
                        return null;
                    }
                    detailData = await detailResponse.json();
                } catch (detailError) {
                    console.error(`Failed to fetch details for recipe ${recipe.id}:`, detailError);
                    return null;
                }
            }

            let procedureSteps = [getTranslatedText("noInstructions")];
            if (detailData.instructions) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(detailData.instructions, 'text/html');

                const listItems = Array.from(doc.querySelectorAll('ol li, ul li'));
                if (listItems.length > 0) {
                    procedureSteps = listItems.map(li => li.textContent.trim()).filter(step => step !== '');
                } else {
                    let rawText = '';
                    const paragraphs = Array.from(doc.querySelectorAll('p, div, span'));
                    if (paragraphs.length > 0) {
                      rawText = paragraphs.map(p => p.textContent.trim()).join('\n').trim();
                    } else {
                      rawText = doc.body.textContent.trim();
                    }


                    rawText = rawText.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

                    if (rawText) {
                      let tempSteps = rawText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s+|\n\s*\n/).filter(step => step.trim() !== '');
                      if (tempSteps.length > 0) {
                        procedureSteps = tempSteps;
                      } else {
                        procedureSteps = [rawText];
                      }
                    }
                }
            }

            // Filter out "waste items/recipes" - simple heuristic: if procedure is too short or description is too generic
            if (procedureSteps.length < 2 || (detailData.summary && detailData.summary.length < 50)) {
                console.log(`Skipping recipe ${detailData.id} due to short procedure or generic description.`);
                return null;
            }

            // --- LLM Translation for dynamic content ---
            let translatedName = detailData.title;
            let translatedDescription = detailData.summary ? detailData.summary.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 150) + '...' : getTranslatedText('noDescription');
            let translatedIngredients = detailData.extendedIngredients ? detailData.extendedIngredients.map(ing => ing.name.toLowerCase()) : [];
            let translatedProcedure = procedureSteps;

            if (language !== 'en') {
                try {
                    const llmResponse = await translateText({
                        name: detailData.title,
                        description: detailData.summary ? detailData.summary.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 150) + '...' : getTranslatedText('noDescription'),
                        ingredients: detailData.extendedIngredients ? detailData.extendedIngredients.map(ing => ing.name.toLowerCase()) : [],
                        procedure: procedureSteps
                    }, language);

                    if (llmResponse) {
                        translatedName = llmResponse.name || translatedName;
                        translatedDescription = llmResponse.description || translatedDescription;
                        translatedIngredients = llmResponse.ingredients || translatedIngredients;
                        translatedProcedure = llmResponse.procedure || translatedProcedure;
                    }
                } catch (llmErr) {
                    console.error("Error during LLM translation for recipe details:", llmErr);
                    // Fallback to English if translation fails
                }
            }
            // --- End LLM Translation ---

            return {
                id: String(detailData.id),
                name: translatedName,
                image: detailData.image,
                ingredients: translatedIngredients,
                description: translatedDescription,
                procedure: translatedProcedure,
                isTranslated: language !== 'en' // Mark if it has been translated
            };
        });

        const detailedRecipes = (await Promise.all(detailedRecipesPromises)).filter(Boolean); // Filter out nulls

        setRecommendedRecipes(detailedRecipes);
        setCurrentScreen(SCREENS.RECIPE_LIST);
    } catch (error) {
        console.error("Error fetching recipes:", error);
        setApiError(`${getTranslatedText("failedToFetchRecipes")} ${error.message}.`);
    } finally {
        setLoading(false);
        setTranslationLoading(false);
    }
  };

  const viewRecipeDetails = async (recipe) => {
    // If the recipe is not yet translated to the current language, translate it now.
    // This typically happens if it's a pre-defined dish that wasn't translated on list render.
    if (language !== 'en' && !recipe.isTranslated && !translationLoading) {
      setTranslationLoading(true);
      try {
        const llmResponse = await translateText({
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          procedure: recipe.procedure
        }, language);

        if (llmResponse) {
          setSelectedRecipe({
            ...recipe,
            name: llmResponse.name || recipe.name,
            description: llmResponse.description || recipe.description,
            ingredients: llmResponse.ingredients || recipe.ingredients,
            procedure: llmResponse.procedure || recipe.procedure,
            isTranslated: true // Mark as translated
          });
        } else {
          setSelectedRecipe(recipe); // Fallback to original
        }
      } catch (llmErr) {
        console.error("Error during LLM translation for recipe details:", llmErr);
        setSelectedRecipe(recipe); // Fallback to original
      } finally {
        setTranslationLoading(false);
      }
    } else {
      setSelectedRecipe(recipe);
    }
    setCurrentScreen(SCREENS.RECIPE_DETAIL);
  };

  const startProcedure = () => {
    setCurrentProcedureStep(0);
    setCurrentScreen(SCREENS.PROCEDURE);
    setStepOpacity(0);
    setTimeout(() => setStepOpacity(1), 100);
  };

  const nextStep = () => {
    if (selectedRecipe && selectedRecipe.procedure) { // Added check for selectedRecipe.procedure
      if (currentProcedureStep < selectedRecipe.procedure.length - 1) {
        setStepOpacity(0);
        setTimeout(() => {
          setCurrentProcedureStep(prev => prev + 1);
          setStepOpacity(1);
        }, 300);
      } else {
        setCurrentScreen(SCREENS.COMPLETED);
      }
    }
  };

  const prevStep = () => {
    if (selectedRecipe && selectedRecipe.procedure) { // Added check for selectedRecipe.procedure
      if (currentProcedureStep > 0) {
        setStepOpacity(0);
        setTimeout(() => {
          setCurrentProcedureStep(prev => prev - 1);
          setStepOpacity(1);
        }, 300);
      }
    }
  };

  const copyRecipeToClipboard = () => {
    if (selectedRecipe) {
      const recipeText = `${getTranslatedText("recipe")}: ${selectedRecipe.name}\n\n` +
                         `${getTranslatedText("description")}: ${selectedRecipe.description}\n\n` +
                         `${getTranslatedText("ingredients")}:\n${Array.isArray(selectedRecipe.ingredients) ? selectedRecipe.ingredients.map(ing => `- ${ing}`).join('\n') : ''}\n\n` +
                         `${getTranslatedText("cookingProcedure")}:\n${Array.isArray(selectedRecipe.procedure) ? selectedRecipe.procedure.map((step, index) => `${index + 1}. ${step}`).join('\n') : ''}\n\n` +
                         `Find more delicious recipes on our app!`;

      const textarea = document.createElement('textarea');
      textarea.value = recipeText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  // MessageBox Component
  const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-100' : 'bg-green-100';
    const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
    const borderColor = type === 'error' ? 'border-red-400' : 'border-green-400';

    return (
      <div className={`${bgColor} bg-opacity-80 border ${borderColor} ${textColor} px-4 py-3 rounded-lg relative mb-4 text-center shadow-lg border-opacity-70`} role="alert">
        <span className="block sm:inline">{message}</span>
        {onClose && (
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={onClose}>
            <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.103l-2.651 3.746a1.2 1.2 0 0 1-1.697-1.697l3.746-2.651-3.746-2.651a1.2 1.2 0 0 1 1.697-1.697L10 8.897l2.651-3.746a1.2 1.2 0 0 1 1.697 1.697L11.103 10l3.746 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        )}
      </div>
    );
  };

  // Modal Component for LLM features
  const Modal = ({ title, children, onClose, isLoading }) => {
    if (!children && !isLoading) return null; // Only render if there's content or loading

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 border-opacity-70 w-full max-w-md relative">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-lg text-gray-700">
                {title.includes(getTranslatedText("ingredientSubstitutions")) ? getTranslatedText("findingSubstitutions") : getTranslatedText("generatingIdea")}
              </p>
            </div>
          ) : (
            children
          )}
          <button
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };


  // --- UI Rendering based on currentScreen state ---

  // Login Screen
  const renderLoginScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 text-center drop-shadow-lg text-gray-800">{getTranslatedText("welcomeBack")}</h1>
      <div className="bg-white bg-opacity-40 backdrop-blur-lg rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-md">
        <label htmlFor="email-input" className="sr-only">{getTranslatedText("email")}</label>
        <input
          id="email-input"
          type="email"
          className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-4 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
          placeholder={getTranslatedText("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password-input" className="sr-only">{getTranslatedText("password")}</label>
        <input
          id="password-input"
          type="password"
          className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-6 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
          placeholder={getTranslatedText("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') handleLogin(); }}
        />
        {authError && (
          <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center shadow-lg border-opacity-70" role="alert">
            <strong className="font-bold">{getTranslatedText("error")}</strong>
            <span className="block sm:inline"> {authError}</span>
          </div>
        )}
        <button
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-blue-400 border-opacity-70 mb-4 ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleLogin}
          disabled={authLoading}
        >
          {authLoading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
          ) : (
            <span>{getTranslatedText("loginWithEmail")}</span>
          )}
        </button>
        <button
          className={`w-full bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-red-400 border-opacity-70 mb-4 ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleGoogleLogin}
          disabled={authLoading}
        >
          {authLoading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
          ) : (
            <span>{getTranslatedText("loginWithGoogle")}</span>
          )}
        </button>
        <p className="mt-6 text-center text-gray-700 text-base sm:text-lg">
          {getTranslatedText("dontHaveAccount")}{' '}
          <button
            className="text-blue-700 font-semibold hover:underline transition-colors duration-200"
            onClick={() => setCurrentScreen(SCREENS.SIGNUP)}
          >
            {getTranslatedText("signUp")}
          </button>
        </p>
        <p className="mt-4 text-center text-gray-700 text-base sm:text-lg">
          Or{' '}
          <button
            className="text-purple-700 font-semibold hover:underline transition-colors duration-200"
            onClick={() => setCurrentScreen(SCREENS.PHONE_LOGIN)}
          >
            {getTranslatedText("loginWithPhone")}
          </button>
        </p>
      </div>
    </div>
  );

  // Signup Screen
  const renderSignupScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 text-center drop-shadow-lg text-gray-800">{getTranslatedText("createAccount")}</h1>
      <div className="bg-white bg-opacity-40 backdrop-blur-lg rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-md">
        <label htmlFor="signup-email-input" className="sr-only">{getTranslatedText("email")}</label>
        <input
          id="signup-email-input"
          type="email"
          className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-4 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
          placeholder={getTranslatedText("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="signup-password-input" className="sr-only">{getTranslatedText("password")}</label>
        <input
          id="signup-password-input"
          type="password"
          className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-6 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
          placeholder={`${getTranslatedText("password")} (min 6 characters)`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') handleSignup(); }}
        />
        {authError && (
          <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center shadow-lg border-opacity-70" role="alert">
            <strong className="font-bold">{getTranslatedText("error")}</strong>
            <span className="block sm:inline"> {authError}</span>
          </div>
        )}
        <button
          className={`w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-green-400 border-opacity-70 ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSignup}
          disabled={authLoading}
        >
          {authLoading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
          ) : (
            <span>{getTranslatedText("signUp")} with Email</span>
          )}
        </button>
        <p className="mt-6 text-center text-gray-700 text-base sm:text-lg">
          {getTranslatedText("alreadyHaveAccount")}{' '}
          <button
            className="text-blue-700 font-semibold hover:underline transition-colors duration-200"
            onClick={() => setCurrentScreen(SCREENS.LOGIN)}
          >
            {getTranslatedText("loginWithEmail")}
          </button>
        </p>
      </div>
    </div>
  );

  // Phone Login Screen
  const renderPhoneLoginScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 text-center drop-shadow-lg text-gray-800">{getTranslatedText("loginWithPhone")}</h1>
      <div className="bg-white bg-opacity-40 backdrop-blur-lg rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-md">
        {!confirmationResult ? (
          <>
            <label htmlFor="phone-number-input" className="sr-only">{getTranslatedText("enterPhoneNumber")}</label>
            <input
              id="phone-number-input"
              type="tel"
              className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-4 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
              placeholder={getTranslatedText("enterPhoneNumber")}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {authError && (
              <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center shadow-lg border-opacity-70" role="alert">
                <strong className="font-bold">{getTranslatedText("error")}</strong>
                <span className="block sm:inline"> {authError}</span>
              </div>
            )}
            <button
              className={`w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-purple-400 border-opacity-70 ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSendOtp}
              disabled={authLoading}
            >
              {authLoading ? (
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
              ) : (
                <span>{getTranslatedText("sendOtp")}</span>
              )}
            </button>
            <div id="recaptcha-container" ref={recaptchaRef} className="mt-4"></div>
            <MessageBox message={showOtpSentMessage ? getTranslatedText("otpSent") : ''} type="success" onClose={() => setShowOtpSentMessage(false)} />
          </>
        ) : (
          <>
            <label htmlFor="verification-code-input" className="sr-only">{getTranslatedText("enterVerificationCode")}</label>
            <input
              id="verification-code-input"
              type="text"
              className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-4 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
              placeholder={getTranslatedText("enterVerificationCode")}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
            />
            {authError && (
              <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center shadow-lg border-opacity-70" role="alert">
                <strong className="font-bold">{getTranslatedText("error")}</strong>
                <span className="block sm:inline"> {authError}</span>
              </div>
            )}
            <button
              className={`w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-purple-400 border-opacity-70 ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleVerifyOtp}
              disabled={authLoading}
            >
              {authLoading ? (
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
              ) : (
                <span>{getTranslatedText("verifyOtp")}</span>
              )}
            </button>
          </>
        )}
        <p className="mt-6 text-center text-gray-700 text-base sm:text-lg">
          <button
            className="text-blue-700 font-semibold hover:underline transition-colors duration-200"
            onClick={() => {
                setCurrentScreen(SCREENS.LOGIN);
                setAuthError(null);
                setConfirmationResult(null);
                setPhoneNumber('');
                setVerificationCode('');
                if (recaptchaVerifier && recaptchaVerifier.reset) {
                  recaptchaVerifier.reset();
                }
            }}
          >
            {getTranslatedText("backToEmailLogin")}
          </button>
        </p>
      </div>
    </div>
  );


  // Home Screen
  const renderHomeScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
          onClick={() => setCurrentScreen(SCREENS.SETTINGS)}
        >
          {getTranslatedText("settings")}
        </button>
        {currentUser && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
            onClick={handleLogout}
            disabled={authLoading}
          >
            {getTranslatedText("logout")}
          </button>
        )}
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 sm:mb-8 text-center drop-shadow-lg text-gray-800">{getTranslatedText("whatsInKitchen")}</h1>
      <label htmlFor="ingredient-input" className="sr-only">{getTranslatedText("enterIngredient")}</label>
      <input
        id="ingredient-input"
        type="text"
        className="w-full max-w-md p-3 sm:p-4 border-2 border-blue-300 rounded-xl mb-4 bg-white bg-opacity-40 backdrop-blur-lg text-lg sm:text-xl shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 placeholder-gray-700 placeholder-opacity-75 border-opacity-60"
        placeholder={getTranslatedText("enterIngredient")}
        value={ingredientsInput}
        onChange={(e) => setIngredientsInput(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') handleAddIngredient(); }}
      />
      <button
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 mb-6 text-lg sm:text-xl font-semibold border-2 border-green-400 border-opacity-70"
        onClick={handleAddIngredient}
      >
        {getTranslatedText("addIngredient")}
      </button>

      <div className="w-full max-w-lg mt-6 p-5 bg-white bg-opacity-40 backdrop-blur-lg rounded-2xl border-2 border-blue-300 min-h-28 flex flex-col items-center justify-center shadow-2xl border-opacity-60">
        {userIngredients.length > 0 ? (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mt-2 mb-4 text-gray-800">{getTranslatedText("yourIngredients")}</h2>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {userIngredients.map((ingredient, index) => (
                <div key={index} className="flex items-center bg-cyan-600 bg-opacity-70 rounded-full py-2 px-4 shadow-md transition-all duration-200 transform hover:scale-105 border border-cyan-400 border-opacity-70 animate-bounce-in">
                  <span className="text-white text-base font-medium mr-2">{ingredient}</span>
                  <button className="text-white font-bold text-base leading-none ml-1 opacity-80 hover:opacity-100" onClick={() => handleRemoveIngredient(ingredient)}>
                    X
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-6 bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
              onClick={handleClearAllIngredients}
            >
              {getTranslatedText("clearAll")}
            </button>
          </>
        ) : (
          <p className="text-lg text-gray-700 text-center">{getTranslatedText("addSomeIngredients")}</p>
        )}
      </div>

      <div className="w-full max-w-md mt-6">
        <label htmlFor="cuisine-select" className="block text-lg font-semibold text-gray-800 mb-2 text-center">{getTranslatedText("selectCuisine")}</label>
        <select
          id="cuisine-select"
          className="w-full p-3 border-2 border-blue-300 rounded-xl bg-white bg-opacity-40 backdrop-blur-lg text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 border-opacity-60"
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)}
        >
          <option value="">{getTranslatedText("anyCuisine")}</option>
          <option value="Indian">Indian</option>
          <option value="Italian">Italian</option>
          <option value="Mexican">Mexican</option>
          <option value="Chinese">Chinese</option>
          <option value="American">American</option>
          <option value="French">French</option>
          <option value="Japanese">Japanese</option>
          <option value="Mediterranean">Mediterranean</option>
          <option value="Thai">Thai</option>
        </select>
      </div>

      {apiError && (
        <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mt-6 w-full max-w-lg text-center shadow-lg border-opacity-70" role="alert">
          <strong className="font-bold">{getTranslatedText("error")}</strong>
          <span className="block sm:inline"> {apiError}</span>
        </div>
      )}

      <button
        className={`mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 px-10 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-blue-400 border-opacity-70 ${userIngredients.length === 0 || loading || translationLoading || llmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => fetchRecipes('ingredients')}
        disabled={userIngredients.length === 0 || loading || translationLoading || llmLoading}
      >
        {loading && !translationLoading ? (
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
        ) : (
          <span>{getTranslatedText("findRecipes")}</span>
        )}
      </button>

      <button
        className={`mt-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-teal-400 border-opacity-70 ${loading || translationLoading || llmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => fetchRecipes('random')}
        disabled={loading || translationLoading || llmLoading}
      >
        {loading && !translationLoading ? (
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
        ) : (
          <span>{getTranslatedText("viewPopularDishes")}</span>
        )}
      </button>

      <button
        className={`mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg sm:text-xl font-semibold border-2 border-purple-400 border-opacity-70 ${userIngredients.length === 0 || llmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleGenerateCreativeRecipeIdea}
        disabled={userIngredients.length === 0 || llmLoading}
      >
        {llmLoading && showCreativeRecipeModal ? (
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
        ) : (
          <span>✨ {getTranslatedText("generateCreativeIdea")} ✨</span>
        )}
      </button>

      {showCreativeRecipeModal && (
        <Modal
          title={getTranslatedText("creativeRecipeIdea")}
          onClose={() => setShowCreativeRecipeModal(false)}
          isLoading={llmLoading}
        >
          {creativeRecipeIdea ? (
            <div className="text-left">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">{getTranslatedText("recipeName")}: {creativeRecipeIdea.name}</h3>
              <p className="text-gray-700 text-lg mb-4">{creativeRecipeIdea.description}</p>
              <h4 className="font-semibold text-xl text-gray-800 mb-2">{getTranslatedText("keyIngredients")}:</h4>
              <ul className="list-disc list-inside text-gray-700 text-lg mb-4">
                {creativeRecipeIdea.keyIngredients && creativeRecipeIdea.keyIngredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
              <h4 className="font-semibold text-xl text-gray-800 mb-2">{getTranslatedText("shortProcedure")}:</h4>
              <ol className="list-decimal list-inside text-gray-700 text-lg">
                {creativeRecipeIdea.shortProcedure && creativeRecipeIdea.shortProcedure.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-gray-700 text-lg">{getTranslatedText("noIdeaGenerated")}</p>
          )}
        </Modal>
      )}
    </div>
  );

  // Recipe List Screen
  const renderRecipeListScreen = () => (
    <div className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <div className="flex justify-between items-center w-full max-w-4xl mb-8">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
          onClick={() => { setCurrentScreen(SCREENS.HOME); setSelectedRecipe(null); }} // Clear selectedRecipe
        >
          &larr; {getTranslatedText("backToIngredients")}
        </button>
        {currentUser && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
            onClick={handleLogout}
            disabled={authLoading}
          >
            {getTranslatedText("logout")}
          </button>
        )}
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 text-gray-800 text-center drop-shadow-lg">{getTranslatedText("recommendedRecipes")}</h1>

      {loading || translationLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          <RecipeCardSkeleton /><RecipeCardSkeleton /><RecipeCardSkeleton />
          <RecipeCardSkeleton /><RecipeCardSkeleton /><RecipeCardSkeleton />
        </div>
      ) : apiError ? (
        <div className="bg-red-100 bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mt-6 w-full max-w-lg text-center shadow-lg border-opacity-70" role="alert">
          <strong className="font-bold">{getTranslatedText("error")}</strong>
          <span className="block sm:inline"> {apiError}</span>
        </div>
      ) : recommendedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {recommendedRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white bg-opacity-40 backdrop-blur-lg rounded-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-xl border-2 border-gray-200 border-opacity-60 animate-bounce-in"
              onClick={() => viewRecipeDetails(recipe)}
            >
              <img src={recipe.image} alt={recipe.name} className="w-full h-56 object-cover" />
              <div className="p-5">
                <h3 className="font-bold text-2xl text-gray-800 mb-2">{recipe.name}</h3>
                <p className="text-gray-700 text-lg mb-3">{recipe.description}</p>
                <p className="text-gray-600 text-md">
                  <span className="font-semibold">{getTranslatedText("ingredients")}:</span> {Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 5).join(', ') : ''}{Array.isArray(recipe.ingredients) && recipe.ingredients.length > 5 ? '...' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xl text-gray-700 text-center">{getTranslatedText("noRecipesFound")}</p>
      )}
    </div>
  );

  // Recipe Detail Screen
  const renderRecipeDetailScreen = () => (
    <div className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 font-inter text-gray-900 animate-fadeIn">
      <div className="flex justify-between items-center w-full max-w-3xl mb-8">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
          onClick={() => { setCurrentScreen(SCREENS.RECIPE_LIST); setSelectedRecipe(null); }} // Clear selectedRecipe
        >
          &larr; {getTranslatedText("backToRecipes")}
        </button>
        {currentUser && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
            onClick={handleLogout}
            disabled={authLoading}
          >
            {getTranslatedText("logout")}
          </button>
        )}
      </div>
      {selectedRecipe && (
        <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-3xl">
          <h1 className="font-extrabold text-4xl sm:text-5xl text-center text-gray-800 mb-6 drop-shadow-lg">{selectedRecipe.name}</h1>
          <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-80 object-cover rounded-xl mb-6 shadow-lg" />

          <h2 className="font-bold text-3xl text-gray-800 mb-4">{getTranslatedText("description")}</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{selectedRecipe.description}</p>

          <h2 className="font-bold text-3xl text-gray-800 mb-4">{getTranslatedText("ingredients")}</h2>
          <ul className="list-disc list-inside text-gray-700 text-lg mb-8 space-y-2">
            {selectedRecipe?.ingredients?.map((ingredient, index) => ( // Added optional chaining
              <li key={index} className="flex justify-between items-center">
                <span>{ingredient}</span>
                <button
                  className={`ml-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 ${llmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleIngredientSubstitution(ingredient)}
                  disabled={llmLoading}
                >
                  ✨ {getTranslatedText("substitute")}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-orange-400 border-opacity-70 ${translationLoading || llmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={startProcedure}
              disabled={translationLoading || llmLoading}
            >
              {getTranslatedText("startCookingProcedure")}
            </button>
            <button
              className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-cyan-400 border-opacity-70 relative"
              onClick={copyRecipeToClipboard}
            >
              {getTranslatedText("copyRecipe")}
              {showCopiedMessage && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded-md animate-fadeIn whitespace-nowrap">{getTranslatedText("copied")}</span>
              )}
            </button>
          </div>
          {translationLoading && (
            <div className="text-center text-blue-700 font-semibold mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 inline-block mr-2"></div>
              {getTranslatedText("translatingContent")}...
            </div>
          )}
        </div>
      )}

      {showSubstitutionModal && (
        <Modal
          title={`${getTranslatedText("ingredientSubstitutions")} ${substitutingIngredient}`}
          onClose={() => setShowSubstitutionModal(false)}
          isLoading={llmLoading}
        >
          {substitutionResult && substitutionResult.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 text-lg space-y-2">
              {substitutionResult.map((sub, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{sub.name}:</span> {sub.note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-lg">{getTranslatedText("noSuggestionsFound")}</p>
          )}
        </Modal>
      )}
    </div>
  );

  // Procedure Screen
  const renderProcedureScreen = () => (
    <div className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-green-200 via-teal-200 to-blue-200 font-inter text-gray-900 animate-fadeIn">
      <div className="flex justify-between items-center w-full max-w-3xl mb-8">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
          onClick={() => { setCurrentScreen(SCREENS.RECIPE_DETAIL); setCurrentProcedureStep(0); }} // Reset step on back
        >
          &larr; {getTranslatedText("backToDetails")}
        </button>
        {currentUser && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
            onClick={handleLogout}
            disabled={authLoading}
          >
            {getTranslatedText("logout")}
          </button>
        )}
      </div>
      {selectedRecipe && (
        <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-3xl">
          <h1 className="font-extrabold text-4xl sm:text-5xl text-center text-gray-800 mb-6 drop-shadow-lg">{getTranslatedText("cookingProcedure")}</h1>

          <div className="relative w-full h-64 sm:h-80 mb-6 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
            <CookingAnimation step={currentProcedureStep} />
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                {getTranslatedText("step")} {currentProcedureStep + 1} / {selectedRecipe?.procedure?.length || 0} {/* Added optional chaining */}
            </div>
          </div>

          <p
            className="text-gray-800 text-xl leading-relaxed mb-8 text-center px-4 sm:px-0 transition-opacity duration-300"
            style={{ opacity: stepOpacity }}
          >
            {selectedRecipe.procedure[currentProcedureStep]}
          </p>

          <div className="flex justify-between gap-4 mt-4">
            <button
              className={`bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-blue-400 border-opacity-70 ${currentProcedureStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={prevStep}
              disabled={currentProcedureStep === 0}
            >
              &larr; {getTranslatedText("previousStep")}
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-green-400 border-opacity-70"
              onClick={nextStep}
            >
              {currentProcedureStep < (selectedRecipe?.procedure?.length || 0) - 1 ? `${getTranslatedText("nextStep")} \u2192` : getTranslatedText("finishCooking")} {/* Added optional chaining */}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Completed Screen
  const renderCompletedScreen = () => (
    <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-pink-200 via-orange-200 to-yellow-200 font-inter text-gray-900 overflow-hidden">
      <div ref={confettiContainerRef} className="absolute inset-0 pointer-events-none z- confettibox"></div> {/* Confetti container */}
      <div className="bg-white bg-opacity-70 backdrop-blur-lg rounded-2xl p-8 sm:p-10 shadow-2xl border-2 border-gray-200 border-opacity-60 text-center w-full max-w-xl animate-bounce-in">
        <h1 className="font-extrabold text-5xl sm:text-6xl text-gray-800 mb-6 drop-shadow-lg">{getTranslatedText("congratulations")}</h1>
        <p className="text-xl sm:text-2xl text-gray-700 mb-8">{getTranslatedText("recipeCompleted")} <br /><span className="font-bold text-purple-700">{selectedRecipe?.name || getTranslatedText("yourDish")}</span></p>

        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-indigo-400 border-opacity-70 mb-4"
          onClick={() => { setCurrentScreen(SCREENS.HOME); setSelectedRecipe(null); }} // Clear selectedRecipe
        >
          {getTranslatedText("cookAnotherRecipe")}
        </button>
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-5 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold mt-2"
          onClick={handleLogout}
          disabled={authLoading}
        >
          {getTranslatedText("logout")}
        </button>
      </div>
    </div>
  );

  // Settings Screen
  const renderSettingsScreen = () => (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 font-inter text-gray-900 animate-fadeIn">
      <div className="absolute top-4 left-4">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out text-sm font-semibold transform hover:scale-105"
          onClick={() => setCurrentScreen(SCREENS.HOME)}
        >
          &larr; {getTranslatedText("backToHome")}
        </button>
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 text-center drop-shadow-lg text-gray-800">{getTranslatedText("settings")}</h1>
      <div className="bg-white bg-opacity-40 backdrop-blur-lg rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-gray-200 border-opacity-60 w-full max-w-md">
        <label htmlFor="language-select" className="block text-lg font-semibold text-gray-800 mb-2 text-center">{getTranslatedText("language")}:</label>
        <select
          id="language-select"
          className="w-full p-3 border-2 border-blue-300 rounded-xl bg-white bg-opacity-40 backdrop-blur-lg text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 border-opacity-60 mb-6"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="ml">മലയാളം (Malayalam)</option>
          <option value="te">తెలుగు (Telugu)</option>
        </select>

        <label htmlFor="default-cuisine-select" className="block text-lg font-semibold text-gray-800 mb-2 text-center">{getTranslatedText("defaultCuisine")}:</label>
        <select
          id="default-cuisine-select"
          className="w-full p-3 border-2 border-blue-300 rounded-xl bg-white bg-opacity-40 backdrop-blur-lg text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 border-opacity-60"
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)} // Update selectedCuisine directly
        >
          <option value="">{getTranslatedText("anyCuisine")}</option>
          <option value="Indian">Indian</option>
          <option value="Italian">Italian</option>
          <option value="Mexican">Mexican</option>
          <option value="Chinese">Chinese</option>
          <option value="American">American</option>
          <option value="French">French</option>
          <option value="Japanese">Japanese</option>
          <option value="Mediterranean">Mediterranean</option>
          <option value="Thai">Thai</option>
        </select>
      </div>
    </div>
  );


  // Render the appropriate screen based on currentScreen state
  const renderScreen = () => {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-xl text-gray-700">{getTranslatedText("loadingApp")}</p>
        </div>
      );
    }

    if (!currentUser) {
      switch (currentScreen) {
        case SCREENS.SIGNUP:
          return renderSignupScreen();
        case SCREENS.PHONE_LOGIN:
          return renderPhoneLoginScreen();
        case SCREENS.LOGIN:
        default:
          return renderLoginScreen();
      }
    }

    switch (currentScreen) {
      case SCREENS.HOME:
        return renderHomeScreen();
      case SCREENS.RECIPE_LIST:
        return renderRecipeListScreen();
      case SCREENS.RECIPE_DETAIL:
        return renderRecipeDetailScreen();
      case SCREENS.PROCEDURE:
        return renderProcedureScreen();
      case SCREENS.COMPLETED:
        return renderCompletedScreen();
      case SCREENS.SETTINGS:
        return renderSettingsScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <>
      <style>{customAnimationsCss}</style>
      {renderScreen()}
    </>
  );
};

export default App;
