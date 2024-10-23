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
router.get("/chargeMarkersAndCard", token_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;
        // Iniciar la transacción
        yield new Promise((resolve, reject) => {
            db_1.default.beginTransaction((err) => {
                if (err)
                    return reject(err);
                resolve(undefined);
            });
        });
        const query = `
        SELECT id_salon, longitud, latitud, name, address, image FROM salon
        WHERE latitud BETWEEN ? AND ? AND longitud BETWEEN ? AND ?
      `;
        db_1.default.query(query, [southWestLat, northEastLat, southWestLng, northEastLng], (error, results) => {
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
exports.default = router;
