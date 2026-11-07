
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";

import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
                    const docRef = doc(db, "usuarios", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setUserRole(docSnap.data().role);
                        setUserData(docSnap.data());
                    } else {
                        setUserRole(null);
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserRole(null);
                    setUserData(null);
                }
            } else {
                setUserRole(null);
                setUserData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Inicio de sesión tradicional con correo y contraseña.
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Inicio de sesión mediante Google.
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();

        provider.setCustomParameters({
            prompt: "select_account",
        });

        const result = await signInWithPopup(auth, provider);

        return result.user;
    };

    // Registro tradicional de usuarios.
    const register = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    // Cerrar sesión.
    const logout = () => {
        return signOut(auth);
    };

    // Recuperación de contraseña.
    const resetPassword = (email) => {
        const actionCodeSettings = {
            url: window.location.origin + "/reset-password",
            handleCodeInApp: true,
        };

        return sendPasswordResetEmail(auth, email, actionCodeSettings);
    };

    // Vuelve a leer el documento de Firestore del usuario actual
    // sin recargar la página ni cerrar la sesión.
    const refreshUserData = async () => {
        if (!auth.currentUser) return;

        try {
            const docRef = doc(db, "usuarios", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserRole(docSnap.data().role);
                setUserData(docSnap.data());
            } else {
                setUserRole(null);
                setUserData(null);
            }
        } catch (error) {
            console.error("Error refrescando datos de usuario:", error);
        }
    };

    // Funciones y datos disponibles para los componentes.
    const value = {
        user,
        userRole,
        userData,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        refreshUserData,
    };

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
