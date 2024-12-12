import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
import decodeToken from "../../functions/decodeToken";
import { RowDataPacket } from "mysql2";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ResultSetHeader } from "mysql2";
import verifyToken from "../../token/token";

const uploadDir = path.join(__dirname, "../../../dist/uploads-curriculums");

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
  },
});

const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const { id, id_user } = req.query;

    const decodedUserId =
      typeof id_user === "string" ? decodeToken(id_user) : null;

    //console.log(decodedUserId);
    if (!id) {
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

    // Modificar la consulta para usar zip_code
    const query = `
    SELECT 
      s.id_salon, 
      s.state, 
      s.longitud, 
      s.latitud, 
      s.name AS name, 
      s.address, 
      s.image, 
      s.phone,
      s.whatsapp_phone, 
      s.email, 
      s.hours_old, 
      s.url,
      s.facebook_url, 
      s.instagram_url, 
      s.tiktok_url, 
      s.youtube_url,
      ${decodedUserId ? "user_favourite.id_user_favourite," : ""}
      ${
        decodedUserId
          ? "IF(user_favourite.id_user IS NOT NULL, true, false) AS is_favorite,"
          : "false AS is_favorite,"
      }
      c.name AS city_name
    FROM salon s
    ${
      decodedUserId
        ? "LEFT JOIN user_favourite ON s.id_salon = user_favourite.id_salon AND user_favourite.id_user = ?"
        : ""
    }
    INNER JOIN city c ON s.id_city = c.id_city
    WHERE s.id_salon = ?
    GROUP BY s.id_salon;
  `;

    const queryParams = decodedUserId ? [decodedUserId, id] : [id];

    connection.query(query, queryParams, (error, results) => {
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


router.get("/loadReview", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
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

    // Modificar la consulta para usar zip_code
    const query = `
      SELECT id_review, id_user, observacion,qualification
      FROM review
      WHERE id_salon = ? 
    `;

    connection.query(query, [id], (error, results) => {
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

router.get("/getScoreReviews", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ error: "El parámetro 'salon_id' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta para obtener promedios y total de reseñas
    const queryAvg = `
      SELECT 
        AVG(servicio) AS avg_servicio,
        AVG(calidad_precio) AS avg_calidad_precio,
        AVG(limpieza) AS avg_limpieza,
        AVG(puntualidad) AS avg_puntualidad,
        AVG(qualification) AS avg_qualification,
        COUNT(*) AS total_reviews
      FROM review
      WHERE id_salon = ?
    `;

    // Consulta adicional para obtener el número de cada calificación (1 a 5)
    const queryCount = `
     SELECT 
      COUNT(CASE WHEN qualification >= 1 AND qualification < 2 THEN 1 END) AS pesimo,
      COUNT(CASE WHEN qualification >= 2 AND qualification < 3 THEN 1 END) AS malo,
      COUNT(CASE WHEN qualification >= 3 AND qualification < 4 THEN 1 END) AS normal,
      COUNT(CASE WHEN qualification >= 4 AND qualification < 5 THEN 1 END) AS muy_bueno,
      COUNT(CASE WHEN qualification = 5 THEN 1 END) AS excelente,
      COUNT(*) AS total_reviews
      FROM review
      WHERE id_salon = ?
    `;

    // Ejecutar ambas consultas con conversión de tipos
    const [resultsAvg, resultsCount] = await Promise.all([
      new Promise((resolve, reject) => {
        connection.query(queryAvg, [id], (error, results) => {
          if (error) return reject(error);
          resolve(results as any[]); // Conversión a any[]
        });
      }),
      new Promise((resolve, reject) => {
        connection.query(queryCount, [id], (error, results) => {
          if (error) return reject(error);
          resolve(results as any[]); // Conversión a any[]
        });
      }),
    ]);

    const rowAvg = (resultsAvg as any[])[0];
    const rowCount = (resultsCount as any[])[0];

    // Función para redondear a medios
    function redondearAMedios(numero: number) {
      return Math.round(numero * 2) / 2;
    }

    // Calcular los porcentajes de cada calificación
    if (rowCount && rowCount.total_reviews > 0) {
      const pesimo_percentage =
        (rowCount.pesimo / rowCount.total_reviews) * 100;
      const malo_percentage = (rowCount.malo / rowCount.total_reviews) * 100;
      const normal_percentage =
        (rowCount.normal / rowCount.total_reviews) * 100;
      const muy_bueno_percentage =
        (rowCount.muy_bueno / rowCount.total_reviews) * 100;
      const excelente_percentage =
        (rowCount.excelente / rowCount.total_reviews) * 100;

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al realizar commit." });
          });
        }

        // Responder con ambas consultas
        res.json({
          promedio_servicio: rowAvg.avg_servicio
            ? rowAvg.avg_servicio.toFixed(2)
            : "0.00",
          promedio_calidad_precio: rowAvg.avg_calidad_precio
            ? rowAvg.avg_calidad_precio.toFixed(2)
            : "0.00",
          promedio_limpieza: rowAvg.avg_limpieza
            ? rowAvg.avg_limpieza.toFixed(2)
            : "0.00",
          promedio_puntualidad: rowAvg.avg_puntualidad
            ? rowAvg.avg_puntualidad.toFixed(2)
            : "0.00",
          promedio_qualification:
            redondearAMedios(rowAvg.avg_qualification) || 0,
          total_reviews: rowAvg.total_reviews || 0,
          porcentajes: {
            pesimo: pesimo_percentage.toFixed(2),
            malo: malo_percentage.toFixed(2),
            normal: normal_percentage.toFixed(2),
            muy_bueno: muy_bueno_percentage.toFixed(2),
            excelente: excelente_percentage.toFixed(2),
          },
        });
      });
    } else {
      res
        .status(404)
        .json({ message: "No se encontraron valoraciones para el salón." });
    }
  } catch (err) {
    console.error("Error al buscar las valoraciones en el salón:", err);
    res
      .status(500)
      .json({ error: "Error al buscar las valoraciones en el salón." });
  }
});

router.get("/getObservationReviews", async (req, res) => {
  try {
    const { id_salon } = req.query;
    const page = parseInt(req.query.page as string) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit as string) || 2; // Cantidad de reseñas por página (por defecto 2)
    const offset = (page - 1) * limit; // Calcular el offset

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_salon' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta para contar el número total de reseñas (agregado)
    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM review
      WHERE id_salon = ?
    `;

    // Ejecutar la consulta para obtener el total de reseñas
    const totalResult: any = await new Promise((resolve, reject) => {
      connection.query(totalQuery, [id_salon], (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });

    const total = totalResult[0].total; // Total de reseñas

    // Modificar la consulta para incluir paginación (LIMIT y OFFSET)
    const query = `
      SELECT *
      FROM review
      WHERE id_salon = ?
      LIMIT ? OFFSET ?
    `;

    connection.query(query, [id_salon, limit, offset], (error, results) => {
      if (error) {
        console.error("Error al buscar las reseñas:", error);
        return connection.rollback(() => {
          res
            .status(500)
            .json({ error: "Error al buscar las reseñas en el salón." });
        });
      }

      // Verificar que results sea un array de RowDataPacket[]
      if (Array.isArray(results)) {
        // Mapear los resultados para agregar la recomendación basada en la calificación
        const modifiedResults = results.map((review) => {
          // Solo procesamos si el objeto tiene la propiedad 'qualification'
          if ("qualification" in review) {
            // Función para determinar la recomendación basada en la calificación
            let recommendation = "";
            switch (parseInt(review.qualification, 10)) {
              case 5:
                recommendation = "Altamente Recomendado";
                break;
              case 4:
                recommendation = "Muy Recomendado";
                break;
              case 3:
                recommendation = "Recomendado";
                break;
              case 2:
                recommendation = "Poco Recomendado";
                break;
              case 1:
                recommendation = "No Recomendado";
                break;
              default:
                recommendation = "Sin clasificación";
            }

            return {
              ...review,
              recommendation, // Agregar la recomendación basada en la calificación
            };
          } else {
            // Manejo de caso donde no exista 'qualification'
            return {
              ...review,
              recommendation: "Sin clasificación",
            };
          }
        });

        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res
                .status(500)
                .json({ error: "Error al confirmar la transacción." });
            });
          }

          // Enviar la respuesta con la recomendación y el total de reseñas
          res.json({
            page, // Página actual
            limit, // Límite por página
            total, // Total de reseñas (nuevo campo)
            results: modifiedResults, // Reseñas de la página actual
          });
        });
      } else {
        // Manejo del caso donde los resultados no sean un array (posible OkPacket)
        console.error("Error: resultados no son un array.");
        res.status(500).json({ error: "Resultados no válidos." });
      }
    });
  } catch (err) {
    console.error("Error al buscar las reseñas en el salón:", err);
    res.status(500).json({ error: "Error al buscar las reseñas en el salón." });
  }
});

router.post("/addReview", async (req, res) => {
  try {
    // Usar req.body para obtener los datos enviados en el cuerpo de la solicitud
    const {
      id_user,
      id_salon,
      observacion,
      qualification,
      averageQualification,
    } = req.body;

    // Decodifica el token para obtener el usuarioId
    const usuarioId = decodeToken(id_user);
    if (!usuarioId) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    // Asegúrate de que qualification sea un objeto o un string parseable a objeto
    const { service, quality, cleanliness, speed } = JSON.parse(qualification);

    // Verificar que todos los campos requeridos estén presentes
    if (
      !id_salon ||
      !observacion ||
      !service ||
      !quality ||
      !cleanliness ||
      !speed
    ) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Insertar la reseña con las calificaciones individuales
    const query = `
      INSERT INTO review (id_user, id_salon, observacion, servicio, calidad_precio, limpieza, puntualidad, qualification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      query,
      [
        usuarioId,
        id_salon,
        observacion,
        service,
        quality,
        cleanliness,
        speed,
        averageQualification,
      ],
      (error, results) => {
        if (error) {
          console.error("Error al guardar la reseña:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al guardar la reseña." });
          });
        }

        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al hacer commit." });
            });
          }

          res.json({ message: "Reseña guardada exitosamente." });
        });
      }
    );
  } catch (err) {
    console.error("Error al guardar la reseña:", err);
    res.status(500).json({ error: "Error al guardar la reseña." });
  }
});

router.get("/getFaqs", async (req, res) => {
  try {
    const { id_salon } = req.query;
    const page = parseInt(req.query.page as string) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit as string) || 4; // Cantidad de preguntas por página (por defecto 4)
    const offset = (page - 1) * limit; // Calcular el desplazamiento

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_salon' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Primero obtener el número total de FAQs
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM faq
      WHERE id_salon = ?
    `;

    connection.query(
      countQuery,
      [id_salon],
      (error, countResult: RowDataPacket[]) => {
        if (error) {
          console.error("Error al contar las preguntas:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al contar las preguntas." });
          });
        }

        const totalFaqs = (countResult[0] as { total: number }).total;
        const totalPages = Math.ceil(totalFaqs / limit);

        // Ahora obtener los FAQs con paginación
        const faqQuery = `
        SELECT *
        FROM faq
        WHERE id_salon = ?
        LIMIT ? OFFSET ?
      `;

        connection.query(
          faqQuery,
          [id_salon, limit, offset],
          (error, results: RowDataPacket[]) => {
            if (error) {
              console.error("Error al buscar las preguntas:", error);
              return connection.rollback(() => {
                res
                  .status(500)
                  .json({ error: "Error al buscar las preguntas." });
              });
            }

            // Hacer commit de la transacción
            connection.commit((err) => {
              if (err) {
                console.error("Error al hacer commit:", err);
                return connection.rollback(() => {
                  res.status(500).json({ error: "Error al hacer commit." });
                });
              }

              // Respuesta con los FAQs paginados y la información adicional
              res.json({
                currentPage: page,
                totalPages: totalPages,
                totalFaqs: totalFaqs,
                faqs: results,
              });
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Error al buscar las preguntas:", err);
    res.status(500).json({ error: "Error al buscar las preguntas." });
  }
});

router.get("/getDescriptionSalon", async (req, res) => {
  try {
    const { id_salon } = req.query;

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parametro id_salon es requerido." });
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
      SELECT about_us
      FROM salon
      WHERE id_salon = ? 
    `;

    connection.query(query, [id_salon], (error, results) => {
      if (error) {
        console.error("Error al buscar el servicio:", error);
        return connection.rollback(() => {
          res
            .status(500)
            .json({ error: "Error al buscar la descripción del salón." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res
              .status(500)
              .json({ error: "Error al buscar la descripcion del salón." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar la descripción del salón:", err);
    res
      .status(500)
      .json({ error: "Error al buscar la descripción del salón." });
  }
});

router.post("/deleteReview", async (req, res) => {
  try {
    const { id_review } = req.body;

    if (!id_review) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_review' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Eliminar la reseña
    const query = `DELETE FROM review WHERE id_review = ?`;

    connection.query(query, [id_review], (error, results) => {
      if (error) {
        console.error("Error al eliminar la reseña:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al eliminar la reseña." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al hacer commit." });
          });
        }

        res.json({ message: "Reseña eliminada exitosamente." });
      });
    });
  } catch (err) {
    console.error("Error al eliminar la reseña:", err);
    res.status(500).json({ error: "Error al eliminar la reseña." });
  }
});

router.post("/updateReview", async (req, res) => {
  try {
    const { id_review, observacion, qualification } = req.body;
    if (!id_review || !observacion || !qualification) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    }

    // Validar que `qualification` tenga las propiedades esperadas
    const { service, quality, cleanliness, speed } = qualification;
    if (
      typeof service !== "number" ||
      typeof quality !== "number" ||
      typeof cleanliness !== "number" ||
      typeof speed !== "number"
    ) {
      return res
        .status(400)
        .json({ error: "Los valores de calificación son inválidos." });
    }

    // Función para redondear a medios
    const redondearAMedios = (numero: number) => {
      return Math.round(numero * 2) / 2;
    };

    // Calcular el promedio de la calificación y redondearlo a medios
    const averageQualification = redondearAMedios(
      (service + quality + cleanliness + speed) / 4
    );

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Actualizar la reseña en la base de datos con el promedio redondeado
    const query = `
      UPDATE review
      SET observacion = ?, servicio = ?, calidad_precio = ?, limpieza = ?, puntualidad = ?, qualification = ?
      WHERE id_review = ?
    `;

    // Ejecutar la consulta de actualización
    connection.query(
      query,
      [
        observacion,
        service,
        quality,
        cleanliness,
        speed,
        averageQualification, // Guardar el promedio calculado y redondeado
        id_review,
      ],
      (error, results) => {
        if (error) {
          console.error("Error al actualizar la reseña:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al actualizar la reseña." });
          });
        }

        // Confirmar la transacción
        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al hacer commit." });
            });
          }

          res.json({ message: "Reseña actualizada exitosamente." });
        });
      }
    );
  } catch (err) {
    console.error("Error al actualizar la reseña:", err);
    res.status(500).json({ error: "Error al actualizar la reseña." });
  }
});

router.post("/addFaq", async (req, res) => {
  try {
    const { id_user, id_salon, question } = req.body;

    //console.log(req.body);

    if (!id_user || !id_salon || !question) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    }

    // Decodifica el token para obtener el usuarioId
    const usuarioId = decodeToken(id_user);
    if (!usuarioId) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    //console.log("ID de usuario decodificado:", usuarioId);

    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = `
      INSERT INTO faq (id_user, id_salon, question)
      VALUES (?, ?, ?)
    `;

    connection.query(
      query,
      [usuarioId, id_salon, question],
      (error, results) => {
        if (error) {
          console.error("Error al guardar la pregunta:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al guardar la pregunta." });
          });
        }

        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al hacer commit." });
            });
          }

          res.json({ message: "Pregunta guardada exitosamente." });
        });
      }
    );
  } catch (err) {
    console.error("Error al guardar la pregunta:", err);
    res.status(500).json({ error: "Error al guardar la pregunta." });
  }
});

// Endpoint para actualizar preguntas con respuestas
router.post("/updateQuestion", async (req, res) => {
  try {
    const { id_faq, question } = req.body;

    if (!id_faq || !question) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    }

    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = `
      UPDATE faq
      SET question = ?
      WHERE id_faq = ?
    `;

    connection.query(query, [question, id_faq], (error, results) => {
      if (error) {
        console.error("Error al actualizar la pregunta:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al actualizar la pregunta." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al hacer commit." });
          });
        }

        res.json({ message: "Pregunta actualizada exitosamente." });
      });
    });
  } catch (err) {
    console.error("Error al actualizar la pregunta:", err);
    res.status(500).json({ error: "Error al actualizar la pregunta." });
  }
});

// Endpoint para eliminar preguntas
router.post("/deleteQuestion", async (req, res) => {
  try {
    const { id_faq } = req.body;

    if (!id_faq) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_faq' es requerido." });
    }

    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    const query = `DELETE FROM faq WHERE id_faq = ?`;

    connection.query(query, [id_faq], (error, results) => {
      if (error) {
        console.error("Error al eliminar la pregunta:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al eliminar la pregunta." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al hacer commit." });
          });
        }

        res.json({ message: "Pregunta eliminada exitosamente." });
      });
    });
  } catch (err) {
    console.error("Error al eliminar la pregunta:", err);
    res.status(500).json({ error: "Error al eliminar la pregunta." });
  }
});

router.get("/getServicesSalon", async (req, res) => {
  try {
    const { id_salon } = req.query;

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_salon' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta para obtener los nombres de los servicios y los tipos de servicios relacionados por id_salon
    const query = `
      SELECT 
        sst.id_salon_service_type,
        sst.id_salon,
        sst.id_service,
        s.name AS service_name,
        sst.id_service_type,
        st.name AS service_type_name,
        sst.time,
        sst.price,
        sst.active
      FROM 
        salon_service_type sst
      INNER JOIN 
        service s ON s.id_service = sst.id_service
      INNER JOIN 
        service_type st ON st.id_service_type = sst.id_service_type
      WHERE 
        sst.id_salon = ?
      ORDER BY 
        s.name, st.name;
    `;

    // Ejecutar la consulta
    connection.query(query, [id_salon], (error, results: any[]) => {
      if (error) {
        console.error(
          "Error al cargar los servicios y tipos de servicios:",
          error
        );
        return connection.rollback(() => {
          res.status(500).json({
            error: "Error al cargar los servicios y tipos de servicios.",
          });
        });
      }

      // Asegúrate de que results es tratado como un arreglo de objetos
      const groupedServices = results.reduce((acc: any, service: any) => {
        const { service_name, service_type_name, time, price } = service;

        // Inicializa el array si el servicio no existe en el acumulador
        if (!acc[service_name]) {
          acc[service_name] = [];
        }

        // Agrega el subservicio al servicio correspondiente
        acc[service_name].push({
          subservice: service_type_name,
          time,
          price,
        });

        return acc;
      }, {});

      // Confirmar la transacción
      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res
              .status(500)
              .json({ error: "Error al confirmar la transacción." });
          });
        }

        // Devolver los resultados agrupados
        res.json(groupedServices);
      });
    });
  } catch (err) {
    console.error("Error al cargar los servicios y tipos de servicios:", err);
    res
      .status(500)
      .json({ error: "Error al cargar los servicios y tipos de servicios." });
  }
});

router.get("/getBrandsBySalon", (req, res) => {
  const id_salon = req.query.id_salon;

  // Validar que el id_salon está presente
  if (!id_salon) {
    return res.status(400).json({
      success: false,
      message: "El id_salon es requerido",
    });
  }

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({
        success: false,
        message: "Error starting transaction",
        error: err,
      });
    }

    const query = `
      SELECT bs.id_brand_salon, b.name, b.imagePath 
      FROM brands_salon bs
      INNER JOIN brands b ON bs.id_brand = b.id_brand
      WHERE bs.id_salon = ?`;

    connection.query(query, [id_salon], (err, results) => {
      if (err) {
        console.error("Error fetching brands:", err);
        return connection.rollback(() => {
          res.status(500).json({
            success: false,
            message: "Error fetching brands",
            error: err,
          });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error committing transaction:", err);
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

router.get("/searchFaqs", async (req, res) => {
  try {
    let { id_salon, searchText, page = "1", limit = "4" } = req.query;

    // Convertir page y limit a números de forma segura
    const pageAsNumber = parseInt(page as string, 10) || 1; // Si no es un número, asignar 1 por defecto
    const limitAsNumber = parseInt(limit as string, 10) || 4; // Si no es un número, asignar 4 por defecto

    const offset = (pageAsNumber - 1) * limitAsNumber; // Calcular el desplazamiento

    if (!id_salon) {
      return res
        .status(400)
        .json({ error: "El parámetro 'id_salon' es requerido." });
    }

    if (!searchText) {
      return res
        .status(400)
        .json({ error: "El parámetro 'searchText' es requerido." });
    }

    // Iniciar la transacción
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve(undefined);
      });
    });

    // Consulta para contar el total de FAQs que coinciden con el texto de búsqueda
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM faq
      WHERE id_salon = ? AND (question LIKE ? OR answer LIKE ?)
    `;

    const searchTerm = `%${searchText}%`;

    const countResult: any = await new Promise((resolve, reject) => {
      connection.query(
        countQuery,
        [id_salon, searchTerm, searchTerm],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });

    const totalFaqs = countResult[0].total;
    const totalPages = Math.ceil(totalFaqs / limitAsNumber);

    // Consulta para obtener los FAQs que coinciden con el texto de búsqueda con paginación
    const faqQuery = `
      SELECT *
      FROM faq
      WHERE id_salon = ? 
      AND (question LIKE ? OR answer LIKE ?)
      LIMIT ? OFFSET ?
    `;

    connection.query(
      faqQuery,
      [id_salon, searchTerm, searchTerm, limitAsNumber, offset],
      (error, results) => {
        if (error) {
          console.error("Error al buscar las preguntas:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar las preguntas." });
          });
        }

        connection.commit((err) => {
          if (err) {
            console.error("Error al hacer commit:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Error al hacer commit." });
            });
          }

          // Responder con los resultados y la información de paginación
          res.json({
            currentPage: pageAsNumber,
            totalPages: totalPages,
            totalFaqs: totalFaqs,
            faqs: results,
          });
        });
      }
    );
  } catch (err) {
    console.error("Error al buscar las preguntas:", err);
    res.status(500).json({ error: "Error al buscar las preguntas." });
  }
});

router.get("/getJobOffers", async (req: Request, res: Response) => {
  const { id } = req.query;
  const page = parseInt(req.query.page as string) || 1; // Página actual (por defecto 1)
  const limit = parseInt(req.query.limit as string) || 2; // Cantidad de ofertas por página (por defecto 2)
  const offset = (page - 1) * limit;

  if (!id) {
    return res.status(400).json({ error: "El ID del salón es requerido." });
  }

  try {
    //console.log('Id del salón recibida:', id);

    // Inicia la transacción
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Consulta para obtener las ofertas de trabajo con paginación
    const query = `
      SELECT *
      FROM jobs_offers 
      WHERE id_salon = ?
      LIMIT ? OFFSET ?;
    `;

    // Consulta para contar el total de ofertas de trabajo
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM jobs_offers
      WHERE id_salon = ?;
    `;

    // Realiza la consulta principal
    const offers: any[] = await new Promise((resolve, reject) => {
      connection.query(query, [id, limit, offset], (error, results: any) => {
        if (error) return reject(error);
        resolve(results);
      });
    });

    // Realiza la consulta para contar los registros
    const total: number = await new Promise((resolve, reject) => {
      connection.query(countQuery, [id], (error, results: any[]) => {
        if (error) return reject(error);
        resolve(results[0]?.total || 0);
      });
    });

    // Realiza el commit de la transacción
    await new Promise<void>((resolve, reject) => {
      connection.commit((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Responde con los resultados paginados y el total
    res.json({
      jobs: offers,
      total,
      currentPage: page,
      pageSize: limit,
    });
  } catch (err) {
    console.error("Error al procesar la solicitud:", err);

    // Manejo del rollback en caso de error
    connection.rollback(() => {
      res.status(500).json({ error: "Error interno en el servidor." });
    });
  }
});

router.post(
  "/addInscripcionJobOffer",
  verifyToken,
  upload.fields([{ name: "curriculum", maxCount: 1 }]), // Archivo del currículum
  (req, res) => {
    // Verificar si se subieron archivos
    if (!req.files) {
      return res.status(400).send("No se subieron archivos.");
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const curriculumFile = files["curriculum"] ? files["curriculum"][0].filename : null;

    // Construir la URL completa para el archivo del currículum
    const curriculumUrl = curriculumFile
      ? `${req.protocol}://${req.get("host")}/uploads-curriculums/${curriculumFile}`
      : null;

    // Extraer y validar los datos del cuerpo de la solicitud
    const {
      id_job_offer, // ID de la oferta de empleo
      id_user, // Token del usuario
      id_salon, // ID del salón
      description, // Descripción del interés del usuario
      privacy_policy, // Checkbox de política de privacidad
    } = req.body;

    //console.log(req.body);

    
    // Validar los datos del cuerpo de la solicitud
    if (!id_job_offer || !id_user || !id_salon || !description || !privacy_policy || !curriculumUrl) {
      return res.status(400).send("Faltan campos requeridos o el currículum no fue subido.");
    }

    // Decodificar el ID del usuario desde el token
    let usuarioId;
    try {
      usuarioId = decodeToken(id_user); // Decodificar el token para obtener el ID del usuario
    } catch (error) {
      return res.status(400).send("Token de usuario inválido.");
    }

    // Iniciar la transacción
    connection.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Error en el servidor al iniciar la transacción.");
      }

      const sql = `
        INSERT INTO user_job_subscriptions (
          id_job_offer, 
          id_user, 
          id_salon, 
          work_presentation, 
          path_curriculum, 
          privacy_policy,
          date_subscriptions
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW());
      `;

      // Ejecutar la consulta para insertar la inscripción
      connection.query(
        sql,
        [
          id_job_offer,
          usuarioId, // ID del usuario decodificado
          id_salon,
          description, // Usamos `description` como `work_presentation`
          curriculumUrl, // URL del archivo de currículum
          privacy_policy,
        ],
        (err, result) => {
          if (err) {
            return connection.rollback(() => {
              return res.status(500).send("Error al registrar la inscripción.");
            });
          }

          // Confirmar la transacción
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                return res.status(500).send("Error en el servidor al confirmar la transacción.");
              });
            }

            return res.status(200).json({ message: "Inscripción registrada con éxito" });

          });
        }
      );
    });
  }
);


router.get("/getSalonSchema", async (req, res) => {
  try {
    const { id_salon } = req.query;

    if (!id_salon) {
      return res.status(400).json({
        error: "El parámetro 'id_salon' es requerido.",
      });
    }

    // Iniciar la transacción
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Consulta para obtener los datos del salón
    const query = `
      SELECT 
        s.id_salon, 
        s.name, 
        s.address, 
        s.latitud, 
        s.longitud, 
        s.phone, 
        s.image, 
        s.about_us, 
        s.facebook_url, 
        s.instagram_url, 
        s.tiktok_url, 
        s.youtube_url, 
        AVG(r.qualification) AS avg_rating,
        COUNT(r.id_review) AS total_reviews
      FROM salon s
      LEFT JOIN review r ON s.id_salon = r.id_salon
      WHERE s.id_salon = ?
      GROUP BY s.id_salon
    `;

    // Ejecutar la consulta con parámetro genérico RowDataPacket[]
    connection.query<RowDataPacket[]>(query, [id_salon], (error, results) => {
      if (error) {
        console.error("Error al buscar el salón:", error);
        return connection.rollback(() => {
          res.status(500).json({ error: "Error al buscar el salón." });
        });
      }

      // Verificar si los resultados son un arreglo de filas
      if (!Array.isArray(results)) {
        return connection.rollback(() => {
          res.status(500).json({ error: "Resultados inesperados de la consulta." });
        });
      }

      if (results.length === 0) {
        return connection.rollback(() => {
          res.status(404).json({ error: "Salón no encontrado." });
        });
      }

      const salon = results[0]; // Obtenemos la primera fila de resultados

      // Generar el JSON-LD para Schema.org
      const schema: any = {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        "name": salon.name,
        "url": `https://www.mispeluquerias.com/centro/${salon.name}/${salon.id}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": salon.address,
          "addressCountry": "ES"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": salon.latitud,
          "longitude": salon.longitud
        },
        "telephone": salon.phone,
        "image": salon.image,
        "description": salon.about_us || "Información no disponible.",
        "sameAs": [
          salon.facebook_url || "",
          salon.instagram_url || "",
          salon.tiktok_url || "",
          salon.youtube_url || ""
        ]
      };
      
      // Agregar AggregateRating solo si los valores son válidos
      if (salon.avg_rating > 0 && salon.total_reviews > 0) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": salon.avg_rating,
          "reviewCount": salon.total_reviews
        };
      }
      

      // Confirmar la transacción
      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al confirmar la transacción." });
          });
        }

        // Responder con el JSON-LD
        res.json(schema);
      });
    });
  } catch (err) {
    console.error("Error al generar el Schema:", err);
    res.status(500).json({ error: "Error al generar el Schema." });
  }
});


router.delete("/deleteJobOffer/:id_job_offer", (req, res) => {
  const { id_job_offer } = req.params;

  // Validar el ID
  if (!id_job_offer || isNaN(Number(id_job_offer))) {
    return res.status(400).json({ message: "ID de la oferta no válido." });
  }

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar la transacción:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    // Obtener todas las rutas de currículos asociados al id_job_offer
    const selectSubscriptionsQuery =
      "SELECT path_curriculum FROM user_job_subscriptions WHERE id_job_offer = ?";

    connection.query<RowDataPacket[]>(selectSubscriptionsQuery, [id_job_offer], (selectErr, subscriptions) => {
      if (selectErr) {
        console.error("Error al obtener las suscripciones:", selectErr);
        return connection.rollback(() => {
          res.status(500).json({ message: "Error interno del servidor." });
        });
      }

      // Verificar si existen suscripciones asociadas
      if (!subscriptions || subscriptions.length === 0) {
        console.warn("No hay suscripciones asociadas a la oferta.");
      } else {
        subscriptions.forEach((subscription) => {
          if (subscription.path_curriculum) {
            // Obtener el nombre del archivo
            const fileName = path.basename(subscription.path_curriculum);

            // Construir la ruta absoluta del archivo
            const curriculumPath = path.join(
              __dirname,
              "../../../dist/uploads-curriculums",
              fileName
            );

            // Eliminar físicamente el archivo
            fs.unlink(curriculumPath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error al eliminar el archivo:", curriculumPath, unlinkErr);
              } else {
                console.log(`Archivo eliminado: ${curriculumPath}`);
              }
            });
          } else {
            console.warn("No se encontró la ruta del archivo para esta suscripción.");
          }
        });
      }

      // Eliminar las suscripciones asociadas
      const deleteSubscriptionsQuery =
        "DELETE FROM user_job_subscriptions WHERE id_job_offer = ?";

      connection.query(deleteSubscriptionsQuery, [id_job_offer], (deleteSubsErr) => {
        if (deleteSubsErr) {
          console.error("Error al eliminar las suscripciones:", deleteSubsErr);
          return connection.rollback(() => {
            res.status(500).json({ message: "Error interno del servidor." });
          });
        }

        // Eliminar la oferta de empleo
        const deleteOfferQuery = "DELETE FROM jobs_offers WHERE id_job_offer = ?";

        connection.query<ResultSetHeader>(deleteOfferQuery, [id_job_offer], (deleteOfferErr, result) => {
          if (deleteOfferErr) {
            console.error("Error al eliminar la oferta de empleo:", deleteOfferErr);
            return connection.rollback(() => {
              res.status(500).json({ message: "Error interno del servidor." });
            });
          }

          if (result.affectedRows === 0) {
            return connection.rollback(() => {
              res.status(404).json({ message: "Oferta de empleo no encontrada." });
            });
          }

          // Confirmar la transacción
          connection.commit((commitErr) => {
            if (commitErr) {
              console.error("Error al confirmar la transacción:", commitErr);
              return connection.rollback(() => {
                res.status(500).json({ message: "Error interno del servidor." });
              });
            }

            return res.status(200).json({
              message: "Oferta de empleo y suscripciones eliminadas con éxito.",
            });
          });
        });
      });
    });
  });
});



export default router;
