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
router.post("/newContactProffesional", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, msg, salon_name, id_province, id_city, address, state = "Pendiente", term_cond, } = req.body;
    // Usando una transacción con una conexión existente
    db_1.default.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: "Error al iniciar la transacción" });
        }
        db_1.default.query(`
      INSERT INTO contact_proffesional (name, email, phone, text,salon_name,id_province,id_city,address, state, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
      `, [name, email, phone, msg, salon_name, id_province, id_city, address, state, term_cond], (err, results) => {
            if (err) {
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al insertar el contacto" });
                });
            }
            const contactId = results.insertId;
            // Inserción de la alerta en la tabla alert_admin
            const alertText = `Nuevo contacto profesional: ${name}`;
            const alertUrl = `/contact-proffesional`;
            db_1.default.query(`
           INSERT INTO alert_admin (text, url, showed, created_at)
           VALUES (?, ?, 0, NOW());
           `, [alertText, alertUrl], (err, alertResults) => {
                if (err) {
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: 'Error al insertar la alerta' });
                    });
                }
                // Si todo está bien, confirmar la transacción
                db_1.default.commit((err) => {
                    if (err) {
                        return db_1.default.rollback(() => {
                            res
                                .status(500)
                                .json({ error: "Error al confirmar la transacción" });
                        });
                    }
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
                        message: "Contacto añadido exitosamente",
                        contactId: results.insertId,
                    });
                });
            });
        });
    });
}));
router.get("/getCitiesByProvince", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id_province = req.query.id_province;
    if (!id_province) {
        return res.status(400).json({ error: "id_province is required" });
    }
    const query = `
      SELECT 
        p.name as province_name,
        c.id_city,
        c.name as city_name,
        c.zip_code
      FROM 
        province p
      JOIN 
        city c ON p.id_province = c.id_province
      WHERE 
        p.id_province = ? 
      ORDER BY c.name;
    `;
    //desde git
    db_1.default.query(query, [id_province], (queryError, results) => {
        if (queryError) {
            console.error("Error fetching cities and province:", queryError);
            return res.status(500).json({
                error: "An error occurred while fetching the city and province data",
            });
        }
        res.json({ data: results });
    });
}));
router.get("/getProvinces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT id_province, name FROM province ORDER BY name`;
    db_1.default.query(query, (queryError, results) => {
        if (queryError) {
            console.error("Error fetching provinces:", queryError);
            return res
                .status(500)
                .json({ error: "An error occurred while fetching the provinces" });
        }
        res.json({ data: results });
    });
}));
exports.default = router;
