import "dotenv/config";
import app from "./app.js";

// Puerto único de la versión integrada: 5000 (el que ya usaba tu versión
// estable de citas/historial). Si tu backend anterior de ventas usaba 5001,
// actualiza NEXT_PUBLIC_API_URL en el frontend o define PORT=5001 aquí.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
