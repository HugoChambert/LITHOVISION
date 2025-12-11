import { useState, useCallback } from 'react';
import Toast, { ToastData, ToastType } from './Toast';
import './Toast.css';

let addToastFn: ((message: string, type: ToastType, duration?: number) => void) | null = null;

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  if (addToastFn) {
    addToastFn(message, type, duration);
  }
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  addToastFn = addToast;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

export default ToastContainer;
