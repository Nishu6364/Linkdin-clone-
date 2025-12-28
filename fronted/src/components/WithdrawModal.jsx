import React from 'react';
import { IoClose } from "react-icons/io5";

function WithdrawModal({ isOpen, onClose, onConfirm, userName }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <IoClose className="w-6 h-6" />
                </button>

                {/* Modal header */}
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Withdraw invitation
                </h3>

                {/* Modal content */}
                <p className="text-gray-600 mb-6">
                    If you withdraw now, you won't be able to resend to {userName || 'this person'} for up to 3 weeks.
                </p>

                {/* Modal buttons */}
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-full border border-gray-300 hover:border-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 bg-[#0073b1] text-white font-medium rounded-full hover:bg-[#005885] transition-colors"
                    >
                        Withdraw
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WithdrawModal;
