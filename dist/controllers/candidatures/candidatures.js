"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../../db/db"));
const body_parser_1 = __importDefault(require("body-parser"));
const token_1 = __importDefault(require("../../token/token"));
const decodeToken_1 = __importDefault(require("../../functions/decodeToken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
router.get("/getCandidaturesByIdUser", token_1.default, (req, res) => {
    const { id_user } = req.query;
    if (!id_user) {
        return res.status(400).json({ error: "id_user is required" });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
    }
    catch (err) {
        console.error("Error decoding token:", err);
        return res.status(400).json({ error: "Invalid token" });
    }
    if (!decodedIdUser) {
        return res.status(400).json({ error: "Invalid decoded user ID" });
    }
    const query = `
    SELECT 
        ujs.id_user_job_subscriptions,
        ujs.id_job_offer,
        ujs.id_user,
        ujs.id_salon,
        s.name AS salon_name,
        ujs.work_presentation,
        ujs.path_curriculum,
        ujs.privacy_policy,
        ujs.date_subscriptions,
        jo.category,
        jo.subcategory,
        jo.description,
        jo.date_job_offer,
        jo.requirements,
        jo.img_job_path,
        jo.salary
    FROM 
        user_job_subscriptions ujs
    JOIN 
        jobs_offers jo
    ON 
        ujs.id_job_offer = jo.id_job_offer
    JOIN 
        salon s
    ON 
        ujs.id_salon = s.id_salon
    WHERE 
        ujs.id_user = ?;
`;
    db_1.default.query(query, [decodedIdUser], (error, results) => {
        if (error) {
            console.error("Query error:", error);
            return res.status(500).json({ error: "Failed to retrieve candidatures" });
        }
        return res.status(200).json(results);
    });
});
router.delete('/delete/:id_user_job_subscriptions', (req, res) => {
    const { id_user_job_subscriptions } = req.params;
    // Validar el ID
    if (!id_user_job_subscriptions || isNaN(Number(id_user_job_subscriptions))) {
        return res.status(400).json({ message: "ID de la oferta no válido." });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error al iniciar la transacción:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        // Primero obtenemos las rutas de los currículos asociados a las suscripciones
        const selectSubscriptionsQuery = "SELECT path_curriculum FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";
        db_1.default.query(selectSubscriptionsQuery, [id_user_job_subscriptions], (selectErr, subscriptions) => {
            if (selectErr) {
                console.error("Error al obtener las suscripciones:", selectErr);
                return db_1.default.rollback(() => {
                    res.status(500).json({ message: "Error interno del servidor." });
                });
            }
            // Verificar que se obtuvieron suscripciones
            if (!subscriptions || subscriptions.length === 0) {
                console.warn("No hay suscripciones asociadas a la oferta.");
            }
            else {
                // Eliminar físicamente los archivos de los currículos
                subscriptions.forEach((subscription) => {
                    if (subscription.path_curriculum) {
                        // Obtener solo el nombre del archivo
                        const fileName = path_1.default.basename(subscription.path_curriculum);
                        // Construir la ruta física del archivo
                        const curriculumPath = path_1.default.join(__dirname, "../../../dist/uploads-curriculums", fileName);
                        fs_1.default.unlink(curriculumPath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error al eliminar el archivo:", curriculumPath, unlinkErr);
                            }
                            else {
                                console.log(`Archivo eliminado: ${curriculumPath}`);
                            }
                        });
                    }
                    else {
                        console.warn("No se encontró la ruta del archivo para esta suscripción.");
                    }
                });
            }
            // Luego eliminamos las suscripciones asociadas
            const deleteSubscriptionsQuery = "DELETE FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";
            db_1.default.query(deleteSubscriptionsQuery, [id_user_job_subscriptions], (deleteSubsErr, subsResult) => {
                if (deleteSubsErr) {
                    console.error("Error al eliminar las suscripciones:", deleteSubsErr);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ message: "Error interno del servidor." });
                    });
                }
                // Confirmar la transacción
                db_1.default.commit((commitErr) => {
                    if (commitErr) {
                        console.error("Error al confirmar la transacción:", commitErr);
                        return db_1.default.rollback(() => {
                            res.status(500).json({ message: "Error interno del servidor." });
                        });
                    }
                    return res.status(200).json({
                        message: "Oferta de empleo y suscripciones eliminadas con éxito.",
                    });
                });
            });
        });
    });
});
router.delete('/deleteCandidatureFromAdmin/:id_user_job_subscriptions', (req, res) => {
    const { id_user_job_subscriptions } = req.params;
    // Validar el ID
    if (!id_user_job_subscriptions || isNaN(Number(id_user_job_subscriptions))) {
        return res.status(400).json({ message: "ID de la oferta no válido." });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error al iniciar la transacción:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        // Primero obtenemos las rutas de los currículos asociados a las suscripciones
        const selectSubscriptionsQuery = "SELECT path_curriculum FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";
        db_1.default.query(selectSubscriptionsQuery, [id_user_job_subscriptions], (selectErr, subscriptions) => {
            if (selectErr) {
                console.error("Error al obtener las suscripciones:", selectErr);
                return db_1.default.rollback(() => {
                    res.status(500).json({ message: "Error interno del servidor." });
                });
            }
            // Verificar que se obtuvieron suscripciones
            if (!subscriptions || subscriptions.length === 0) {
                console.warn("No hay suscripciones asociadas a la oferta.");
            }
            else {
                // Eliminar físicamente los archivos de los currículos
                subscriptions.forEach((subscription) => {
                    if (subscription.path_curriculum) {
                        // Obtener solo el nombre del archivo
                        const fileName = path_1.default.basename(subscription.path_curriculum);
                        // Construir la ruta física del archivo
                        const curriculumPath = path_1.default.join(__dirname, "../../../dist/uploads-curriculums", fileName);
                        fs_1.default.unlink(curriculumPath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error al eliminar el archivo:", curriculumPath, unlinkErr);
                            }
                            else {
                                console.log(`Archivo eliminado: ${curriculumPath}`);
                            }
                        });
                    }
                    else {
                        console.warn("No se encontró la ruta del archivo para esta suscripción.");
                    }
                });
            }
            // Luego eliminamos las suscripciones asociadas
            const deleteSubscriptionsQuery = "DELETE FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";
            db_1.default.query(deleteSubscriptionsQuery, [id_user_job_subscriptions], (deleteSubsErr, subsResult) => {
                if (deleteSubsErr) {
                    console.error("Error al eliminar las suscripciones:", deleteSubsErr);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ message: "Error interno del servidor." });
                    });
                }
                // Confirmar la transacción
                db_1.default.commit((commitErr) => {
                    if (commitErr) {
                        console.error("Error al confirmar la transacción:", commitErr);
                        return db_1.default.rollback(() => {
                            res.status(500).json({ message: "Error interno del servidor." });
                        });
                    }
                    return res.status(200).json({
                        message: "Oferta de empleo y suscripciones eliminadas con éxito.",
                    });
                });
            });
        });
    });
});
router.delete("/deleteJobOffer/:id_job_offer", (req, res) => {
    const { id_job_offer } = req.params;
    // Validar el ID
    if (!id_job_offer || isNaN(Number(id_job_offer))) {
        return res.status(400).json({ message: "ID de la oferta no válido." });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error al iniciar la transacción:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        // Primero obtenemos las rutas de los currículos asociados a las suscripciones
        const selectSubscriptionsQuery = "SELECT path_curriculum FROM user_job_subscriptions WHERE id_job_offer = ?";
        db_1.default.query(selectSubscriptionsQuery, [id_job_offer], (selectErr, subscriptions) => {
            if (selectErr) {
                console.error("Error al obtener las suscripciones:", selectErr);
                return db_1.default.rollback(() => {
                    res.status(500).json({ message: "Error interno del servidor." });
                });
            }
            // Verificar que se obtuvieron suscripciones
            if (!subscriptions || subscriptions.length === 0) {
                console.warn("No hay suscripciones asociadas a la oferta.");
            }
            else {
                // Eliminar físicamente los archivos de los currículos
                subscriptions.forEach((subscription) => {
                    if (subscription.path_curriculum) {
                        // Obtener solo el nombre del archivo
                        const fileName = path_1.default.basename(subscription.path_curriculum);
                        // Construir la ruta física del archivo
                        const curriculumPath = path_1.default.join(__dirname, "../uploads/curriculums", fileName);
                        fs_1.default.unlink(curriculumPath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error al eliminar el archivo:", curriculumPath, unlinkErr);
                            }
                            else {
                                console.log(`Archivo eliminado: ${curriculumPath}`);
                            }
                        });
                    }
                    else {
                        console.warn("No se encontró la ruta del archivo para esta suscripción.");
                    }
                });
            }
            // Luego eliminamos las suscripciones asociadas
            const deleteSubscriptionsQuery = "DELETE FROM user_job_subscriptions WHERE id_job_offer = ?";
            db_1.default.query(deleteSubscriptionsQuery, [id_job_offer], (deleteSubsErr, subsResult) => {
                if (deleteSubsErr) {
                    console.error("Error al eliminar las suscripciones:", deleteSubsErr);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ message: "Error interno del servidor." });
                    });
                }
                // Finalmente eliminamos la oferta de empleo
                const deleteOfferQuery = "DELETE FROM jobs_offers WHERE id_job_offer = ?";
                db_1.default.query(deleteOfferQuery, [id_job_offer], (deleteOfferErr, result) => {
                    if (deleteOfferErr) {
                        console.error("Error al eliminar la oferta de empleo:", deleteOfferErr);
                        return db_1.default.rollback(() => {
                            res.status(500).json({ message: "Error interno del servidor." });
                        });
                    }
                    if (result.affectedRows === 0) {
                        return db_1.default.rollback(() => {
                            res.status(404).json({ message: "Oferta de empleo no encontrada." });
                        });
                    }
                    // Confirmar la transacción
                    db_1.default.commit((commitErr) => {
                        if (commitErr) {
                            console.error("Error al confirmar la transacción:", commitErr);
                            return db_1.default.rollback(() => {
                                res.status(500).json({ message: "Error interno del servidor." });
                            });
                        }
                        return res.status(200).json({
                            message: "Oferta de empleo y suscripciones eliminadas con éxito.",
                        });
                    });
                });
            });
        });
    });
});
exports.default = router;
