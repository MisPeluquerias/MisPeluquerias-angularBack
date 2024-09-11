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
router.post('/newContactProffesional', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, msg, term_cond } = req.body;
    // Usando una transacción con una conexión existente
    db_1.default.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }
        db_1.default.query(`
      INSERT INTO contact_proffesional (name, email, phone, text, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `, [name, email, phone, msg, term_cond], (err, results) => {
            if (err) {
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: 'Error al insertar el contacto' });
                });
            }
            // Si todo está bien, confirmar la transacción
            db_1.default.commit((err) => {
                if (err) {
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: 'Error al confirmar la transacción' });
                    });
                }
                res.status(201).json({
                    message: 'Contacto añadido exitosamente',
                    contactId: results.insertId,
                });
            });
        });
    });
}));
exports.default = router;
