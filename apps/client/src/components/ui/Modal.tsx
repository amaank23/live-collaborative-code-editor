import { ReactNode, useEffect } from "react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, title, children, className }: ModalProps) {
  // Prevent background scroll while modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {/* Panel */}
      <div
        className={clsx(
          "relative z-10 w-full max-w-md mx-4 p-6 rounded-xl shadow-2xl",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
          className
        )}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
