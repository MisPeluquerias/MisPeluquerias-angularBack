import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import { QueryError, RowDataPacket } from "mysql2";
import decodeToken from "../../functions/decodeToken";
import { Request, Response } from "express";
import verifyToken from "../../token/token";
import { OkPacket } from "mysql2";

const router = express.Router();
router.use(bodyParser.json());

router.get("/searchByCityById", async (req, res) => {
  try {
    const { id_city, id_user } = req.query;
    //console.log("Id de la ciudad:", id_city, "Id del usuario:", id_user);

    if (!id_city) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_city' es requerido." });
    }

    const decodedUserId =
      typeof id_user === "string" ? decodeToken(id_user) : null;
    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta SQL con JOIN condicional basado en id_user
    const query = `
    SELECT s.id_salon, s.longitud, s.latitud, s.name AS name, s.address, s.image, s.hours_old,
      GROUP_CONCAT(DISTINCT categories.categories ORDER BY categories.categories SEPARATOR ', ') AS categories,
      ${decodedUserId ? "user_favourite.id_user_favourite," : ""}
      ${
        decodedUserId
          ? "IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite,"
          : ""
      }
      c.name AS city_name
    FROM salon s
    ${
      decodedUserId
        ? "LEFT JOIN user_favourite ON s.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?"
        : ""
    }
    LEFT JOIN categories ON s.id_salon = categories.id_salon
    INNER JOIN city c ON s.id_city = c.id_city
    WHERE c.name = (
      SELECT name
      FROM city
      WHERE id_city = ?
    )
    GROUP BY s.id_salon;
  `;

    // Configurar los parámetros para la consulta dependiendo de si `id_user` existe
    const queryParams = decodedUserId ? [decodedUserId, id_city] : [id_city];

    connection.query(query, queryParams, (error, results) => {
      if (error) {
        console.error("Error al buscar los salones:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar los salones." });
        });
      }

      const rows = results as any[];

      // Obtener el día y hora actuales
      const currentDay = new Date().toLocaleString("es-ES", {
        weekday: "long",
      });
      const currentTime = new Date();

      function isOpen(hoursOld: any, currentDay: any, currentTime: any) {
        const daysOfWeek = [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo",
        ];

        if (!hoursOld || !currentDay || !currentTime) {
          return false;
        }

        const dayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
        if (dayIndex === -1) return false;

        const currentDayFormatted = daysOfWeek[dayIndex];
        const dayMap = new Map();
        const days = hoursOld.split(";");

        days.forEach((dayEntry: any) => {
          const [day, ...hoursArr] = dayEntry.split(":");
          const hours = hoursArr.join(":").trim();
          if (day && hours) {
            dayMap.set(day.trim().toLowerCase(), hours);
          }
        });

        if (dayMap.has(currentDayFormatted)) {
          const hours = dayMap.get(currentDayFormatted);
          if (hours && hours !== "Cerrado") {
            const timeRanges = hours
              .split(",")
              .map((range: any) => range.trim());

            for (const range of timeRanges) {
              const [aperturaStr, cierreStr] = range
                .split("-")
                .map((time: any) => time && time.trim());
              if (aperturaStr && cierreStr) {
                const [aperturaHora, aperturaMin] = aperturaStr
                  .split(":")
                  .map(Number);
                const [cierreHora, cierreMin] = cierreStr
                  .split(":")
                  .map(Number);

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

        return false;
      }

      // Procesar los resultados para agregar el estado de apertura/cierre
      const processedResults = rows.map((salon: any) => {
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

        res.json(processedResults);
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});

router.get("/searchByCityAndCategory", async (req, res) => {
  try {
    const { id_city, categoria, id_user } = req.query;

    if (!id_city || !categoria) {
      return res.status(400).json({
        error: "Los parámetros 'id_city' y 'categoria' son requeridos.",
      });
    }

    const decodedUserId =
      typeof id_user === "string" ? decodeToken(id_user) : null;

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta con INNER JOIN para obtener los salones en la ciudad específica y la categoría deseada
    const query = `
      SELECT s.id_salon, s.longitud, s.latitud, s.name, s.address, s.image, s.hours_old,
      ${
        decodedUserId
          ? "user_favourite.id_user_favourite"
          : "NULL AS id_user_favourite"
      },
             ${
               decodedUserId
                 ? "IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite"
                 : "false AS is_favorite"
             }
      FROM salon s
      INNER JOIN city c ON s.id_city = c.id_city
      INNER JOIN categories cat ON s.id_salon = cat.id_salon
      ${
        decodedUserId
          ? "LEFT JOIN user_favourite ON s.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?"
          : ""
      }
      WHERE c.name = (
        SELECT name
        FROM city
        WHERE id_city = ?
      )
      AND cat.categories = ?
    `;

    const queryParams = decodedUserId
      ? [decodedUserId, id_city, categoria]
      : [id_city, categoria];

    connection.query(query, queryParams, (error, results) => {
      if (error) {
        console.error("Error al buscar los salones:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar los salones." });
        });
      }

      const rows = results as any[];

      // Obtener el día y hora actuales
      const currentDay = new Date().toLocaleString("es-ES", {
        weekday: "long",
      });
      const currentTime = new Date();

      function isOpen(hoursOld: any, currentDay: any, currentTime: any) {
        const daysOfWeek = [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo",
        ];

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
        const days = hoursOld.split(";");

        days.forEach((dayEntry: any) => {
          const [day, ...hoursArr] = dayEntry.split(":");
          const hours = hoursArr.join(":").trim();
          if (day && hours) {
            dayMap.set(day.trim().toLowerCase(), hours);
          }
        });

        if (dayMap.has(currentDayFormatted)) {
          const hours = dayMap.get(currentDayFormatted);
          if (hours && hours !== "Cerrado") {
            const timeRanges = hours
              .split(",")
              .map((range: any) => range.trim());

            for (const range of timeRanges) {
              const [aperturaStr, cierreStr] = range
                .split("-")
                .map((time: any) => time && time.trim());
              if (aperturaStr && cierreStr) {
                const [aperturaHora, aperturaMin] = aperturaStr
                  .split(":")
                  .map(Number);
                const [cierreHora, cierreMin] = cierreStr
                  .split(":")
                  .map(Number);

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
      const processedResults = rows.map((salon: any) => {
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
        res.json(processedResults);
      });
    });
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});




router.get("/searchByCityName", async (req, res) => {
  try {
    const { name, categoria, id_user } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ error: "El parámetro 'name' es requerido." });
    }

    const decodedUserId =
      typeof id_user === "string" ? decodeToken(id_user) : null;

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Construir la consulta SQL con `name` como filtro obligatorio y `categoria` opcional
    let getSalonsQuery = `
  SELECT s.id_salon, s.longitud, s.latitud, s.name, s.address, s.image, s.hours_old,
         GROUP_CONCAT(categories.categories SEPARATOR ', ') AS categories,
         ${
           decodedUserId
             ? "user_favourite.id_user_favourite"
             : "NULL AS id_user_favourite"
         },
         ${
           decodedUserId
             ? "IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite"
             : "false AS is_favorite"
         }
  FROM salon s
  LEFT JOIN categories ON s.id_salon = categories.id_salon
  INNER JOIN city ON s.id_city = city.id_city
  INNER JOIN province ON city.id_province = province.id_province
  ${
    decodedUserId
      ? "LEFT JOIN user_favourite ON s.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?"
      : ""
  }
  WHERE province.name = ?
  AND s.longitud IS NOT NULL
  AND s.latitud IS NOT NULL
`;

    const queryParams = decodedUserId ? [decodedUserId, name] : [name];

    // Agregar filtro por `categoria` si está definido
    if (categoria) {
      getSalonsQuery += " AND categories.categories = ?";
      queryParams.push(categoria);
    }

    // Agregar `GROUP BY` al final de la consulta
    getSalonsQuery += " GROUP BY s.id_salon";

    // Ejecutar la consulta
    connection.query(getSalonsQuery, queryParams, (error, results) => {
      if (error) {
        console.error("Error al buscar los salones:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar los salones." });
        });
      }

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(404).json({
          error:
            "No se encontraron salones en la provincia y categoría proporcionadas.",
        });
      }

      // Asegurarnos de que `results` tenga las propiedades esperadas forzando el tipo
      const rows = results as any[];

      // Obtener el día y hora actuales
      const currentDay = new Date().toLocaleString("es-ES", {
        weekday: "long",
      });
      const currentTime = new Date();

      // Función `isOpen` para verificar si un salón está abierto
      function isOpen(hoursOld: any, currentDay: any, currentTime: any) {
        const daysOfWeek = [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo",
        ];

        if (!hoursOld) {
          return false;
        }

        const dayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
        if (dayIndex === -1) return false;

        const currentDayFormatted = daysOfWeek[dayIndex];
        const dayMap = new Map();
        const days = hoursOld.split(";");

        days.forEach((dayEntry: any) => {
          const [day, ...hoursArr] = dayEntry.split(":");
          const hours = hoursArr.join(":").trim();
          if (day && hours) {
            dayMap.set(day.trim().toLowerCase(), hours);
          }
        });

        if (dayMap.has(currentDayFormatted)) {
          const hours = dayMap.get(currentDayFormatted);
          if (hours && hours !== "Cerrado" && hours.trim() !== "") {
            const timeRanges = hours
              .split(",")
              .map((range: any) => range.trim());
            for (const range of timeRanges) {
              const [aperturaStr, cierreStr] = range
                .split("-")
                .map((time: any) => time && time.trim());
              if (aperturaStr && cierreStr) {
                const [aperturaHora, aperturaMin] = aperturaStr
                  .split(":")
                  .map(Number);
                const [cierreHora, cierreMin] = cierreStr
                  .split(":")
                  .map(Number);

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

        return false;
      }

      // Procesar los resultados para agregar el estado de apertura/cierre
      const processedResults = rows.map((salon) => {
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
        res.json({ salons: processedResults }); // Enviar los resultados procesados con `is_open`
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

    connection.query<RowDataPacket[]>(
      getSalonsByNameQuery,
      [searchName],
      (error, results) => {
        if (error) {
          console.error("Error al buscar los salones por nombre:", error);
          return res
            .status(500)
            .json({ error: "Error al buscar los salones por nombre." });
        }

        if (results.length === 0) {
          return res.status(404).json({
            error: "No se encontraron salones con el nombre proporcionado.",
          });
        }

        res.json(results);
      }
    );
  } catch (err) {
    console.error("Error al buscar el servicio:", err);
    res.status(500).json({ error: "Error al buscar el servicio." });
  }
});

router.get("/searchSalonByService", (req, res) => {
  const { id_city, name, province_name, id_user } = req.query;
  /*console.log(
    "Id de la ciudad:",
    id_city,
    "Nombre del subservicio:",
    name,
    "Nombre de la provincia:",
    province_name
  );
*/

  const decodedUserId =
    typeof id_user === "string" ? decodeToken(id_user) : null;

  console.log("Id del usuario decodificado:", decodedUserId);

  const query = `
 SELECT s.id_salon, s.name, s.latitud, s.longitud, s.address, s.hours_old, s.image, 
       c.name AS city_name, st.name AS subservice_name, p.name AS province_name
       ${
         decodedUserId
           ? ", (SELECT id_user_favourite FROM user_favourite WHERE user_favourite.id_salon = s.id_salon LIMIT 1) AS id_user_favourite"
           : ""
       }
       ${
         decodedUserId
           ? ", (SELECT IF(COUNT(user_favourite.id_user) > 0, true, false) FROM user_favourite WHERE user_favourite.id_salon = s.id_salon) AS is_favorite"
           : ""
       }
FROM salon s
INNER JOIN salon_service_type sst ON s.id_salon = sst.id_salon
INNER JOIN service_type st ON sst.id_service_type = st.id_service_type
INNER JOIN city c ON s.id_city = c.id_city
INNER JOIN province p ON c.id_province = p.id_province
WHERE st.name LIKE ? AND (c.id_city = ? OR p.name LIKE ?)
`;

  // Iniciar la transacción
  connection.beginTransaction((err) => {
    if (err) {
      console.error("Error iniciando la transacción:", err);
      return res.status(500).send("Error en el servidor.");
    }

    // Ejecutar la consulta
    connection.query(
      query,
      [`%${name}%`, id_city, `%${province_name}%`],
      (err, results) => {
        if (err) {
          console.error("Error ejecutando la consulta:", err);

          // Si hay un error, hacer un rollback
          return connection.rollback(() => {
            res.status(500).send("Error en el servidor.");
          });
        }

        // Aseguramos que `results` es de tipo RowDataPacket[]
        const rows = results as RowDataPacket[];

        // Obtener el día y hora actuales
        const currentDay = new Date().toLocaleString("es-ES", {
          weekday: "long",
        });
        const currentTime = new Date();

        function isOpen(hoursOld: any, currentDay: any, currentTime: any) {
          const daysOfWeek = [
            "lunes",
            "martes",
            "miércoles",
            "jueves",
            "viernes",
            "sábado",
            "domingo",
          ];

          // Verificar si `hoursOld` es nulo o vacío
          if (!hoursOld) {
            return false;
          }

          // Convertir `currentDay` a índice numérico si se pasa como texto
          if (typeof currentDay === "string") {
            currentDay = daysOfWeek.indexOf(currentDay.toLowerCase());
          }

          // Validación del índice de `currentDay`
          if (
            typeof currentDay !== "number" ||
            currentDay < 0 ||
            currentDay > 6
          ) {
            return false;
          }

          const currentDayFormatted = daysOfWeek[currentDay].toLowerCase();
          const dayMap = new Map();
          const days = hoursOld.split(";"); // Separar los días por `;`

          days.forEach((dayEntry: any) => {
            const [day, ...hoursArr] = dayEntry.split(":"); // Separar el día de las horas
            const hours = hoursArr.join(":").trim(); // Volver a unir y limpiar las horas
            if (day && hours) {
              dayMap.set(day.trim().toLowerCase(), hours); // Guardar el día y las horas correctamente
            }
          });

          // Verificar si el horario está disponible para el día actual
          if (dayMap.has(currentDayFormatted)) {
            const hours = dayMap.get(currentDayFormatted);
            if (hours && hours !== "Cerrado" && hours.trim() !== "") {
              const timeRanges = hours
                .split(",")
                .map((range: any) => range.trim());
              for (const range of timeRanges) {
                const parts = range
                  .split("-")
                  .map((time: any) => time && time.trim());
                if (parts.length !== 2) continue;

                const [aperturaStr, cierreStr] = parts;
                if (
                  aperturaStr &&
                  cierreStr &&
                  /^\d{2}:\d{2}$/.test(aperturaStr) &&
                  /^\d{2}:\d{2}$/.test(cierreStr)
                ) {
                  const [aperturaHora, aperturaMin] = aperturaStr
                    .split(":")
                    .map(Number);
                  const [cierreHora, cierreMin] = cierreStr
                    .split(":")
                    .map(Number);

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
        const processedResults = rows.map((salon) => {
          const is_open = isOpen(salon.hours_old, currentDay, currentTime);
          return { ...salon, is_open };
        });

        // Si todo sale bien, hacer commit
        connection.commit((err) => {
          if (err) {
            console.error("Error haciendo commit:", err);
            return connection.rollback(() => {
              res.status(500).send("Error en el servidor.");
            });
          }

          // Enviar los resultados si el commit es exitoso
          res.json(processedResults);
          //console.log("Resultados devueltos:", processedResults);
        });
      }
    );
  });
});

router.get("/getFilterCategories", async (req, res) => {
  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error starting transaction",
        error: err,
      });
    }

    // Usar DISTINCT para seleccionar solo servicios únicos por nombre
    const query = "SELECT DISTINCT categories FROM categories";

    connection.query(query, (err, results) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: err,
          });
        });
      }

      connection.commit((err) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({
              success: false,
              message: "Error committing transaction",
              error: err,
            });
          });
        }
        res.json(results);
      });
    });
  });
});

router.delete(
  "/delete-favorite/:id_user_favorite",
  verifyToken,
  async (req: Request, res: Response) => {
    const { id_user_favorite } = req.params;

    if (!id_user_favorite) {
      return res
        .status(400)
        .json({ error: "id_user_favorite parameter is required" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Transaction error:", err);
        return res.status(500).json({ error: "Failed to start transaction" });
      }

      const query = "DELETE FROM user_favourite WHERE id_user_favourite = ?";
      connection.query(
        query,
        [id_user_favorite],
        (error, results: OkPacket) => {
          if (error) {
            return connection.rollback(() => {
              console.error("Delete error:", error);
              return res
                .status(500)
                .json({ error: "Failed to delete favorite" });
            });
          }

          if (results.affectedRows === 0) {
            return connection.rollback(() => {
              console.error("No rows affected");
              return res.status(404).json({ error: "Favorite not found" });
            });
          }

          connection.commit((commitErr) => {
            if (commitErr) {
              return connection.rollback(() => {
                console.error("Commit error:", commitErr);
                return res
                  .status(500)
                  .json({ error: "Failed to commit transaction" });
              });
            }
            return res.status(200).json({
              message: "Favorite deleted successfully",
            });
          });
        }
      );
    });
  }
);


export default router;
