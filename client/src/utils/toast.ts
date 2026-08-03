import { toast, ToastOptions } from 'react-toastify'

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export const showSuccess = (message: string, options?: ToastOptions): void => {
  toast.success(message, { ...defaultOptions, ...options })
}

export const showError = (message: string, options?: ToastOptions): void => {
  toast.error(message, { ...defaultOptions, ...options })
}

export const showWarning = (message: string, options?: ToastOptions): void => {
  toast.warning(message, { ...defaultOptions, ...options })
}

export const showInfo = (message: string, options?: ToastOptions): void => {
  toast.info(message, { ...defaultOptions, ...options })
}

export const notify = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
}
