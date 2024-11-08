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
const router = express_1.default.Router();
router.post('/newContact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, msg, state = 'Pendiente', term_cond } = req.body;
    db_1.default.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }
        // Inserción del contacto
        db_1.default.query(`
      INSERT INTO contact (name, email, phone, text, state, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW());
      `, [name, email, phone, msg, state, term_cond], (err, results) => {
            if (err) {
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: 'Error al insertar el contacto' });
                });
            }
            const contactId = results.insertId;
            // Inserción de la alerta en la tabla alert_admin
            const alertText = `Nuevo contacto: ${name}`;
            const alertUrl = `/contact`;
            db_1.default.query(`
          INSERT INTO alert_admin (text, url, showed, created_at)
          VALUES (?, ?, 0, NOW());
          `, [alertText, alertUrl], (err, alertResults) => {
                if (err) {
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: 'Error al insertar la alerta' });
                    });
                }
                // Confirmar la transacción
                db_1.default.commit((err) => {
                    if (err) {
                        return db_1.default.rollback(() => {
                            res.status(500).json({ error: 'Error al confirmar la transacción' });
                        });
                    }
                    // Emitir evento de Socket.IO para notificar al frontend
                    if (req.io) {
                        req.io.emit('new-alert', {
                            message: alertText,
                            url: alertUrl,
                            alertId: alertResults.insertId,
                        });
                    }
                    else {
                        console.error("Socket.IO no está disponible en req");
                    }
                    res.status(201).json({
                        message: 'Contacto y alerta añadidos exitosamente',
                        contactId,
                    });
                });
            });
        });
    });
}));
exports.default = router;
