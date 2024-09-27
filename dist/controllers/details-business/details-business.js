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
      SELECT longitud, latitud, name, address, image,phone,email,hours_old,url
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
router.get("/getReviews", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
      FROM review
      WHERE id_salon = ? 
    `;
        db_1.default.query(query, [salon_id], (error, results) => {
            if (error) {
                console.error("Error al buscar las valoraciones:", error);
                return db_1.default.rollback(() => {
                    res
                        .status(500)
                        .json({ error: "Error al buscar las valoracioens en el salon:" });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ error: "Error al buscar las valoraciones en el salon:" });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar las valoraciones en el salon:", err);
        res.status(500).json({ error: "Error al buscar las valoracioens en el salon" });
    }
}));
router.post("/addReview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Usar req.body para obtener los datos enviados en el cuerpo de la solicitud
        const { id_user, id_salon, observacion, qualification } = req.body;
        // Decodifica el token para obtener el usuarioId
        const usuarioId = (0, decodeToken_1.default)(id_user);
        if (!usuarioId) {
            return res.status(400).json({ error: "Token inválido o expirado." });
        }
        // Asegúrate de que qualification sea un objeto o un string parseable a objeto
        const { service, quality, cleanliness, speed } = JSON.parse(qualification);
        // Verificar que todos los campos requeridos estén presentes
        if (!id_salon || !observacion || !service || !quality || !cleanliness || !speed) {
            return res.status(400).json({ error: "Todos los campos son requeridos." });
        }
        // Agregar un console.log para ver los datos recibidos y el usuarioId decodificado
        console.log("Datos recibidos en el servidor:", {
            id_user,
            id_salon,
            observacion,
            service,
            quality,
            cleanliness,
            speed,
        });
        console.log(`ID de usuario decodificado: ${usuarioId}`);
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
      INSERT INTO review (id_user, id_salon, observacion, servicio, calidad_precio, limpieza, puntualidad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        db_1.default.query(query, [usuarioId, id_salon, observacion, service, quality, cleanliness, speed], (error, results) => {
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
                    res.status(500).json({ error: "Error al buscar la descripción del salón." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar la descripcion del salón." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar la descripción del salón:", err);
        res.status(500).json({ error: "Error al buscar la descripción del salón." });
    }
}));
/*

router.get("/loadServices", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "El parámetro 'zone' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Modificar la consulta para usar zip_code
    const query = `
      SELECT name
      FROM service
      WHERE id_salon = ?
    `;

    connection.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al buscar el servicio:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar el servicio." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar el servicio." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});
;

*/
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
        const { id_review, id_user, observacion, qualification } = req.body;
        // Agregar un console.log para ver los datos recibidos
        console.log("Datos recibidos en el servidor para actualizar:", {
            id_review,
            id_user,
            observacion,
            qualification,
        });
        if (!id_review || !id_user || !observacion || !qualification) {
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
        // Actualizar la reseña sin modificar el id_salon
        const query = `
      UPDATE review
      SET id_user = ?, observacion = ?, qualification = ?
      WHERE id_review = ?
    `;
        db_1.default.query(query, [id_user, observacion, qualification, id_review], (error, results) => {
            if (error) {
                console.error("Error al actualizar la reseña:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al actualizar la reseña." });
                });
            }
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
            return res.status(400).json({ error: "El parámetro 'id_salon' es requerido." });
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
                    res.status(500).json({ error: "Error al cargar los servicios y tipos de servicios." });
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
                        res.status(500).json({ error: "Error al confirmar la transacción." });
                    });
                }
                // Devolver los resultados agrupados
                res.json(groupedServices);
            });
        });
    }
    catch (err) {
        console.error("Error al cargar los servicios y tipos de servicios:", err);
        res.status(500).json({ error: "Error al cargar los servicios y tipos de servicios." });
    }
}));
exports.default = router;
