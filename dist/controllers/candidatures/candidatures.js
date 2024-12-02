"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../../db/db"));
const body_parser_1 = __importDefault(require("body-parser"));
const token_1 = __importDefault(require("../../token/token"));
const decodeToken_1 = __importDefault(require("../../functions/decodeToken"));
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
router.get("/getCandidaturesByIdUser", token_1.default, (req, res) => {
    const { id_user } = req.query;
    if (!id_user) {
        return res.status(400).json({ error: "id_user is required" });
    }
    let decodedIdUser;
    try {
        decodedIdUser = (0, decodeToken_1.default)(id_user);
    }
    catch (err) {
        console.error("Error decoding token:", err);
        return res.status(400).json({ error: "Invalid token" });
    }
    if (!decodedIdUser) {
        return res.status(400).json({ error: "Invalid decoded user ID" });
    }
    const query = `
    SELECT 
        ujs.id_user_job_subscriptions,
        ujs.id_job_offer,
        ujs.id_user,
        ujs.id_salon,
        s.name AS salon_name,
        ujs.work_presentation,
        ujs.path_curriculum,
        ujs.privacy_policy,
        ujs.date_subscriptions,
        jo.category,
        jo.subcategory,
        jo.description,
        jo.date_job_offer,
        jo.requirements,
        jo.img_job_path,
        jo.salary
    FROM 
        user_job_subscriptions ujs
    JOIN 
        jobs_offers jo
    ON 
        ujs.id_job_offer = jo.id_job_offer
    JOIN 
        salon s
    ON 
        ujs.id_salon = s.id_salon
    WHERE 
        ujs.id_user = ?;
`;
    db_1.default.query(query, [decodedIdUser], (error, results) => {
        if (error) {
            console.error("Query error:", error);
            return res.status(500).json({ error: "Failed to retrieve candidatures" });
        }
        return res.status(200).json(results);
    });
});
exports.default = router;
