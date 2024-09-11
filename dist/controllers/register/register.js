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
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, lastname, birth_date, phone, email, dni, address, password, id_city, id_province } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        const usuario = { name, lastname, birth_date, phone, email, dni, address, password: hashedPassword, id_city, id_province };
        // Iniciar la transacción
        db_1.default.beginTransaction((err) => {
            if (err) {
                console.error('Error al iniciar la transacción:', err);
                return res.status(500).json({ message: 'Error al iniciar la transacción' });
            }
            // Insertar el usuario en la base de datos
            const query = `INSERT INTO user SET ?`;
            db_1.default.query(query, usuario, (error, results) => {
                if (error) {
                    console.error('Error al insertar el usuario:', error);
                    if (error.code === 'ER_DUP_ENTRY') {
                        return db_1.default.rollback(() => {
                            res.status(400).json({ message: 'El correo electrónico ya está registrado' });
                        });
                    }
                    else {
                        return db_1.default.rollback(() => {
                            res.status(500).json({ message: 'Error al insertar el usuario' });
                        });
                    }
                }
                // Confirmar la transacción
                db_1.default.commit((err) => {
                    if (err) {
                        console.error('Error al confirmar la transacción:', err);
                        return db_1.default.rollback(() => {
                            res.status(500).json({ message: 'Error al confirmar la transacción' });
                        });
                    }
                    res.json({ message: 'Usuario registrado correctamente' });
                });
            });
        });
    }
    catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}));
router.get("/searchCity", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const query = "SELECT * FROM city WHERE name LIKE ? LIMIT 5";
        db_1.default.query(query, [`%${name}%`], (error, results) => {
            if (error) {
                console.error("Error al buscar la ciudad:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar la ciudad." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar la ciudad." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar la ciudad:", err);
        res.status(500).json({ error: "Error al buscar la ciudad." });
    }
}));
router.get("/searchProvince", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const query = "SELECT * FROM province WHERE name LIKE ? LIMIT 5";
        db_1.default.query(query, [`%${name}%`], (error, results) => {
            if (error) {
                console.error("Error al buscar la ciudad:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar la ciudad." });
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error al hacer commit:", err);
                    return db_1.default.rollback(() => {
                        res.status(500).json({ error: "Error al buscar la ciudad." });
                    });
                }
                res.json(results);
            });
        });
    }
    catch (err) {
        console.error("Error al buscar la ciudad:", err);
        res.status(500).json({ error: "Error al buscar la ciudad." });
    }
}));
router.get("/getProvinces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT id_province, name FROM province`;
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
        p.id_province = ?;
    `;
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
exports.default = router;
