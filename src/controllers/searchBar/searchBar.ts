import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require('body-parser');
router.use(bodyParser.json());


router.get('/searchCategory', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "El parámetro 'name' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = "SELECT * FROM category WHERE name LIKE ?";

    connection.query(query, [`%${name}%`], (error, results) => {
      if (error) {
        console.error("Error al buscar la categoría:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar la categoría." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar la categoría." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar la categoría:", err);
    res.status(500).json({ error: "Error al buscar la categoría." });
  }
});


router.get('/searchServiceOrSalon', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "El parámetro 'name' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = "SELECT * FROM category WHERE name LIKE ? OR service LIKE ? OR salon LIKE ?";
    
    connection.query(query, [`%${name}%`], (error, results) => {
      if (error) {
        console.error("Error al buscar el servicio o salon:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar la categoría." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar el servicio o salon." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio o salon:", err);
    res.status(500).json({ error: "Error al buscar el servicio o salon." });
  }
});



export default router;