import { createContext, useContext, useState, useCallback } from 'react';

const AdminToastContext = createContext(null);

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  return ctx || { showToast: () => {} };
}

const TOAST_DURATION = 4000;

export function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`admin-toast admin-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </AdminToastContext.Provider>
  );
}
