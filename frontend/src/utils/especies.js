import {
    FaDog,
    FaCat,
    FaPaw,
    FaDove,
    FaFish,
} from "react-icons/fa";
import { GiRabbit, GiRat, GiTurtle } from "react-icons/gi";

export const ESPECIES = [
    {
        id: "Perro",
        label: "Perro",
        icon: FaDog,
        bg: "bg-blue-100 text-blue-700 border-blue-200",
        iconBadgeColor: "text-blue-600 border-blue-200",
        stripBg: "bg-blue-500",
        suaveBg: "bg-blue-50 text-blue-800 border-blue-100",
    },
    {
        id: "Gato",
        label: "Gato",
        icon: FaCat,
        bg: "bg-purple-100 text-purple-700 border-purple-200",
        iconBadgeColor: "text-purple-600 border-purple-200",
        stripBg: "bg-purple-500",
        suaveBg: "bg-purple-50 text-purple-800 border-purple-100",
    },
    {
        id: "Ave",
        label: "Ave",
        icon: FaDove,
        bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        iconBadgeColor: "text-emerald-600 border-emerald-200",
        stripBg: "bg-emerald-500",
        suaveBg: "bg-emerald-50 text-emerald-800 border-emerald-100",
    },
    {
        id: "Conejo",
        label: "Conejo",
        icon: GiRabbit,
        bg: "bg-amber-100 text-amber-700 border-amber-200",
        iconBadgeColor: "text-amber-600 border-amber-200",
        stripBg: "bg-amber-500",
        suaveBg: "bg-amber-50 text-amber-800 border-amber-100",
    },
    {
        id: "Roedor",
        label: "Roedor",
        icon: GiRat,
        bg: "bg-orange-100 text-orange-700 border-orange-200",
        iconBadgeColor: "text-orange-600 border-orange-200",
        stripBg: "bg-orange-500",
        suaveBg: "bg-orange-50 text-orange-800 border-orange-100",
    },
    {
        id: "Reptil",
        label: "Reptil",
        icon: GiTurtle,
        bg: "bg-teal-100 text-teal-700 border-teal-200",
        iconBadgeColor: "text-teal-600 border-teal-200",
        stripBg: "bg-teal-500",
        suaveBg: "bg-teal-50 text-teal-800 border-teal-100",
    },
    {
        id: "Pez",
        label: "Pez",
        icon: FaFish,
        bg: "bg-cyan-100 text-cyan-700 border-cyan-200",
        iconBadgeColor: "text-cyan-600 border-cyan-200",
        stripBg: "bg-cyan-500",
        suaveBg: "bg-cyan-50 text-cyan-800 border-cyan-100",
    },
    {
        id: "Otro",
        label: "Otro",
        icon: FaPaw,
        bg: "bg-gray-100 text-gray-700 border-gray-200",
        iconBadgeColor: "text-gray-600 border-gray-200",
        stripBg: "bg-gray-500",
        suaveBg: "bg-gray-50 text-gray-800 border-gray-100",
    },
];

export const ESPECIE_IDS = ["Perro", "Gato", "Ave", "Conejo", "Roedor", "Reptil", "Pez"];

export function obtenerEspecie(valor) {
    const norm = String(valor || "").trim().toLowerCase();
    if (!norm) {
        return ESPECIES.find((e) => e.id === "Otro");
    }

    if (norm === "perro" || norm === "canino" || norm === "perros" || norm === "can") {
        return ESPECIES.find((e) => e.id === "Perro");
    }
    if (norm === "gato" || norm === "felino" || norm === "gatos" || norm === "felina") {
        return ESPECIES.find((e) => e.id === "Gato");
    }
    if (
        norm === "ave" ||
        norm === "pájaro" ||
        norm === "pajaro" ||
        norm === "aves" ||
        norm === "pájaros" ||
        norm === "pajaros" ||
        norm === "loro" ||
        norm === "perico"
    ) {
        return ESPECIES.find((e) => e.id === "Ave");
    }
    if (norm === "conejo" || norm === "conejos" || norm === "conejito") {
        return ESPECIES.find((e) => e.id === "Conejo");
    }
    if (
        norm === "roedor" ||
        norm === "roedores" ||
        norm === "hámster" ||
        norm === "hamster" ||
        norm === "cobaya" ||
        norm === "cuyo" ||
        norm === "chinchilla" ||
        norm === "raton" ||
        norm === "ratón"
    ) {
        return ESPECIES.find((e) => e.id === "Roedor");
    }
    if (
        norm === "reptil" ||
        norm === "reptiles" ||
        norm === "tortuga" ||
        norm === "iguana" ||
        norm === "serpiente" ||
        norm === "lagarto"
    ) {
        return ESPECIES.find((e) => e.id === "Reptil");
    }
    if (
        norm === "pez" ||
        norm === "peces" ||
        norm === "acuático" ||
        norm === "acuatico" ||
        norm === "pescado"
    ) {
        return ESPECIES.find((e) => e.id === "Pez");
    }

    const match = ESPECIES.find(
        (e) => e.id.toLowerCase() === norm || e.label.toLowerCase() === norm
    );
    if (match) return match;

    return ESPECIES.find((e) => e.id === "Otro");
}
