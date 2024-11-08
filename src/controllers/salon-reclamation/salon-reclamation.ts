import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import { RowDataPacket } from "mysql2";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";
import multer from "multer";
import path from "path";
import fs from 'fs';
import { verify } from "jsonwebtoken";
import verifyToken from "../../token/token";
import { ResultSetHeader } from "mysql2";



const router = express.Router();
router.use(bodyParser.json());

const uploadDir = path.join(__dirname, '../../../dist/uploads-reclamation');

// Crear la carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });


router.get("/getProvinces", async (req: Request, res: Response) => {
  const query = `SELECT id_province, name FROM province ORDER BY name`;

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
        p.id_province = ? 
      ORDER BY c.name;
    `;
//desde git
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

router.get("/getUserData",async (req: Request, res: Response) => {
  try {
    // Extraer el id_user de la consulta
    const id_user = req.query.id_user as string;

    if (!id_user) {
      return res.status(400).json({ error: "id_user is required" });
    }

    // Decodificar el token para obtener el userId
    const usuarioId = decodeToken(id_user);
  

    // Consulta para obtener los datos del usuario
    const queryStr = `
            SELECT 
                *
            FROM 
                user
            WHERE 
                id_user = ?;
        `;

    // Ejecuta la consulta usando la conexión
    connection.query(
      queryStr,
      [usuarioId],
      (error, results: RowDataPacket[]) => {
        if (error) {
          console.error("Error fetching user data:", error);
          return res
            .status(500)
            .json({ error: "An error occurred while fetching user data" });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({ data: results[0] });
      }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user data" });
  }
});



router.post("/newReclamation", verifyToken, upload.fields([
  { name: 'dni_front', maxCount: 1 },
  { name: 'dni_back', maxCount: 1 },
  { name: 'file_path', maxCount: 1 },
  {name:'invoice_path',maxCount:1}
]), (req, res) => {
  if (!req.files) {
    return res.status(400).send("No se subieron archivos.");
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const dniFrontPath = files['dni_front'] ? files['dni_front'][0].filename : null;
  const dniBackPath = files['dni_back'] ? files['dni_back'][0].filename : null;
  const filePath = files['file_path'] ? files['file_path'][0].filename : null;
  const invoicePath = files['invoice_path'] ? files['invoice_path'][0].filename : null;

  // Construir la URL completa para cada archivo
  const dniFrontUrl = dniFrontPath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${dniFrontPath}` : null;
  const dniBackUrl = dniBackPath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${dniBackPath}` : null;
  const fileUrl = filePath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${filePath}` : null;
  const invoiceUrl = invoicePath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${invoicePath}` : null;

  // Validar campos requeridos
  if (!dniFrontUrl || !dniBackUrl || !fileUrl || !invoiceUrl) {
    return res.status(400).send("Faltan archivos requeridos.");
  }

  const {
    id_user,
    salon_name,
    id_province,
    id_city,
    observation,
    state='Pendiente',
    terms,
    
  } = req.body;

  if (!id_user || !salon_name || !id_province || !id_city || !terms) {
    return res.status(400).send("Faltan campos requeridos.");
  }

  let usuarioId;
  try {
    usuarioId = decodeToken(id_user);
  } catch (error) {
    return res.status(400).send("Token de usuario inválido.");
  }

  // Iniciar la transacción
  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).send("Error en el servidor");
    }

    const sql = `INSERT INTO salon_reclamacion (id_user, salon_name, id_province, id_city, observation, dnifront_path, dniback_path, file_path,invoice_path, state, terms)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(
      sql,
      [
        usuarioId,
        salon_name,
        id_province,
        id_city,
        observation,
        dniFrontUrl, // Guardar la URL en lugar de la ruta del sistema de archivos
        dniBackUrl,  // Guardar la URL en lugar de la ruta del sistema de archivos
        fileUrl,
        invoiceUrl,
        state,     // Guardar la URL en lugar de la ruta del sistema de archivos
        terms,
      ],
      (err, result) => {
        if (err) {
          return connection.rollback(() => {
            return res.status(500).send("Error en el servidor");
          });
        }

        const alertText = `Nueva reclamación pendiente: ${salon_name}`;
         const alertUrl = `/reclamations`;
         connection.query<ResultSetHeader>(
           `
           INSERT INTO alert_admin (text, url, showed, created_at)
           VALUES (?, ?, 0, NOW());
           `,
           [alertText, alertUrl],
           (err, alertResults) => {
             if (err) {
               return connection.rollback(() => {
                 res.status(500).json({ error: 'Error al insertar la alerta' });
               });
             }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              return res.status(500).send("Error en el servidor");
            });
          }

          if ((req as any).io) {
            (req as any).io.emit('new-alert', {
              message: alertText,
              url: alertUrl,
              alertId: alertResults.insertId,
            });
          } else {
            console.error("Socket.IO no está disponible en req");
          }

          return res.status(200).send("Reclamación registrada con éxito");
        });
      });
    });
  });

  });




router.get("/searchSalon",verifyToken, async (req, res) => {
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
  

router.get("/getSalonById", async (req, res) => {
  try {
    const { id_salon } = req.query;

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    
    const query = `
    SELECT s.name, s.id_city, s.address, c.id_province
    FROM salon s
    INNER JOIN city c ON s.id_city = c.id_city
    WHERE s.id_salon = ?
  `;

    connection.query(query, [id_salon], (error, results) => {
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




router.post('/delete', async (req, res) => {
  const { id_salon_reclamacion } = req.body;
  console.log('id_salon_reclamacion recibida: ', id_salon_reclamacion);

  if (!id_salon_reclamacion || !Array.isArray(id_salon_reclamacion) || id_salon_reclamacion.length === 0) {
    return res.status(400).json({ message: 'No hay reclamaciones para eliminar' });
  }

  try {
    // Iniciar la transacción
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Obtener las reclamaciones para eliminar los archivos asociados
    const selectReclamationsQuery = `
      SELECT dnifront_path, dniback_path, file_path, invoice_path 
      FROM salon_reclamacion 
      WHERE id_salon_reclamacion IN (${id_salon_reclamacion.map(() => '?').join(',')})
    `;

    const reclamations = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query(selectReclamationsQuery, id_salon_reclamacion, (err, results) => {
        if (err) return reject(err);

        if (Array.isArray(results)) {
          resolve(results as RowDataPacket[]);
        } else {
          reject(new Error('Resultados no válidos al obtener las reclamaciones.'));
        }
      });
    });

    // Eliminar los archivos si existen
    reclamations.forEach(reclamation => {
      const paths = [
        reclamation.dnifront_path,
        reclamation.dniback_path,
        reclamation.file_path,
        reclamation.invoice_path
      ];

      paths.forEach(filePath => {
        if (filePath) {
          // Usar uploadDir para asegurar que las rutas coincidan
          const fullPath = path.join(uploadDir, path.basename(filePath));
          console.log(fullPath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error al eliminar el archivo: ${fullPath}`, err);
            } else {
              console.log(`Archivo eliminado: ${fullPath}`);
            }
          });
        }
      });
    });

    // Eliminar las reclamaciones
    const deleteReclamationsSql = `
      DELETE FROM salon_reclamacion 
      WHERE id_salon_reclamacion IN (${id_salon_reclamacion.map(() => '?').join(',')})
    `;
    
    await new Promise<void>((resolve, reject) => {
      connection.query(deleteReclamationsSql, id_salon_reclamacion, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Commit de la transacción si todo va bien
    await new Promise<void>((resolve, reject) => {
      connection.commit((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Responder al cliente
    res.json({ message: 'Reclamaciones e imágenes eliminadas correctamente' });

  } catch (error) {
    console.error('Error al eliminar las reclamaciones o las imágenes:', error);

    // Si algo falla, hacer rollback de la transacción
    connection.rollback(() => {
      res.status(500).json({ message: 'Error al eliminar las reclamaciones o las imágenes' });
    });
  }
});




export default router;
