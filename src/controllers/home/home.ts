import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";


const router = express.Router();
router.use(bodyParser.json());


router.get("/getSalonValidated", async (req, res) => {
    try {
      // Iniciar la transacción
      await new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
          if (err) return reject(err);
          resolve(undefined);
        });
      });
      
      const query = `
        SELECT *
        FROM salon
        WHERE state = 'Validado'
        ORDER BY RAND()
        LIMIT 10
      `;
  
      connection.query(query, (error, results) => {
        if (error) {
          console.error("Error al buscar los salones validados:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar los salones validados." });
          });
        }
  
        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al hacer commit." });
            });
          }
  
          res.json(results);
        });
      });
    } catch (err) {
      console.error("Error al buscar los salones validados:", err);
      res.status(500).json({ error: "Error al buscar los salones validados." });
    }
  })

export default router;