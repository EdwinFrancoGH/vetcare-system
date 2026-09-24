"use client";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">

        {/* Encabezado */}
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {title}
          </h2>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">

          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Eliminar
          </button>

        </div>

      </div>

    </div>
  );
}