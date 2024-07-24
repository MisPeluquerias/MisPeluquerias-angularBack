import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
const mysql = require("mysql2/promise");






router.get("/chargeMarkersAndCard", async (req, res) => {
  try {
      const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;

      // Iniciar la transacción
      await new Promise((resolve, reject) => {
          connection.beginTransaction((err) => {
              if (err) return reject(err);
              resolve(undefined);
          });
      });

      
      const query = `
        SELECT id_salon, longitud, latitud, name, address, image FROM salon
        WHERE latitud BETWEEN ? AND ? AND longitud BETWEEN ? AND ?
      `;


      connection.query(query, [southWestLat, northEastLat, southWestLng, northEastLng], (error, results) => {
          if (error) {
              console.error("Error al buscar el servicio:", error);
              return connection.rollback(() => {
                  res.status(500).json({ error: "Error al buscar el servicio." });
              });
          }

          connection.commit((err) => {
              if (err) {
                  console.error("Error al hacer commit:", err);
                  return connection.rollback(() => {
                      res.status(500).json({ error: "Error al buscar el servicio." });
                  });
              }

              res.json(results);
          });
      });
  } catch (err) {
      console.error("Error al buscar el servicio:", err);
      res.status(500).json({ error: "Error al buscar el servicio." });
  }
});
  
  


export default router;
