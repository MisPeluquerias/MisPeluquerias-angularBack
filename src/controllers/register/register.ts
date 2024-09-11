import express, { Request, Response } from 'express';
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
import { RowDataPacket } from "mysql2";
import bcrypt from 'bcrypt';


const saltRounds = 10;



router.post('/', async (req: Request, res: Response) => {
  const { name, lastname, birth_date, phone, email, dni, address, password, id_city, id_province } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const usuario = { name, lastname, birth_date, phone, email, dni, address, password: hashedPassword, id_city, id_province };

    // Iniciar la transacción
    connection.beginTransaction((err) => {
      if (err) {
        console.error('Error al iniciar la transacción:', err);
        return res.status(500).json({ message: 'Error al iniciar la transacción' });
      }

      // Insertar el usuario en la base de datos
      const query = `INSERT INTO user SET ?`;
      connection.query(query, usuario, (error, results) => {
        if (error) {
          console.error('Error al insertar el usuario:', error);
          if (error.code === 'ER_DUP_ENTRY') {
            return connection.rollback(() => {
              res.status(400).json({ message: 'El correo electrónico ya está registrado' });
            });
          } else {
            return connection.rollback(() => {
              res.status(500).json({ message: 'Error al insertar el usuario' });
            });
          }
        }

        // Confirmar la transacción
        connection.commit((err) => {
          if (err) {
            console.error('Error al confirmar la transacción:', err);
            return connection.rollback(() => {
              res.status(500).json({ message: 'Error al confirmar la transacción' });
            });
          }

          res.json({ message: 'Usuario registrado correctamente' });
        });
      });
    });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});




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


  router.get("/getProvinces", async (req: Request, res: Response) => {
    const query = `SELECT id_province, name FROM province`;
  
    connection.query(query, (queryError, results: RowDataPacket[]) => {
      if (queryError) {
        console.error("Error fetching provinces:", queryError);
        return res
          .status(500)
          .json({ error: "An error occurred while fetching the provinces" });
      }
  
      res.json({ data: results });
    });
  });
  
  
  router.get("/getCitiesByProvince", async (req: Request, res: Response) => {
    const id_province = req.query.id_province;
  
    if (!id_province) {
      return res.status(400).json({ error: "id_province is required" });
    }
  
    const query = `
      SELECT 
        p.name as province_name,
        c.id_city,
        c.name as city_name,
        c.zip_code
      FROM 
        province p
      JOIN 
        city c ON p.id_province = c.id_province
      WHERE 
        p.id_province = ?;
    `;
  
    connection.query(
      query,
      [id_province],
      (queryError, results: RowDataPacket[]) => {
        if (queryError) {
          console.error("Error fetching cities and province:", queryError);
          return res.status(500).json({
            error: "An error occurred while fetching the city and province data",
          });
        }
  
        res.json({ data: results });
      }
    );
  });



export default router;
