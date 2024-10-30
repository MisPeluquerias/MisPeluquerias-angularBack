import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import { RowDataPacket } from "mysql2";
import { verify } from "jsonwebtoken";
import verifyToken from "../../token/token";

const router = express.Router();
router.use(bodyParser.json());


router.get("/getSalonValidated", async (req, res) => {
  try {
    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(null);
      });
    });

    const query = `
      SELECT *
      FROM salon
      WHERE state = 'Validado'
      ORDER BY RAND()
      LIMIT 10
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error al buscar los salones validados:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar los salones validados." });
        });
      }

      const rows = results as any[];

      // Obtener el día y hora actuales
      const currentDay = new Date().toLocaleString('es-ES', { weekday: 'long' });
      const currentTime = new Date();

      function isOpen(hoursOld: any, currentDay: any, currentTime: any) {
        const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
        // Verificar si `hoursOld`, `currentDay` o `currentTime` son nulos o indefinidos
        if (!hoursOld || !currentDay || !currentTime) {
            return false;
        }
    
        // Convertir currentDay a índice numérico si se pasa como texto
        const dayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
    
        // Validación del índice de currentDay
        if (dayIndex === -1) return false;
    
        const currentDayFormatted = daysOfWeek[dayIndex];
        const dayMap = new Map();
        const days = hoursOld.split(';');
    
        days.forEach((dayEntry: any) => {
            const [day, ...hoursArr] = dayEntry.split(':');
            const hours = hoursArr.join(':').trim();
            if (day && hours) {
                dayMap.set(day.trim().toLowerCase(), hours);
            }
        });
    
        if (dayMap.has(currentDayFormatted)) {
            const hours = dayMap.get(currentDayFormatted);
            if (hours && hours !== 'Cerrado') {
                const timeRanges = hours.split(',').map((range: any) => range.trim());
    
                for (const range of timeRanges) {
                    const [aperturaStr, cierreStr] = range.split('-').map((time: any) => time && time.trim());
                    if (aperturaStr && cierreStr) {
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
      const processedResults = rows.map((salon:any) => {
        const is_open = isOpen(salon.hours_old, currentDay, currentTime);
        return { ...salon, is_open };
      });

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al hacer commit." });
          });
        }

        res.json(processedResults); // Enviar los resultados procesados con `is_open`
      });
    });
  } catch (err) {
    console.error("Error al buscar los salones validados:", err);
    res.status(500).json({ error: "Error al buscar los salones validados." });
  }
});



export default router;