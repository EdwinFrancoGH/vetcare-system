// Redimensiona y comprime una imagen en el navegador antes de subirla.
// La foto de perfil se guarda como base64 dentro del mismo documento de
// Firestore del usuario (no usamos Firebase Storage para evitar que tengas
// que habilitar y configurar un producto más de Firebase). Por eso es
// importante mantenerla pequeña: Firestore limita cada documento a 1 MiB.
export function resizeImageToBase64(file, { maxSize = 320, quality = 0.85 } = {}) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("El archivo seleccionado no es una imagen."));
            return;
        }

        const reader = new FileReader();

        reader.onerror = () => reject(new Error("No se pudo leer el archivo."));

        reader.onload = () => {
            const img = new Image();

            img.onerror = () => reject(new Error("No se pudo procesar la imagen."));

            img.onload = () => {
                let { width, height } = img;

                if (width > height && width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", quality));
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}
