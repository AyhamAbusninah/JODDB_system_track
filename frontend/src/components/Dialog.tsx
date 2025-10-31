import React from 'react';

interface DialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ title, isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Transparent backdrop for click-outside-to-close */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-5 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className={`bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all overflow-hidden pointer-events-auto ${className}`}>
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          </div>
          {/* Modal Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};