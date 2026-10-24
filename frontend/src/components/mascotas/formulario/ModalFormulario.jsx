"use client";

import { useEffect } from "react";
import { FaTimes, FaPaw } from "react-icons/fa";

export default function ModalFormulario({
    titulo,
    subtitulo,
    inicial = "",
    fotoURL = "",
    avatarBg = "bg-gray-100 text-gray-700 border-gray-200",
    IconoEspecie = FaPaw,
    onCerrar,
    children,
    formRef,
}) {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onCerrar?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCerrar]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCerrar?.();
                }
            }}
        >
            <div
                ref={formRef}
                className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[720px] bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-2xl shrink-0 border ${avatarBg} transition-colors`}
                        >
                            {fotoURL ? (
                                <img src={fotoURL} alt="Foto de la mascota" className="h-full w-full rounded-full object-cover" />
                            ) : inicial ? (
                                <span>{inicial}</span>
                            ) : (
                                <IconoEspecie className="w-6 h-6" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                {titulo}
                            </h2>
                            {subtitulo && (
                                <p className="text-xs sm:text-sm text-gray-500 font-medium truncate mt-0.5">
                                    {subtitulo}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar modal"
                        title="Cerrar modal"
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors shrink-0"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}
