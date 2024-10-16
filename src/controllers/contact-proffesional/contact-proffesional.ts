import express from "express";
import { ResultSetHeader } from "mysql2";
import connection from "../../db/db";
import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";

const router = express.Router();

router.post("/newContactProffesional", async (req, res) => {
  const {
    name,
    email,
    phone,
    msg,
    salon_name,
    id_province,
    id_city,
    address,
    state = "Pendiente",
    term_cond,
  } = req.body;

  // Usando una transacción con una conexión existente
  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al iniciar la transacción" });
    }

    connection.query<ResultSetHeader>(
      `
      INSERT INTO contact_proffesional (name, email, phone, text,salon_name,id_province,id_city,address, state, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
      `,
      [name, email, phone, msg,salon_name, id_province, id_city, address, state, term_cond],
      (err, results) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al insertar el contacto" });
          });
        }

        // Si todo está bien, confirmar la transacción
        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              res
                .status(500)
                .json({ error: "Error al confirmar la transacción" });
            });
          }

          res.status(201).json({
            message: "Contacto añadido exitosamente",
            contactId: results.insertId,
          });
        });
      }
    );
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

export default router;
