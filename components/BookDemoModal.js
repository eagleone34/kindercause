"use client";

export default function BookDemoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[800px] animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">Book a Demo</h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Iframe Content */}
                <div className="flex-1 w-full bg-base-100 rounded-b-2xl overflow-hidden">
                    <iframe
                        src="https://zcal.co/i/yCQRF6b_?embed=1"
                        style={{ border: "none", width: "100%", height: "100%" }}
                        title="Book a Demo"
                    />
                </div>
            </div>
        </div>
    );
}
