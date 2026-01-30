import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'full';
    mobileFullScreen?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    mobileFullScreen = true,
}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Handle dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
                // Prevent body scroll on mobile
                document.body.style.overflow = 'hidden';
            }
        } else {
            if (dialog.open) {
                dialog.close();
                document.body.style.overflow = '';
            }
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle backdrop click
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClick = (e: MouseEvent) => {
            const rect = dialog.getBoundingClientRect();
            const isInDialog = (
                rect.top <= e.clientY &&
                e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX &&
                e.clientX <= rect.left + rect.width
            );

            if (!isInDialog) {
                onClose();
            }
        };

        dialog.addEventListener('click', handleClick);
        return () => dialog.removeEventListener('click', handleClick);
    }, [onClose]);

    // Handle ESC key (native dialog handles it, but we need to sync state)
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault();
            onClose();
        };

        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [onClose]);

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        full: 'max-w-4xl',
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal-dialog backdrop:bg-white/10 backdrop:backdrop-blur-sm"
        >
            <div
                className={`
                    modal-content bg-card rounded-none md:rounded-2xl shadow-2xl
                    ${mobileFullScreen ? 'modal-mobile-fullscreen' : 'modal-mobile-sheet'}
                    md:${sizeClasses[size]} md:max-h-[90vh]
                    flex flex-col
                `}
            >
                {/* Header - Fixed, solid background */}
                <div className="modal-header bg-card border-b px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="modal-body flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
                    {children}
                </div>

                {/* Footer - Fixed, solid background (if provided) */}
                {footer && (
                    <div className="modal-footer bg-card border-t px-4 md:px-6 py-4 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>

            <style>{`
                .modal-dialog {
                    padding: 0;
                    border: none;
                    // background: transparent;
                    border-radius: 1rem;
                    max-width: 100vw;
                    max-height: 100vh;
                }

                .modal-dialog::backdrop {
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }

                /* Mobile: Full screen */
                @media (max-width: 767px) {
                    .modal-dialog {
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                    }

                    .modal-mobile-fullscreen {
                        width: 100vw;
                        height: 100vh;
                        max-height: 100vh;
                    }

                    .modal-mobile-sheet {
                        width: 100vw;
                        min-height: 50vh;
                        max-height: 90vh;
                        margin-top: auto;
                        border-radius: 1.5rem 1.5rem 0 0;
                    }
                }

                /* Desktop: Centered with max-width */
                @media (min-width: 768px) {
                    .modal-dialog {
                        margin: auto;
                    }

                    .modal-content {
                        animation: modal-slide-up 0.2s ease-out;
                    }
                }

                /* Animations */
                @keyframes modal-slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Ensure smooth scrolling */
                .modal-body {
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                }

                /* Custom scrollbar for modal */
                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }

                .modal-body::-webkit-scrollbar-track {
                    background: transparent;
                }

                .modal-body::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }

                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }

                /* Dark mode scrollbar */
                @media (prefers-color-scheme: dark) {
                    .modal-body::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.2);
                    }

                    .modal-body::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                }
            `}</style>
        </dialog>
    );
}