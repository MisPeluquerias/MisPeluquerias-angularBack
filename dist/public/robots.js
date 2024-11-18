"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = require('path');
const router = express_1.default.Router();
router.use(express_1.default.static(path.join(__dirname, 'public')));
// Opcional: ruta explícita para robots.txt
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Robots.txt'));
});
exports.default = router;
