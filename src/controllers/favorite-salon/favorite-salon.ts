import express from 'express';
import connection from '../../db/db'; // Ajusta esta ruta según tu estructura de directorios
import bodyParser from 'body-parser';
import decodeToken from '../../functions/decodeToken'; // Asegúrate de que esta función está correctamente exportada
import { OkPacket } from 'mysql2';
import { Request, Response } from 'express';
import verifyToken from '../../token/token';

const router = express.Router();
router.use(bodyParser.json());

// Endpoint para añadir un favorito
router.post('/add',verifyToken, (req: Request, res: Response) => {
    const { id_user, id_salon } = req.body;

    if (!id_user || !id_salon) {
        return res.status(400).json({ error: 'id_user and id_salon are required' });
    }

    let decodedIdUser;
    try {
        decodedIdUser = decodeToken(id_user as string);
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(400).json({ error: 'Invalid token' });
    }

    connection.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: 'Failed to start transaction' });
        }

        const query = 'INSERT INTO user_favourite (id_user, id_salon) VALUES (?, ?)';
        connection.query(query, [decodedIdUser, id_salon], (error, results: OkPacket) => {
            if (error) {
                return connection.rollback(() => {
                    console.error('Insert error:', error);
                    return res.status(500).json({ error: 'Failed to add favorite' });
                });
            }

            connection.commit((commitErr) => {
                if (commitErr) {
                    return connection.rollback(() => {
                        console.error('Commit error:', commitErr);
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    });
                }

                return res.status(201).json({
                    message: 'Favorite added successfully',
                    id_user_favorite: results.insertId,
                });
            });
        });
    });
});

// Endpoint para eliminar un favorito
router.delete('/delete/:id_user_favorite',verifyToken, async(req: Request, res: Response) => {
    const { id_user_favorite } = req.params;

    if (!id_user_favorite) {
        return res.status(400).json({ error: 'id_user_favorite parameter is required' });
    }

    connection.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: 'Failed to start transaction' });
        }

        const query = 'DELETE FROM user_favourite WHERE id_user_favourite = ?';
        connection.query(query, [id_user_favorite], (error, results: OkPacket) => {
            if (error) {
                return connection.rollback(() => {
                    console.error('Delete error:', error);
                    return res.status(500).json({ error: 'Failed to delete favorite' });
                });
            }

            if (results.affectedRows === 0) {
                return connection.rollback(() => {
                    console.error('No rows affected');
                    return res.status(404).json({ error: 'Favorite not found' });
                });
            }

            connection.commit((commitErr) => {
                if (commitErr) {
                    return connection.rollback(() => {
                        console.error('Commit error:', commitErr);
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    });
                }

                return res.status(200).json({
                    message: 'Favorite deleted successfully',
                });
            });
        });
    });
});

router.get('/get',verifyToken, (req: Request, res: Response) => {
    const { id_user } = req.query; // Aquí debes usar req.query

    if (!id_user) {
        return res.status(400).json({ error: 'id_user is required' });
    }

    let decodedIdUser;
    try {
        decodedIdUser = decodeToken(id_user as string);
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(400).json({ error: 'Invalid token' });
    }

    // Consulta SQL con INNER JOIN para obtener los detalles de los salones junto con los favoritos
    const query = `
        SELECT s.id_salon, s.name, s.address, s.image, uf.id_user, uf.id_user_favourite
        FROM user_favourite uf
        INNER JOIN salon s ON uf.id_salon = s.id_salon
        WHERE uf.id_user = ?
    `;

    connection.query(query, [decodedIdUser], (error, results: any[]) => {
        if (error) {
            console.error('Query error:', error);
            return res.status(500).json({ error: 'Failed to retrieve favorites' });
        }

        // Siempre devolver un array, incluso si está vacío
        return res.status(200).json(results);
    });
});


router.get("/getImagesAdmin", async (req, res) => {
    try {
      const { salon_id } = req.query;
  
      if (!salon_id) {
        return res
          .status(400)
          .json({ error: "El parámetro 'zone' es requerido." });
      }
  
      // Iniciar la transacción
      await new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
          if (err) return reject(err);
          resolve(undefined);
        });
      });
  
      // Modificar la consulta para usar zip_code
      const query = `
        SELECT *
        FROM file
        WHERE salon_id = ? 
      `;
  
      connection.query(query, [salon_id], (error, results) => {
        if (error) {
          console.error("Error al buscar el servicio:", error);
          return connection.rollback(() => {
            res
              .status(500)
              .json({ error: "Error al buscar las imagenes en el salon:" });
          });
        }
  
        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res
                .status(500)
                .json({ error: "Error al buscar las imagenes en el salon:" });
            });
          }
  
          res.json(results);
        });
      });
    } catch (err) {
      console.error("Error al buscar las imagenes en el salon:", err);
      res.status(500).json({ error: "Error al buscar las imagenes en el salon" });
    }
  });

export default router;
