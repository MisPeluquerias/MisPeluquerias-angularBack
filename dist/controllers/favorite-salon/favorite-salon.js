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
const db_1 = __importDefault(require("../../db/db")); // Ajusta esta ruta según tu estructura de directorios
const body_parser_1 = __importDefault(require("body-parser"));
const decodeToken_1 = __importDefault(require("../../functions/decodeToken")); // Asegúrate de que esta función está correctamente exportada
const token_1 = __importDefault(require("../../token/token"));
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
// Endpoint para añadir un favorito
router.post('/add', token_1.default, (req, res) => {
    const { id_user, id_salon } = req.body;
    if (!id_user || !id_salon) {
        return res.status(400).json({ error: 'id_user and id_salon are required' });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
    }
    catch (err) {
        console.error('Error decoding token:', err);
        return res.status(400).json({ error: 'Invalid token' });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: 'Failed to start transaction' });
        }
        const query = 'INSERT INTO user_favourite (id_user, id_salon) VALUES (?, ?)';
        db_1.default.query(query, [decodedIdUser, id_salon], (error, results) => {
            if (error) {
                return db_1.default.rollback(() => {
                    console.error('Insert error:', error);
                    return res.status(500).json({ error: 'Failed to add favorite' });
                });
            }
            db_1.default.commit((commitErr) => {
                if (commitErr) {
                    return db_1.default.rollback(() => {
                        console.error('Commit error:', commitErr);
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    });
                }
                return res.status(201).json({
                    message: 'Favorite added successfully',
                    id_user_favorite: results.insertId,
                });
            });
        });
    });
});
// Endpoint para eliminar un favorito
router.delete('/delete/:id_user_favorite', token_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get('/get', token_1.default, (req, res) => {
    const { id_user } = req.query; // Aquí debes usar req.query
    if (!id_user) {
        return res.status(400).json({ error: 'id_user is required' });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
    }
    catch (err) {
        console.error('Error decoding token:', err);
        return res.status(400).json({ error: 'Invalid token' });
    }
    // Consulta SQL con INNER JOIN para obtener los detalles de los salones junto con los favoritos
    const query = `
        SELECT s.id_salon, s.name, s.address, s.image, uf.id_user, uf.id_user_favourite
        FROM user_favourite uf
        INNER JOIN salon s ON uf.id_salon = s.id_salon
        WHERE uf.id_user = ?
    `;
    db_1.default.query(query, [decodedIdUser], (error, results) => {
        if (error) {
            console.error('Query error:', error);
            return res.status(500).json({ error: 'Failed to retrieve favorites' });
        }
        // Siempre devolver un array, incluso si está vacío
        return res.status(200).json(results);
    });
});
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
exports.default = router;
