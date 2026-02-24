// Reusable Modal Components
// Note: This project uses React Toastify for notifications instead of traditional modals
// These are kept as reusable modal wrappers for form dialogs

export const Modal = ({ isOpen, onClose, children, title, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalHeader = ({ children }) => (
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
  </div>
);

export const ModalBody = ({ children }) => (
  <div className="mb-6">
    {children}
  </div>
);

export const ModalFooter = ({ children }) => (
  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
    {children}
  </div>
);
