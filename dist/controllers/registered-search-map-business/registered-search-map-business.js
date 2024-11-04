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
const token_1 = __importDefault(require("../../token/token"));
const decodeToken_1 = __importDefault(require("../../functions/decodeToken"));
router.get("/chargeMarkersAndCard", token_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { northEastLat, northEastLng, southWestLat, southWestLng, status, statusCategory } = req.query;
    const { id_user } = req.query;
    //console.log('Estado recibido:', status);
    //console.log('Categoría recibida:', statusCategory);
    if (!id_user) {
        return res.status(400).json({ error: "User ID is required" });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
    }
    catch (err) {
        console.error("Error al decodificar el token:", err);
        return res.status(400).json({ error: "Invalid token" });
    }
    try {
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err) {
                    console.error("Error al iniciar la transacción:", err);
                    return reject(err);
                }
                resolve(undefined);
            });
        });
        // Consulta base
        let query = `
            SELECT salon.id_salon, salon.longitud, salon.latitud, salon.name, salon.address, salon.image,
                   salon.hours_old, 
                   GROUP_CONCAT(categories.categories SEPARATOR ', ') AS categories,
                   user_favourite.id_user_favourite, 
                   IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite
            FROM salon
            LEFT JOIN user_favourite ON salon.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?
            LEFT JOIN categories ON salon.id_salon = categories.id_salon
            WHERE salon.latitud BETWEEN ? AND ? AND salon.longitud BETWEEN ? AND ?
        `;
        // Parámetros de la consulta
        const queryParams = [decodedIdUser, southWestLat, northEastLat, southWestLng, northEastLng];
        // Condición adicional si `statusCategory` está definido
        if (statusCategory) {
            query += ` AND categories.categories = ?`;
            queryParams.push(statusCategory);
        }
        // Finaliza la consulta con el GROUP BY
        query += ` GROUP BY salon.id_salon`;
        db_1.default.query(query, queryParams, (error, results) => {
            if (error) {
                console.error("Error en la consulta SQL:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al realizar la consulta." });
                });
            }
            const rows = results;
            const currentDay = new Date().toLocaleString('es-ES', { weekday: 'long' });
            const currentTime = new Date();
            function isOpen(hoursOld, currentDay, currentTime) {
                const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                if (!hoursOld) {
                    return false;
                }
                if (typeof currentDay === 'string') {
                    currentDay = daysOfWeek.indexOf(currentDay.toLowerCase());
                }
                if (typeof currentDay !== 'number' || currentDay < 0 || currentDay > 6) {
                    return false;
                }
                const currentDayFormatted = daysOfWeek[currentDay].toLowerCase();
                const dayMap = new Map();
                const days = hoursOld.split(';');
                days.forEach((dayEntry) => {
                    const [day, ...hoursArr] = dayEntry.split(':');
                    const hours = hoursArr.join(':').trim();
                    if (day && hours) {
                        dayMap.set(day.trim().toLowerCase(), hours);
                    }
                });
                if (dayMap.has(currentDayFormatted)) {
                    const hours = dayMap.get(currentDayFormatted);
                    if (hours && hours !== 'Cerrado' && hours.trim() !== '') {
                        const timeRanges = hours.split(',').map((range) => range.trim());
                        for (const range of timeRanges) {
                            const parts = range.split('-').map((time) => time && time.trim());
                            if (parts.length !== 2)
                                continue;
                            const [aperturaStr, cierreStr] = parts;
                            if (aperturaStr && cierreStr && /^\d{2}:\d{2}$/.test(aperturaStr) && /^\d{2}:\d{2}$/.test(cierreStr)) {
                                const [aperturaHora, aperturaMin] = aperturaStr.split(':').map(Number);
                                const [cierreHora, cierreMin] = cierreStr.split(':').map(Number);
                                const apertura = new Date(currentTime);
                                apertura.setHours(aperturaHora, aperturaMin, 0);
                                const cierre = new Date(currentTime);
                                cierre.setHours(cierreHora, cierreMin, 0);
                                if (currentTime >= apertura && currentTime <= cierre) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }
            // Procesar los resultados para agregar el estado de apertura/cierre y aplicar el filtro de estado si es necesario
            const processedResults = rows
                .map(salon => {
                const is_open = isOpen(salon.hours_old, currentDay, currentTime);
                return Object.assign(Object.assign({}, salon), { is_open });
            })
                .filter(salon => {
                if (status === 'true') {
                    return salon.is_open === true;
                }
                else if (status === 'false') {
                    return salon.is_open === false;
                }
                return true; // Si no hay filtro de estado, devolver todos
            });
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al realizar la consulta." });
                    });
                }
                res.json(processedResults);
            });
        });
    }
    catch (err) {
        console.error("Error al realizar la consulta:", err);
        res.status(500).json({ error: "Error al realizar la consulta." });
    }
}));
router.delete('/delete-favorite/:id_user_favorite', token_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_user_favorite } = req.params;
    if (!id_user_favorite) {
        return res.status(400).json({ error: 'id_user_favorite parameter is required' });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: 'Failed to start transaction' });
        }
        const query = 'DELETE FROM user_favourite WHERE id_user_favourite = ?';
        db_1.default.query(query, [id_user_favorite], (error, results) => {
            if (error) {
                return db_1.default.rollback(() => {
                    console.error('Delete error:', error);
                    return res.status(500).json({ error: 'Failed to delete favorite' });
                });
            }
            if (results.affectedRows === 0) {
                return db_1.default.rollback(() => {
                    console.error('No rows affected');
                    return res.status(404).json({ error: 'Favorite not found' });
                });
            }
            db_1.default.commit((commitErr) => {
                if (commitErr) {
                    return db_1.default.rollback(() => {
                        console.error('Commit error:', commitErr);
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    });
                }
                return res.status(200).json({
                    message: 'Favorite deleted successfully',
                });
            });
        });
    });
}));
router.get("/getFilterCategories", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    db_1.default.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error starting transaction",
                error: err,
            });
        }
        // Usar DISTINCT para seleccionar solo servicios únicos por nombre
        const query = "SELECT DISTINCT categories FROM categories";
        db_1.default.query(query, (err, results) => {
            if (err) {
                return db_1.default.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: "Error fetching categories",
                        error: err,
                    });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    return db_1.default.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: "Error committing transaction",
                            error: err,
                        });
                    });
                }
                res.json(results);
            });
        });
    });
}));
exports.default = router;
