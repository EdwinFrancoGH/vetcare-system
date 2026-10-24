"use client";

export const CHIPS_MOTIVO_DEFECTO = [
    "Consulta general",
    "Vacunación",
    "Control",
    "Desparasitación",
    "Malestar / enfermedad",
];

export default function ChipsMotivo({
    motivoActual,
    onSeleccionarChip,
    chips = CHIPS_MOTIVO_DEFECTO,
}) {
    return (
        <div className="flex flex-wrap gap-1.5 mb-2">
            {chips.map((chip) => (
                <button
                    type="button"
                    key={chip}
                    onClick={() => onSeleccionarChip(chip)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                        motivoActual === chip
                            ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
}
