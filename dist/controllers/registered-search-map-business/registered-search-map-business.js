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
    // Verificamos los parámetros de la query y el id_user
    const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;
    const { id_user } = req.query; // Cambiar `req.body` a `req.query` si `id_user` está llegando como un parámetro de consulta
    //console.log("Parámetros recibidos:");
    //console.log("northEastLat:", northEastLat, "northEastLng:", northEastLng);
    //console.log("southWestLat:", southWestLat, "southWestLng:", southWestLng);
    //console.log("id_user:", id_user);
    if (!id_user) {
        return res.status(400).json({ error: "User ID is required" });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
        //console.log("ID de usuario decodificado:", decodedIdUser);
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
        const query = `
            SELECT salon.id_salon, salon.longitud, salon.latitud, salon.name, salon.address, salon.image,
            user_favourite.id_user_favourite, 
                   IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite
            FROM salon
            LEFT JOIN user_favourite ON salon.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?
            WHERE salon.latitud BETWEEN ? AND ? AND salon.longitud BETWEEN ? AND ?
        `;
        console.log("Ejecutando consulta SQL:", query);
        db_1.default.query(query, [decodedIdUser, southWestLat, northEastLat, southWestLng, northEastLng], (error, results) => {
            if (error) {
                console.error("Error en la consulta SQL:", error);
                return db_1.default.rollback(() => {
                    res.status(500).json({ error: "Error al buscar el servicio." });
                });
            }
            //console.log("Resultados de la consulta:", results);
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
exports.default = router;
