"use client";

export default function CampoFormulario({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder = "",
    error,
    requerido = false,
    className = "",
    prefix = null,
    badge = null,
    as = "input",
    children,
    ...rest
}) {
    const errorClase = error
        ? "border-red-500 focus:ring-red-400 bg-red-50/20"
        : "border-gray-300 focus:ring-blue-500";

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-1">
                {label && (
                    <label htmlFor={name} className="text-sm font-medium text-gray-700 block">
                        {label} {requerido && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                {badge && <div className="text-xs">{badge}</div>}
            </div>

            {children ? (
                children
            ) : as === "textarea" ? (
                <textarea
                    id={name}
                    name={name}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${errorClase}`}
                    {...rest}
                />
            ) : prefix ? (
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-semibold text-sm select-none">
                        {prefix}
                    </span>
                    <input
                        id={name}
                        name={name}
                        type={type}
                        value={value ?? ""}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`w-full rounded-lg border pl-14 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${errorClase}`}
                        {...rest}
                    />
                </div>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${errorClase}`}
                    {...rest}
                />
            )}

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
