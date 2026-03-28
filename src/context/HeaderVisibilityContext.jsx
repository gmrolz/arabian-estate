import { createContext, useContext, useState, useCallback } from 'react';

const HeaderVisibilityContext = createContext(null);

export function useHeaderVisibility() {
  const ctx = useContext(HeaderVisibilityContext);
  return ctx;
}

export function HeaderVisibilityProvider({ children }) {
  const [hideHeader, setHideHeaderState] = useState(false);
  const setHideHeader = useCallback((value) => setHideHeaderState(Boolean(value)), []);
  const value = { hideHeader, setHideHeader };
  return (
    <HeaderVisibilityContext.Provider value={value}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
}
