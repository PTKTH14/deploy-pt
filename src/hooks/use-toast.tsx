import { toast as sonnerToast, type Toast } from 'sonner';
import React from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
} & Partial<Toast>;

const useToast = () => {
  const toast = ({ title, description, variant = 'default', duration = 3000, ...props }: ToastProps) => {
    return sonnerToast[variant === 'destructive' ? 'error' : 'success'](
      <div className="grid gap-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>,
      {
        duration,
        ...props,
      }
    );
  };

  return { toast };
};

export { useToast };
