import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      title: (text) => text,
      Ingredients: 'Ingredients',
      Instructions: 'Instructions',
      'Rate this Recipe': 'Rate this Recipe',
      Comments: 'Comments',
      'Upload Photo': 'Upload Photo',
    },
    hi: {
      title: (text) => text,
      Ingredients: 'सामग्री',
      Instructions: 'निर्देश',
      'Rate this Recipe': 'इस रेसिपी को रेट करें',
      Comments: 'टिप्पणियाँ',
      'Upload Photo': 'फोटो अपलोड करें',
    },
    ta: {
      title: (text) => text,
      Ingredients: 'பொருட்கள்',
      Instructions: 'வழிமுறைகள்',
      'Rate this Recipe': 'இந்த செய்முறையை மதிப்பிடவும்',
      Comments: 'கருத்துகள்',
      'Upload Photo': 'புகைப்படத்தை பதிவேற்றவும்',
    },
    es: {
      title: (text) => text,
      Ingredients: 'Ingredientes',
      Instructions: 'Instrucciones',
      'Rate this Recipe': 'Califica esta receta',
      Comments: 'Comentarios',
      'Upload Photo': 'Subir foto',
    },
    fr: {
      title: (text) => text,
      Ingredients: 'Ingrédients',
      Instructions: 'Instructions',
      'Rate this Recipe': 'Évaluer cette recette',
      Comments: 'Commentaires',
      'Upload Photo': 'Télécharger une photo',
    },
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};