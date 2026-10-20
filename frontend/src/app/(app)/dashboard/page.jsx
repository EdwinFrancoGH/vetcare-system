"use client";

import RequireRole from "../../../components/auth/RequireRole";
import { useAuth } from "../../../context/AuthContext";
import DashboardPersonal from "../../../components/dashboard/DashboardPersonal";
import DashboardCliente from "../../../components/dashboard/cliente/DashboardCliente";

export default function DashboardPage() {
    const { userRole } = useAuth();

    if (userRole === "Cliente") {
        return <DashboardCliente />;
    }

    return (
        <RequireRole roles={["Administrador", "Recepcionista", "Veterinario"]}>
            <DashboardPersonal />
        </RequireRole>
    );
}
