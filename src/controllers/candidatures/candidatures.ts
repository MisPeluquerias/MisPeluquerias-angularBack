import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import verifyToken from "../../token/token";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";

const router = express.Router();
router.use(bodyParser.json());

router.get(
    "/getCandidaturesByIdUser",
    verifyToken,
    (req: Request, res: Response) => {
      const { id_user } = req.query;
  
      if (!id_user) {
        return res.status(400).json({ error: "id_user is required" });
      }
  
      let decodedIdUser;
      try {
        decodedIdUser = decodeToken(id_user as string);
      } catch (err) {
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
  
      connection.query(query, [decodedIdUser], (error, results: any[]) => {
        if (error) {
          console.error("Query error:", error);
          return res.status(500).json({ error: "Failed to retrieve candidatures" });
        }
  
        return res.status(200).json(results);
      });
    }
  );
  

export default router;
