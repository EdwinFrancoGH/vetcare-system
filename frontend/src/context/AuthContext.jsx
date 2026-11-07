"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    await api.post("/auth/sync", {
                        name: currentUser.displayName || currentUser.email?.split("@")[0] || ""
                    });
                    const response = await api.get("/users/profile");
                    if (response.data?.user) {
                        setUserRole(response.data.user.role);
                        setUserData(response.data.user);
                    } else {
                        setUserRole(null);
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserRole(null);
                }
            } else {
                setUserRole(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const resetPassword = (email) => {
        const actionCodeSettings = {
            url: window.location.origin + '/reset-password',
            handleCodeInApp: true,
        };
        return sendPasswordResetEmail(auth, email, actionCodeSettings);
    };

    // Vuelve a leer el documento de Firestore del usuario actual (por
    // ejemplo, después de subir una foto de perfil) sin recargar la página
    // ni cerrar la sesión.
    const refreshUserData = async () => {
        if (!auth.currentUser) return;
        try {
            const response = await api.get("/users/profile");
            if (response.data?.user) {
                setUserRole(response.data.user.role);
                setUserData(response.data.user);
            }
        } catch (error) {
            console.error("Error refrescando datos de usuario:", error);
        }
    };

    const value = { user, userRole, userData, loading, login, register, logout, resetPassword, refreshUserData };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
}
