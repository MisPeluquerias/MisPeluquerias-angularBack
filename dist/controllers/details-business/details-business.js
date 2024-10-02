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
const router = express_1.default.Router();
const db_1 = __importDefault(require("../../db/db"));
const bodyParser = require("body-parser");
router.use(bodyParser.json());
const decodeToken_1 = __importDefault(require("../../functions/decodeToken"));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id) {
            return res
                .status(400)
                .json({ error: "El parámetro 'zone' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Modificar la consulta para usar zip_code
        const query = `
      SELECT state, longitud, latitud, name, address, image,phone,email,hours_old,url
      FROM salon
      WHERE id_salon = ? 
    `;
        db_1.default.query(query, [id], (error, results) => {
            if (error) {
                console.error("Error al buscar el servicio:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar el servicio." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar el servicio." });
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
router.get("/loadReview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id) {
            return res
                .status(400)
                .json({ error: "El parámetro 'zone' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Modificar la consulta para usar zip_code
        const query = `
      SELECT id_review, id_user, observacion,qualification
      FROM review
      WHERE id_salon = ? 
    `;
        db_1.default.query(query, [id], (error, results) => {
            if (error) {
                console.error("Error al buscar el servicio:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar el servicio." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar el servicio." });
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
router.get("/getImagesAdmin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { salon_id } = req.query;
        if (!salon_id) {
            return res
                .status(400)
                .json({ error: "El parámetro 'zone' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Modificar la consulta para usar zip_code
        const query = `
      SELECT *
      FROM file
      WHERE salon_id = ? 
    `;
        db_1.default.query(query, [salon_id], (error, results) => {
            if (error) {
                console.error("Error al buscar el servicio:", error);
                return db_1.default.rollback(() => {
                    res
                        .status(500)
                        .json({ error: "Error al buscar las imagenes en el salon:" });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ error: "Error al buscar las imagenes en el salon:" });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar las imagenes en el salon:", err);
        res.status(500).json({ error: "Error al buscar las imagenes en el salon" });
    }
}));
router.get("/getScoreReviews", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id) {
            return res
                .status(400)
                .json({ error: "El parámetro 'salon_id' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Consulta para obtener promedios y total de reseñas
        const queryAvg = `
      SELECT 
        AVG(servicio) AS avg_servicio,
        AVG(calidad_precio) AS avg_calidad_precio,
        AVG(limpieza) AS avg_limpieza,
        AVG(puntualidad) AS avg_puntualidad,
        AVG(qualification) AS avg_qualification,
        COUNT(*) AS total_reviews
      FROM review
      WHERE id_salon = ?
    `;
        // Consulta adicional para obtener el número de cada calificación (1 a 5)
        const queryCount = `
     SELECT 
      COUNT(CASE WHEN qualification >= 1 AND qualification < 2 THEN 1 END) AS pesimo,
      COUNT(CASE WHEN qualification >= 2 AND qualification < 3 THEN 1 END) AS malo,
      COUNT(CASE WHEN qualification >= 3 AND qualification < 4 THEN 1 END) AS normal,
      COUNT(CASE WHEN qualification >= 4 AND qualification < 5 THEN 1 END) AS muy_bueno,
      COUNT(CASE WHEN qualification = 5 THEN 1 END) AS excelente,
      COUNT(*) AS total_reviews
      FROM review
      WHERE id_salon = ?
    `;
        // Ejecutar ambas consultas con conversión de tipos
        const [resultsAvg, resultsCount] = yield Promise.all([
            new Promise((resolve, reject) => {
                db_1.default.query(queryAvg, [id], (error, results) => {
                    if (error)
                        return reject(error);
                    resolve(results); // Conversión a any[]
                });
            }),
            new Promise((resolve, reject) => {
                db_1.default.query(queryCount, [id], (error, results) => {
                    if (error)
                        return reject(error);
                    resolve(results); // Conversión a any[]
                });
            }),
        ]);
        const rowAvg = resultsAvg[0];
        const rowCount = resultsCount[0];
        // Función para redondear a medios
        function redondearAMedios(numero) {
            return Math.round(numero * 2) / 2;
        }
        // Calcular los porcentajes de cada calificación
        if (rowCount && rowCount.total_reviews > 0) {
            const pesimo_percentage = (rowCount.pesimo / rowCount.total_reviews) * 100;
            const malo_percentage = (rowCount.malo / rowCount.total_reviews) * 100;
            const normal_percentage = (rowCount.normal / rowCount.total_reviews) * 100;
            const muy_bueno_percentage = (rowCount.muy_bueno / rowCount.total_reviews) * 100;
            const excelente_percentage = (rowCount.excelente / rowCount.total_reviews) * 100;
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al realizar commit." });
                    });
                }
                // Responder con ambas consultas
                res.json({
                    promedio_servicio: rowAvg.avg_servicio
                        ? rowAvg.avg_servicio.toFixed(2)
                        : "0.00",
                    promedio_calidad_precio: rowAvg.avg_calidad_precio
                        ? rowAvg.avg_calidad_precio.toFixed(2)
                        : "0.00",
                    promedio_limpieza: rowAvg.avg_limpieza
                        ? rowAvg.avg_limpieza.toFixed(2)
                        : "0.00",
                    promedio_puntualidad: rowAvg.avg_puntualidad
                        ? rowAvg.avg_puntualidad.toFixed(2)
                        : "0.00",
                    promedio_qualification: redondearAMedios(rowAvg.avg_qualification) || 0,
                    total_reviews: rowAvg.total_reviews || 0,
                    porcentajes: {
                        pesimo: pesimo_percentage.toFixed(2),
                        malo: malo_percentage.toFixed(2),
                        normal: normal_percentage.toFixed(2),
                        muy_bueno: muy_bueno_percentage.toFixed(2),
                        excelente: excelente_percentage.toFixed(2),
                    },
                });
            });
        }
        else {
            res
                .status(404)
                .json({ message: "No se encontraron valoraciones para el salón." });
        }
    }
    catch (err) {
        console.error("Error al buscar las valoraciones en el salón:", err);
        res
            .status(500)
            .json({ error: "Error al buscar las valoraciones en el salón." });
    }
}));
router.get("/getObservationReviews", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_salon } = req.query;
        const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
        const limit = parseInt(req.query.limit) || 2; // Cantidad de reseñas por página (por defecto 2)
        const offset = (page - 1) * limit; // Calcular el offset
        if (!id_salon) {
            return res
                .status(400)
                .json({ error: "El parámetro 'id_salon' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Consulta para contar el número total de reseñas (agregado)
        const totalQuery = `
      SELECT COUNT(*) AS total
      FROM review
      WHERE id_salon = ?
    `;
        // Ejecutar la consulta para obtener el total de reseñas
        const totalResult = yield new Promise((resolve, reject) => {
            db_1.default.query(totalQuery, [id_salon], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
        const total = totalResult[0].total; // Total de reseñas
        // Modificar la consulta para incluir paginación (LIMIT y OFFSET)
        const query = `
      SELECT *
      FROM review
      WHERE id_salon = ?
      LIMIT ? OFFSET ?
    `;
        db_1.default.query(query, [id_salon, limit, offset], (error, results) => {
            if (error) {
                console.error("Error al buscar las reseñas:", error);
                return db_1.default.rollback(() => {
                    res
                        .status(500)
                        .json({ error: "Error al buscar las reseñas en el salón." });
                });
            }
            // Verificar que results sea un array de RowDataPacket[]
            if (Array.isArray(results)) {
                // Mapear los resultados para agregar la recomendación basada en la calificación
                const modifiedResults = results.map((review) => {
                    // Solo procesamos si el objeto tiene la propiedad 'qualification'
                    if ("qualification" in review) {
                        // Función para determinar la recomendación basada en la calificación
                        let recommendation = "";
                        switch (parseInt(review.qualification, 10)) {
                            case 5:
                                recommendation = "Altamente Recomendado";
                                break;
                            case 4:
                                recommendation = "Muy Recomendado";
                                break;
                            case 3:
                                recommendation = "Recomendado";
                                break;
                            case 2:
                                recommendation = "Poco Recomendado";
                                break;
                            case 1:
                                recommendation = "No Recomendado";
                                break;
                            default:
                                recommendation = "Sin clasificación";
                        }
                        return Object.assign(Object.assign({}, review), { recommendation });
                    }
                    else {
                        // Manejo de caso donde no exista 'qualification'
                        return Object.assign(Object.assign({}, review), { recommendation: "Sin clasificación" });
                    }
                });
                db_1.default.commit((err) => {
                    if (err) {
                        console.error("Error al hacer commit:", err);
                        return db_1.default.rollback(() => {
                            res
                                .status(500)
                                .json({ error: "Error al confirmar la transacción." });
                        });
                    }
                    // Enviar la respuesta con la recomendación y el total de reseñas
                    res.json({
                        page, // Página actual
                        limit, // Límite por página
                        total, // Total de reseñas (nuevo campo)
                        results: modifiedResults, // Reseñas de la página actual
                    });
                });
            }
            else {
                // Manejo del caso donde los resultados no sean un array (posible OkPacket)
                console.error("Error: resultados no son un array.");
                res.status(500).json({ error: "Resultados no válidos." });
            }
        });
    }
    catch (err) {
        console.error("Error al buscar las reseñas en el salón:", err);
        res.status(500).json({ error: "Error al buscar las reseñas en el salón." });
    }
}));
router.post("/addReview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Usar req.body para obtener los datos enviados en el cuerpo de la solicitud
        const { id_user, id_salon, observacion, qualification, averageQualification, } = req.body;
        // Decodifica el token para obtener el usuarioId
        const usuarioId = (0, decodeToken_1.default)(id_user);
        if (!usuarioId) {
            return res.status(400).json({ error: "Token inválido o expirado." });
        }
        // Asegúrate de que qualification sea un objeto o un string parseable a objeto
        const { service, quality, cleanliness, speed } = JSON.parse(qualification);
        // Verificar que todos los campos requeridos estén presentes
        if (!id_salon ||
            !observacion ||
            !service ||
            !quality ||
            !cleanliness ||
            !speed) {
            return res
                .status(400)
                .json({ error: "Todos los campos son requeridos." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Insertar la reseña con las calificaciones individuales
        const query = `
      INSERT INTO review (id_user, id_salon, observacion, servicio, calidad_precio, limpieza, puntualidad, qualification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        db_1.default.query(query, [
            usuarioId,
            id_salon,
            observacion,
            service,
            quality,
            cleanliness,
            speed,
            averageQualification,
        ], (error, results) => {
            if (error) {
                console.error("Error al guardar la reseña:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al guardar la reseña." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Reseña guardada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al guardar la reseña:", err);
        res.status(500).json({ error: "Error al guardar la reseña." });
    }
}));
router.get("/loadFaq", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id) {
            return res
                .status(400)
                .json({ error: "El parámetro 'zone' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Modificar la consulta para usar zip_code
        const query = `
      SELECT id_faq, question, answer,visible_web
      FROM faq
      WHERE id_salon = ? 
    `;
        db_1.default.query(query, [id], (error, results) => {
            if (error) {
                console.error("Error al buscar el servicio:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar el servicio." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar el servicio." });
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
router.get("/getDescriptionSalon", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_salon } = req.query;
        if (!id_salon) {
            return res
                .status(400)
                .json({ error: "El parametro id_salon es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Modificar la consulta para usar zip_code
        const query = `
      SELECT about_us
      FROM salon
      WHERE id_salon = ? 
    `;
        db_1.default.query(query, [id_salon], (error, results) => {
            if (error) {
                console.error("Error al buscar el servicio:", error);
                return db_1.default.rollback(() => {
                    res
                        .status(500)
                        .json({ error: "Error al buscar la descripción del salón." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ error: "Error al buscar la descripcion del salón." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar la descripción del salón:", err);
        res
            .status(500)
            .json({ error: "Error al buscar la descripción del salón." });
    }
}));
router.post("/deleteReview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_review } = req.body;
        if (!id_review) {
            return res
                .status(400)
                .json({ error: "El parámetro 'id_review' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Eliminar la reseña
        const query = `DELETE FROM review WHERE id_review = ?`;
        db_1.default.query(query, [id_review], (error, results) => {
            if (error) {
                console.error("Error al eliminar la reseña:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al eliminar la reseña." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Reseña eliminada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al eliminar la reseña:", err);
        res.status(500).json({ error: "Error al eliminar la reseña." });
    }
}));
router.post("/updateReview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_review, observacion, qualification } = req.body;
        if (!id_review || !observacion || !qualification) {
            return res
                .status(400)
                .json({ error: "Todos los campos son requeridos." });
        }
        // Validar que `qualification` tenga las propiedades esperadas
        const { service, quality, cleanliness, speed } = qualification;
        if (typeof service !== "number" ||
            typeof quality !== "number" ||
            typeof cleanliness !== "number" ||
            typeof speed !== "number") {
            return res
                .status(400)
                .json({ error: "Los valores de calificación son inválidos." });
        }
        // Función para redondear a medios
        const redondearAMedios = (numero) => {
            return Math.round(numero * 2) / 2;
        };
        // Calcular el promedio de la calificación y redondearlo a medios
        const averageQualification = redondearAMedios((service + quality + cleanliness + speed) / 4);
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Actualizar la reseña en la base de datos con el promedio redondeado
        const query = `
      UPDATE review
      SET observacion = ?, servicio = ?, calidad_precio = ?, limpieza = ?, puntualidad = ?, qualification = ?
      WHERE id_review = ?
    `;
        // Ejecutar la consulta de actualización
        db_1.default.query(query, [
            observacion,
            service,
            quality,
            cleanliness,
            speed,
            averageQualification, // Guardar el promedio calculado y redondeado
            id_review,
        ], (error, results) => {
            if (error) {
                console.error("Error al actualizar la reseña:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al actualizar la reseña." });
                });
            }
            // Confirmar la transacción
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Reseña actualizada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al actualizar la reseña:", err);
        res.status(500).json({ error: "Error al actualizar la reseña." });
    }
}));
router.post("/saveFaq", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_user, id_salon, question } = req.body;
        if (!id_user || !id_salon || !question) {
            return res
                .status(400)
                .json({ error: "Todos los campos son requeridos." });
        }
        // Decodifica el token para obtener el usuarioId
        const usuarioId = (0, decodeToken_1.default)(id_user);
        if (!usuarioId) {
            return res.status(400).json({ error: "Token inválido o expirado." });
        }
        console.log("ID de usuario decodificado:", usuarioId);
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        const query = `
      INSERT INTO faq (id_user, id_salon, question)
      VALUES (?, ?, ?)
    `;
        db_1.default.query(query, [usuarioId, id_salon, question], (error, results) => {
            if (error) {
                console.error("Error al guardar la pregunta:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al guardar la pregunta." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Pregunta guardada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al guardar la pregunta:", err);
        res.status(500).json({ error: "Error al guardar la pregunta." });
    }
}));
// Endpoint para actualizar preguntas con respuestas
router.post("/updateQuestion", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_faq, answer } = req.body;
        if (!id_faq || !answer) {
            return res
                .status(400)
                .json({ error: "Todos los campos son requeridos." });
        }
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        const query = `
      UPDATE faq
      SET answer = ?
      WHERE id_faq = ?
    `;
        db_1.default.query(query, [answer, id_faq], (error, results) => {
            if (error) {
                console.error("Error al actualizar la pregunta:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al actualizar la pregunta." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Pregunta actualizada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al actualizar la pregunta:", err);
        res.status(500).json({ error: "Error al actualizar la pregunta." });
    }
}));
// Endpoint para eliminar preguntas
router.post("/deleteQuestion", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_faq } = req.body;
        if (!id_faq) {
            return res
                .status(400)
                .json({ error: "El parámetro 'id_faq' es requerido." });
        }
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        const query = `DELETE FROM faq WHERE id_faq = ?`;
        db_1.default.query(query, [id_faq], (error, results) => {
            if (error) {
                console.error("Error al eliminar la pregunta:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al eliminar la pregunta." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json({ message: "Pregunta eliminada exitosamente." });
            });
        });
    }
    catch (err) {
        console.error("Error al eliminar la pregunta:", err);
        res.status(500).json({ error: "Error al eliminar la pregunta." });
    }
}));
router.get("/getServicesSalon", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_salon } = req.query;
        if (!id_salon) {
            return res
                .status(400)
                .json({ error: "El parámetro 'id_salon' es requerido." });
        }
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        // Consulta para obtener los nombres de los servicios y los tipos de servicios relacionados por id_salon
        const query = `
      SELECT 
        sst.id_salon_service_type,
        sst.id_salon,
        sst.id_service,
        s.name AS service_name,
        sst.id_service_type,
        st.name AS service_type_name,
        sst.time,
        sst.active
      FROM 
        salon_service_type sst
      INNER JOIN 
        service s ON s.id_service = sst.id_service
      INNER JOIN 
        service_type st ON st.id_service_type = sst.id_service_type
      WHERE 
        sst.id_salon = ?
      ORDER BY 
        s.name, st.name;
    `;
        // Ejecutar la consulta
        db_1.default.query(query, [id_salon], (error, results) => {
            if (error) {
                console.error("Error al cargar los servicios y tipos de servicios:", error);
                return db_1.default.rollback(() => {
                    res
                        .status(500)
                        .json({
                        error: "Error al cargar los servicios y tipos de servicios.",
                    });
                });
            }
            // Asegúrate de que results es tratado como un arreglo de objetos
            const groupedServices = results.reduce((acc, service) => {
                const { service_name, service_type_name, time } = service;
                // Inicializa el array si el servicio no existe en el acumulador
                if (!acc[service_name]) {
                    acc[service_name] = [];
                }
                // Agrega el subservicio al servicio correspondiente
                acc[service_name].push({
                    subservice: service_type_name,
                    time,
                });
                return acc;
            }, {});
            // Confirmar la transacción
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ error: "Error al confirmar la transacción." });
                    });
                }
                // Devolver los resultados agrupados
                res.json(groupedServices);
            });
        });
    }
    catch (err) {
        console.error("Error al cargar los servicios y tipos de servicios:", err);
        res
            .status(500)
            .json({ error: "Error al cargar los servicios y tipos de servicios." });
    }
}));
exports.default = router;
