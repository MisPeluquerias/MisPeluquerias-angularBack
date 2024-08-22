import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import { QueryError,RowDataPacket } from 'mysql2'

const router = express.Router();
router.use(bodyParser.json());

router.get("/searchByCityById", async (req, res) => {
  try {
    const { id_city } = req.query;

    if (!id_city) {
      return res.status(400).json({ error: "El parámetro 'id_city' es requerido." });
    }

   
    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Obtener el nombre de la ciudad con el id_city dado
    const getCityNameQuery = `
      SELECT name
      FROM city
      WHERE id_city = ?
    `;

    connection.query(getCityNameQuery, [id_city], (error, results: any[]) => {
      if (error) {
        console.error("Error al obtener el nombre de la ciudad:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al obtener el nombre de la ciudad." });
        });
      }

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(404).json({ error: "No se encontró la ciudad con el id_city proporcionado." });
      }

      const cityName = results[0].name;

      // Buscar todas las ciudades con el mismo nombre
      const getCitiesQuery = `
        SELECT id_city
        FROM city
        WHERE name = ?
      `;

      connection.query(getCitiesQuery, [cityName], (error, cityResults: any[]) => {
        if (error) {
          console.error("Error al buscar las ciudades:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar las ciudades." });
          });
        }

        const cityIds = cityResults.map(city => city.id_city);

        // Obtener los salones en esas ciudades
        const getSalonsQuery = `
          SELECT id_salon, longitud, latitud, name, address, image 
          FROM salon
          WHERE id_city IN (?)
        `;

        connection.query(getSalonsQuery, [cityIds], (error, salonResults: any[]) => {
          if (error) {
            console.error("Error al buscar los salones:", error);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al buscar los salones." });
            });
          }

          connection.commit((err) => {
            if (err) {
              console.error("Error al hacer commit:", err);
              return connection.rollback(() => {
                res.status(500).json({ error: "Error al hacer commit." });
              });
            }

            res.json(salonResults);
          });
        });
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});




router.get("/searchByCityName", async (req, res) => {
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

    // Buscar los salones en la ciudad con el nombre proporcionado
    const getSalonsQuery = `
      SELECT salon.id_salon, salon.longitud, salon.latitud, salon.name, salon.address, salon.image 
      FROM salon
      INNER JOIN city ON salon.id_city = city.id_city
      WHERE city.name = ?`
    ;

    connection.query(getSalonsQuery, [name], (error, salonResults: any[]) => {
      if (error) {
        console.error("Error al buscar los salones:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar los salones." });
        });
      }

      if (!Array.isArray(salonResults) || salonResults.length === 0) {
        return res.status(404).json({ error: "No se encontraron salones en la ciudad proporcionada." });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al hacer commit." });
          });
        }

        res.json(salonResults);
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});

router.get("/searchByName", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "El parámetro 'name' es requerido." });
  }

  try {
    const getSalonsByNameQuery = `
      SELECT id_salon, longitud, latitud, name, address, image 
      FROM salon
      WHERE name LIKE ?
    `;

    const searchName = `%${name}%`;

    connection.query<RowDataPacket[]>(getSalonsByNameQuery, [searchName], (error, results) => {
      if (error) {
        console.error("Error al buscar los salones por nombre:", error);
        return res.status(500).json({ error: "Error al buscar los salones por nombre." });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "No se encontraron salones con el nombre proporcionado." });
      }

      res.json(results);
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});

router.get('/searchSalonByService', (req, res) => {
  const { id_city, name } = req.query;  // Cambiado de req.body a req.query

  const query = `
    SELECT s.id_salon, s.name AS salon_name, c.name AS city_name, srv.name AS service_name
    FROM salon s
    INNER JOIN service srv ON s.id_salon = srv.id_salon
    INNER JOIN city c ON s.id_city = c.id_city
    WHERE srv.name LIKE ? AND c.id_city = ?
  `;

  // Iniciar la transacción
  connection.beginTransaction(err => {
    if (err) {
      console.error('Error iniciando la transacción:', err);
      return res.status(500).send('Error en el servidor.');
    }

    // Ejecutar la consulta
    connection.query(query, [`%${name}%`, id_city], (err, results) => {
      if (err) {
        console.error('Error ejecutando la consulta:', err);

        // Si hay un error, hacer un rollback
        return connection.rollback(() => {
          res.status(500).send('Error en el servidor.');
        });
      }

      // Si todo sale bien, hacer commit
      connection.commit(err => {
        if (err) {
          console.error('Error haciendo commit:', err);
          return connection.rollback(() => {
            res.status(500).send('Error en el servidor.');
          });
        }

        // Enviar los resultados si el commit es exitoso
        res.json(results);
      });
    });
  });
});

export default router;
