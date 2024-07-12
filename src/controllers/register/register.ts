import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.get("/searchCity", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ error: "El parámetro 'name' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = "SELECT * FROM city WHERE name LIKE ? LIMIT 5";

    connection.query(query, [`%${name}%`], (error, results) => {
      if (error) {
        console.error("Error al buscar la ciudad:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar la ciudad." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar la ciudad." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar la ciudad:", err);
    res.status(500).json({ error: "Error al buscar la ciudad." });
  }
});

router.get("/searchProvince", async (req, res) => {
    try {
      const { name } = req.query;
  
      if (!name) {
        return res
          .status(400)
          .json({ error: "El parámetro 'name' es requerido." });
      }
  
      // Iniciar la transacción
      await new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
          if (err) return reject(err);
          resolve(undefined);
        });
      });
  
      const query = "SELECT * FROM province WHERE name LIKE ? LIMIT 5";
  
      connection.query(query, [`%${name}%`], (error, results) => {
        if (error) {
          console.error("Error al buscar la ciudad:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar la ciudad." });
          });
        }
  
        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al buscar la ciudad." });
            });
          }
  
          res.json(results);
        });
      });
    } catch (err) {
      console.error("Error al buscar la ciudad:", err);
      res.status(500).json({ error: "Error al buscar la ciudad." });
    }
  });



export default router;
