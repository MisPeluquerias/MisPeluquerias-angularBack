import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
import verifyToken from "../../token/token";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";
import { OkPacket } from "mysql2";



router.get("/chargeMarkersAndCard", verifyToken, async (req: Request, res: Response) => {
    // Verificamos los parámetros de la query y el id_user
    const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;
    const { id_user } = req.query; // Cambiar `req.body` a `req.query` si `id_user` está llegando como un parámetro de consulta

    //console.log("Parámetros recibidos:");
    //console.log("northEastLat:", northEastLat, "northEastLng:", northEastLng);
    //console.log("southWestLat:", southWestLat, "southWestLng:", southWestLng);
    //console.log("id_user:", id_user);

    if (!id_user) {
        return res.status(400).json({ error: "User ID is required" });
    }

    let decodedIdUser;
    try {
        decodedIdUser = decodeToken(id_user as string);
        //console.log("ID de usuario decodificado:", decodedIdUser);
    } catch (err) {
        console.error("Error al decodificar el token:", err);
        return res.status(400).json({ error: "Invalid token" });
    }

    try {
        await new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) {
                    console.error("Error al iniciar la transacción:", err);
                    return reject(err);
                }
                resolve(undefined);
            });
        });

        const query = `
            SELECT salon.id_salon, salon.longitud, salon.latitud, salon.name, salon.address, salon.image,
            user_favourite.id_user_favourite, 
                   IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite
            FROM salon
            LEFT JOIN user_favourite ON salon.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?
            WHERE salon.latitud BETWEEN ? AND ? AND salon.longitud BETWEEN ? AND ?
        `;

        console.log("Ejecutando consulta SQL:", query);
        connection.query(
            query,
            [decodedIdUser, southWestLat, northEastLat, southWestLng, northEastLng],
            (error, results) => {
                if (error) {
                    console.error("Error en la consulta SQL:", error);
                    return connection.rollback(() => {
                        res.status(500).json({ error: "Error al buscar el servicio." });
                    });
                }

            //console.log("Resultados de la consulta:", results);

                connection.commit((err) => {
                    if (err) {
                        console.error("Error al hacer commit:", err);
                        return connection.rollback(() => {
                            res.status(500).json({ error: "Error al buscar el servicio." });
                        });
                    }

                    res.json(results);
                });
            }
        );
    } catch (err) {
        console.error("Error al buscar el servicio:", err);
        res.status(500).json({ error: "Error al buscar el servicio." });
    }
});




router.delete('/delete-favorite/:id_user_favorite',verifyToken, async(req: Request, res: Response) => {
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
  


export default router;
