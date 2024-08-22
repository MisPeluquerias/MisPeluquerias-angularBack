import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.get("/searchCategory", async (req, res) => {
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

router.get("/searchService", async (req, res) => {
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

    const query = "SELECT DISTINCT name FROM service WHERE name LIKE ?";

    connection.query(query, [`%${name}%`], (error, results) => {
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

router.get("/searchSalon", async (req, res) => {
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

    const query = "SELECT * FROM salon WHERE name LIKE ?";

    connection.query(query, [`%${name}%`], (error, results) => {
      if (error) {
        console.error("Error al buscar el salón:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar el salón." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar el salón." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar el salón:", err);
    res.status(500).json({ error: "Error al buscar el salón." });
  }
});

router.get("/searchSalon", async (req, res) => {
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

    const query = "SELECT * FROM salon WHERE name LIKE ?";

    connection.query(query, [`%${name}%`], (error, results) => {
      if (error) {
        console.error("Error al buscar el salón:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar el salón." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar el salón." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar el salón:", err);
    res.status(500).json({ error: "Error al buscar el salón." });
  }
});

router.get("/searchCity", async (req, res) => {
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

    
    const query = `
      SELECT id_city, name, MIN(zip_code) AS zip_code
      FROM city
      WHERE name LIKE ? OR zip_code LIKE ?
      GROUP BY name
    `;

    connection.query(query, [`%${name}%`, `%${name}%`], (error, results) => {
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
