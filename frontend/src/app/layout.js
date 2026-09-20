import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "../components/layout/Sidebar";
import "./globals.css";

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

export default function RootLayout({ children }) {
    return (
        <html
            lang="es"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full">
                <div className="min-h-screen md:flex">
                    <Sidebar />

                    <div className="min-w-0 flex-1">
                        {children}
                    </div>
                </div>
            </body>
        </html>
    );
}