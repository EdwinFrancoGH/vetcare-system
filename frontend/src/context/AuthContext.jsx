
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
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

    // Estado independiente para detectar cambios de verificación.
    const [emailVerified, setEmailVerified] = useState(false);

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!active) return;

            setUser(currentUser);
            setEmailVerified(currentUser?.emailVerified ?? false);

            if (currentUser) {
                try {
                    const docRef = doc(db, "usuarios", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (!active || auth.currentUser?.uid !== currentUser.uid) {
                        return;
                    }

                    if (docSnap.exists()) {
                        setUserRole(docSnap.data().role);
                        setUserData(docSnap.data());
                    } else {
                        setUserRole(null);
                        setUserData(null);
                    }
                } catch (error) {
                    if (!active || auth.currentUser?.uid !== currentUser.uid) {
                        return;
                    }

                    console.error("Error fetching user data:", error);
                    setUserRole(null);
                    setUserData(null);
                }
            } else {
                setUserRole(null);
                setUserData(null);
            }

            if (active) {
                setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    // Inicio de sesión tradicional.
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

    // Registro con correo y contraseña.
    const register = async (email, password) => {
        const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await sendEmailVerification(result.user);

        return result;
    };

    // Reenviar correo de verificación.
    const resendVerificationEmail = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error("No hay un usuario autenticado.");
        }

        await currentUser.reload();

        if (currentUser.emailVerified) {
            setEmailVerified(true);
            await currentUser.getIdToken(true);
            return false;
        }

        await sendEmailVerification(currentUser);

        return true;
    };

    // Comprobar si el usuario verificó su correo.
    const checkEmailVerification = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setEmailVerified(false);
            return false;
        }

        // Consultar el estado actualizado en Firebase.
        await currentUser.reload();

        // Actualizar el token cuando ya esté verificado.
        if (currentUser.emailVerified) {
            await currentUser.getIdToken(true);
        }

        // Conservar el objeto original de Firebase.
        setUser(currentUser);

        // Actualizar un estado independiente para provocar
        // la actualización de los componentes.
        setEmailVerified(currentUser.emailVerified);

        return currentUser.emailVerified;
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

    // Actualizar información del usuario desde Firestore.
    const refreshUserData = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        try {
            const docRef = doc(db, "usuarios", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (auth.currentUser?.uid !== currentUser.uid) return;

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

    const value = {
        user,
        userRole,
        userData,
        loading,
        emailVerified,
        login,
        loginWithGoogle,
        register,
        resendVerificationEmail,
        checkEmailVerification,
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
