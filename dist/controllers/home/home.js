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
router.get("/getSalonValidated", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(null);
            });
        });
        const query = `
      SELECT *
      FROM salon
      WHERE state = 'Validado'
      ORDER BY RAND()
      LIMIT 10
    `;
        db_1.default.query(query, (error, results) => {
            if (error) {
                console.error("Error al buscar los salones validados:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar los salones validados." });
                });
            }
            const rows = results;
            // Obtener el día y hora actuales
            const currentDay = new Date().toLocaleString('es-ES', { weekday: 'long' });
            const currentTime = new Date();
            function isOpen(hoursOld, currentDay, currentTime) {
                const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                // Verificar si `hoursOld`, `currentDay` o `currentTime` son nulos o indefinidos
                if (!hoursOld || !currentDay || !currentTime) {
                    return false;
                }
                // Convertir currentDay a índice numérico si se pasa como texto
                const dayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
                // Validación del índice de currentDay
                if (dayIndex === -1)
                    return false;
                const currentDayFormatted = daysOfWeek[dayIndex];
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
                    if (hours && hours !== 'Cerrado') {
                        const timeRanges = hours.split(',').map((range) => range.trim());
                        for (const range of timeRanges) {
                            const [aperturaStr, cierreStr] = range.split('-').map((time) => time && time.trim());
                            if (aperturaStr && cierreStr) {
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
                return false; // Si no hay horarios o está cerrado
            }
            // Procesar los resultados para agregar el estado de apertura/cierre
            const processedResults = rows.map((salon) => {
                const is_open = isOpen(salon.hours_old, currentDay, currentTime);
                return Object.assign(Object.assign({}, salon), { is_open });
            });
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al hacer commit." });
                    });
                }
                res.json(processedResults); // Enviar los resultados procesados con `is_open`
            });
        });
    }
    catch (err) {
        console.error("Error al buscar los salones validados:", err);
        res.status(500).json({ error: "Error al buscar los salones validados." });
    }
}));
exports.default = router;
