import React, { useState, createContext } from 'react';

// Ana şalterimiz artık tamamen bağımsız bir dosyada yaşıyor
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dil, setDil] = useState('tr');

  return (
    <AppContext.Provider value={{ isDarkMode, setIsDarkMode, dil, setDil }}>
      {children}
    </AppContext.Provider>
  );
};