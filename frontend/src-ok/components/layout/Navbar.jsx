"use client";

import { FaBell, FaCog, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-8">
      <h1 className="text-xl font-semibold text-gray-700">
        Sistema Veterinario
      </h1>

      <div className="flex items-center gap-6 text-xl text-gray-600">
        <FaBell className="cursor-pointer" />
        <FaCog className="cursor-pointer" />
        <FaUserCircle className="text-3xl cursor-pointer" />
      </div>
    </header>
  );
}