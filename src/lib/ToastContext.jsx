import React, { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children, toast }) {
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
