// src/contexts/ActiveCategoryContext.js
import React, { createContext, useState, useContext } from 'react';

const ActiveCategoryContext = createContext();

export const ActiveCategoryProvider = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState('Current Collection');

  return (
    <ActiveCategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </ActiveCategoryContext.Provider>
  );
};

export const useActiveCategory = () => useContext(ActiveCategoryContext);
