import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "VetCare",
    description: "Sistema de gestión veterinaria",
};

// Layout raíz: SOLO se encarga del <html>/<body> y de exponer la sesión
// (AuthProvider) a toda la app. A propósito NO dibuja aquí el Sidebar/Navbar,
// porque las páginas de login/registro no deben mostrar ese menú.
// El menú y la protección de rutas viven en app/(app)/layout.jsx, y las
// páginas públicas de autenticación viven en app/(auth)/.
export default function RootLayout({ children }) {
    return (
        <html
            lang="es"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
