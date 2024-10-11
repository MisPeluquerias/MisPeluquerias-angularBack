"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../../db/db"));
const body_parser_1 = __importDefault(require("body-parser"));
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
router.get("/searchByCityById", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_city } = req.query;
        if (!id_city) {
            return res
                .status(400)
                .json({ error: "El parámetro 'id_city' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Consulta con INNER JOIN para obtener los salones de ciudades con el mismo nombre
        const query = `
      SELECT s.id_salon, s.longitud, s.latitud, s.name, s.address, s.image
      FROM salon s
      INNER JOIN city c ON s.id_city = c.id_city
      WHERE c.name = (
        SELECT name
        FROM city
        WHERE id_city = ?
      )
    `;
        db_1.default.query(query, [id_city], (error, results) => {
            if (error) {
                console.error("Error al buscar los salones:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar los salones." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar el servicio:", err);
        res.status(500).json({ error: "Error al buscar el servicio." });
    }
}));
router.get("/searchByCityAndCategory", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_city, categoria } = req.query;
        if (!id_city || !categoria) {
            return res
                .status(400)
                .json({ error: "Los parámetros 'id_city' y 'categoria' son requeridos." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Consulta con INNER JOIN para obtener los salones en la ciudad específica y la categoría deseada
        const query = `
      SELECT s.id_salon, s.longitud, s.latitud, s.name, s.address, s.image
      FROM salon s
      INNER JOIN city c ON s.id_city = c.id_city
      INNER JOIN categories cat ON s.id_salon = cat.id_salon
      WHERE c.name = (
        SELECT name
        FROM city
        WHERE id_city = ?
      )
      AND cat.categories = ?
    `;
        db_1.default.query(query, [id_city, categoria], (error, results) => {
            if (error) {
                console.error("Error al buscar los salones:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar los salones." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar el servicio:", err);
        res.status(500).json({ error: "Error al buscar el servicio." });
    }
}));
router.get("/searchByCityName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.query;
        if (!name) {
            return res
                .status(400)
                .json({ error: "El parámetro 'name' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        const getSalonsQuery = `
      SELECT s.id_salon, s.longitud, s.latitud, s.name, s.address, s.image
      FROM salon s
      INNER JOIN city ON s.id_city = city.id_city
      INNER JOIN province ON city.id_province = province.id_province
      WHERE province.name = ?
      AND s.longitud IS NOT NULL
      AND s.latitud IS NOT NULL`;
        db_1.default.query(getSalonsQuery, [name], (error, salonResults) => {
            if (error) {
                console.error("Error al buscar los salones:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar los salones." });
                });
            }
            if (!Array.isArray(salonResults) || salonResults.length === 0) {
                return res
                    .status(404)
                    .json({
                    error: "No se encontraron salones en la provincia proporcionada.",
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({
                    salons: salonResults
                });
            });
        });
    }
    catch (err) {
        console.error("Error al buscar el servicio:", err);
        res.status(500).json({ error: "Error al buscar el servicio." });
    }
}));
router.get("/searchByName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: "El parámetro 'name' es requerido." });
    }
    try {
        const getSalonsByNameQuery = `
      SELECT id_salon, longitud, latitud, name, address, image 
      FROM salon
      WHERE name LIKE ?
    `;
        const searchName = `%${name}%`;
        db_1.default.query(getSalonsByNameQuery, [searchName], (error, results) => {
            if (error) {
                console.error("Error al buscar los salones por nombre:", error);
                return res
                    .status(500)
                    .json({ error: "Error al buscar los salones por nombre." });
            }
            if (results.length === 0) {
                return res
                    .status(404)
                    .json({
                    error: "No se encontraron salones con el nombre proporcionado.",
                });
            }
            res.json(results);
        });
    }
    catch (err) {
        console.error("Error al buscar el servicio:", err);
        res.status(500).json({ error: "Error al buscar el servicio." });
    }
}));
router.get("/searchSalonByService", (req, res) => {
    const { id_city, name, province_name } = req.query;
    console.log('Id de la ciudad:', id_city, 'Nombre del subservicio:', name, 'Nombre de la provincia:', province_name);
    const query = `
    SELECT s.id_salon, s.name, s.latitud, s.longitud, s.address, s.image, c.name AS city_name, st.name AS subservice_name, p.name AS province_name
    FROM salon s
    INNER JOIN salon_service_type sst ON s.id_salon = sst.id_salon
    INNER JOIN service_type st ON sst.id_service_type = st.id_service_type
    INNER JOIN city c ON s.id_city = c.id_city
    INNER JOIN province p ON c.id_province = p.id_province
    WHERE st.name LIKE ? AND (c.id_city = ? OR p.name LIKE ?)
  `;
    // Iniciar la transacción
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error iniciando la transacción:", err);
            return res.status(500).send("Error en el servidor.");
        }
        // Ejecutar la consulta
        db_1.default.query(query, [`%${name}%`, id_city, `%${province_name}%`], (err, results) => {
            if (err) {
                console.error("Error ejecutando la consulta:", err);
                // Si hay un error, hacer un rollback
                return db_1.default.rollback(() => {
                    res.status(500).send("Error en el servidor.");
                });
            }
            // Si todo sale bien, hacer commit
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error haciendo commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).send("Error en el servidor.");
                    });
                }
                // Enviar los resultados si el commit es exitoso
                res.json(results);
                console.log('Resultados devueltos:', results);
            });
        });
    });
});
exports.default = router;
