import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import { RowDataPacket } from "mysql2";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";
import multer from "multer";
import path from "path";
import fs from 'fs';



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

router.get("/getUserData", async (req: Request, res: Response) => {
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



router.post("/newReclamation", upload.fields([
  { name: 'dni_front', maxCount: 1 },
  { name: 'dni_back', maxCount: 1 },
  { name: 'file_path', maxCount: 1 },
]), (req, res) => {
  if (!req.files) {
    return res.status(400).send("No se subieron archivos.");
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const dniFrontPath = files['dni_front'] ? files['dni_front'][0].filename : null;
  const dniBackPath = files['dni_back'] ? files['dni_back'][0].filename : null;
  const filePath = files['file_path'] ? files['file_path'][0].filename : null;

  // Construir la URL completa para cada archivo
  const dniFrontUrl = dniFrontPath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${dniFrontPath}` : null;
  const dniBackUrl = dniBackPath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${dniBackPath}` : null;
  const fileUrl = filePath ? `${req.protocol}://${req.get('host')}/uploads-reclamation/${filePath}` : null;

  // Validar campos requeridos
  if (!dniFrontUrl || !dniBackUrl || !fileUrl) {
    return res.status(400).send("Faltan archivos requeridos.");
  }

  const {
    id_user,
    salon_name,
    id_province,
    id_city,
    observation,
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

    const sql = `INSERT INTO salon_reclamacion (id_user, salon_name, id_province, id_city, observation, dnifront_path, dniback_path, file_path, terms)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
        fileUrl,     // Guardar la URL en lugar de la ruta del sistema de archivos
        terms,
      ],
      (err, result) => {
        if (err) {
          return connection.rollback(() => {
            return res.status(500).send("Error en el servidor");
          });
        }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              return res.status(500).send("Error en el servidor");
            });
          }

          return res.status(200).send("Reclamación registrada con éxito");
        });
      }
    );
  });
})
  

export default router;