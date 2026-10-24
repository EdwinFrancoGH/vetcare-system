"use client";

import Link from "next/link";
import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onAbrirMenu }) {
    const { userData } = useAuth();

    const displayName = userData?.name || "Usuario VetCare";
    const displayRole = userData?.role || "";

    return (
        <header className="h-16 bg-white shadow flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onAbrirMenu}
                    className="md:hidden text-gray-700 hover:text-blue-900 p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Abrir menú"
                    title="Abrir menú"
                >
                    <FaBars className="text-xl" />
                </button>
                <h1 className="text-xl font-semibold text-gray-700">
                    Sistema Veterinario
                </h1>
            </div>

            <div className="flex items-center gap-6 text-gray-600">
                <FaBell className="cursor-pointer text-xl" />

                <Link href="/profile" className="flex items-center gap-2 hover:text-blue-900 transition">
                    {userData?.photoURL ? (
                        <img
                            src={userData.photoURL}
                            alt="Foto de perfil"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <FaUserCircle className="text-3xl cursor-pointer" />
                    )}
                    <div className="text-sm text-left leading-tight">
                        <p className="font-semibold">{displayName}</p>
                        {displayRole && <p className="text-xs text-gray-400">{displayRole}</p>}
                    </div>
                </Link>
            </div>
        </header>
    );
}
