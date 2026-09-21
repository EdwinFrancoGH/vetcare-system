/*require("dotenv").config();

const app = require("./app");//changed the path to `./app` and removed `src` because `server` is already inside `src`.

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});*/

import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});