import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
import verifyToken from "../../token/token";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";
import { OkPacket } from "mysql2";
import { RowDataPacket } from "mysql2";



router.get("/chargeMarkersAndCard", verifyToken, async (req: Request, res: Response) => {
    const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;
    const { id_user } = req.query;

    if (!id_user) {
        return res.status(400).json({ error: "User ID is required" });
    }

    let decodedIdUser;
    try {
        decodedIdUser = decodeToken(id_user as string);
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
                   salon.hours_old,
                   user_favourite.id_user_favourite, 
                   IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite
            FROM salon
            LEFT JOIN user_favourite ON salon.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?
            WHERE salon.latitud BETWEEN ? AND ? AND salon.longitud BETWEEN ? AND ?
        `;

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

                // Aseguramos que `results` es de tipo RowDataPacket[]
                const rows = results as RowDataPacket[];

                // Obtener el día y hora actuales
                const currentDay = new Date().toLocaleString('es-ES', { weekday: 'long' });
                const currentTime = new Date();

                function isOpen(hoursOld:any, currentDay:any, currentTime:any) {
                    const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                
                    // Verificar si `hoursOld` es nulo o vacío
                    if (!hoursOld) {
                        return false;
                    }
                
                    // Convertir `currentDay` a índice numérico si se pasa como texto
                    if (typeof currentDay === 'string') {
                        currentDay = daysOfWeek.indexOf(currentDay.toLowerCase());
                    }
                
                    // Validación del índice de `currentDay`
                    if (typeof currentDay !== 'number' || currentDay < 0 || currentDay > 6) {
                        return false;
                    }
                
                    const currentDayFormatted = daysOfWeek[currentDay].toLowerCase();
                    const dayMap = new Map();
                    const days = hoursOld.split(';'); // Separar los días por `;`
                
                    days.forEach((dayEntry:any) => {
                        const [day, ...hoursArr] = dayEntry.split(':'); // Separar el día de las horas
                        const hours = hoursArr.join(':').trim(); // Volver a unir y limpiar las horas
                        if (day && hours) {
                            dayMap.set(day.trim().toLowerCase(), hours); // Guardar el día y las horas correctamente
                        }
                    });
                
                    // Verificar si el horario está disponible para el día actual
                    if (dayMap.has(currentDayFormatted)) {
                        const hours = dayMap.get(currentDayFormatted);
                        if (hours && hours !== 'Cerrado' && hours.trim() !== '') {
                            const timeRanges = hours.split(',').map((range:any) => range.trim());
                            for (const range of timeRanges) {
                                const parts = range.split('-').map((time:any) => time && time.trim());
                                if (parts.length !== 2) continue;
                
                                const [aperturaStr, cierreStr] = parts;
                                if (aperturaStr && cierreStr && /^\d{2}:\d{2}$/.test(aperturaStr) && /^\d{2}:\d{2}$/.test(cierreStr)) {
                                    const [aperturaHora, aperturaMin] = aperturaStr.split(':').map(Number);
                                    const [cierreHora, cierreMin] = cierreStr.split(':').map(Number);
                
                                    const apertura = new Date(currentTime);
                                    apertura.setHours(aperturaHora, aperturaMin, 0);
                
                                    const cierre = new Date(currentTime);
                                    cierre.setHours(cierreHora, cierreMin, 0);
                
                                    if (currentTime >= apertura && currentTime <= cierre) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                
                    return false; // Si no hay horarios o está cerrado
                }

                // Procesar los resultados para agregar el estado de apertura/cierre
                const processedResults = rows.map(salon => {
                    const is_open = isOpen(salon.hours_old, currentDay, currentTime);
                    return { ...salon, is_open };
                });
                

                connection.commit((err) => {
                    if (err) {
                        console.error("Error al hacer commit:", err);
                        return connection.rollback(() => {
                            res.status(500).json({ error: "Error al buscar el servicio." });
                        });
                    }

                    res.json(processedResults);
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
