import express from "express";
const router = express.Router();
import connection from "../../db/db";
const bodyParser = require("body-parser");
router.use(bodyParser.json());
import decodeToken from "../../functions/decodeToken";

router.get("/", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
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
      SELECT longitud, latitud, name, address, image,phone,email,hours_old,url
      FROM salon
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



router.get("/loadReview", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
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
router.post("/saveReview", async (req, res) => {
  try {
    // Usar req.body para obtener los datos enviados en el cuerpo de la solicitud
    const { id_user, id_salon, observacion, qualification } = req.body;

    // Decodifica el token para obtener el usuarioId
    const usuarioId = decodeToken(id_user);
    if (!usuarioId) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    // Agregar un console.log para ver los datos recibidos y el usuarioId decodificado
    console.log("Datos recibidos en el servidor:", {
      id_user,
      id_salon,
      observacion,
      qualification,
    });
    console.log(`ID de usuario decodificado: ${usuarioId}`);

    if (!id_salon || !observacion || !qualification) {
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

    // Insertar la reseña
    const query = `
      INSERT INTO review (id_user, id_salon, observacion, qualification)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(
      query,
      [usuarioId, id_salon, observacion, qualification],
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

router.get("/loadFaq", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
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
      SELECT id_faq, question, answer,visible_web
      FROM faq
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
          res.status(500).json({ error: "Error al buscar la descripción del salón." });
        });
      }

      connection.commit((err) => {
        if (err) {
          console.error("Error al hacer commit:", err);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al buscar la descripcion del salón." });
          });
        }

        res.json(results);
      });
    });
  } catch (err) {
    console.error("Error al buscar la descripción del salón:", err);
    res.status(500).json({ error: "Error al buscar la descripción del salón." });
  }
});
/*

router.get("/loadServices", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "El parámetro 'zone' es requerido." });
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
      SELECT name
      FROM service
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
;

*/

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
    const { id_review, id_user, observacion, qualification } = req.body;

    // Agregar un console.log para ver los datos recibidos
    console.log("Datos recibidos en el servidor para actualizar:", {
      id_review,
      id_user,
      observacion,
      qualification,
    });

    if (!id_review || !id_user || !observacion || !qualification) {
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

    // Actualizar la reseña sin modificar el id_salon
    const query = `
      UPDATE review
      SET id_user = ?, observacion = ?, qualification = ?
      WHERE id_review = ?
    `;

    connection.query(
      query,
      [id_user, observacion, qualification, id_review],
      (error, results) => {
        if (error) {
          console.error("Error al actualizar la reseña:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "Error al actualizar la reseña." });
          });
        }

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

router.post("/saveFaq", async (req, res) => {
  try {
    const { id_user, id_salon, question } = req.body;

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

    console.log("ID de usuario decodificado:", usuarioId);

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
    const { id_faq, answer } = req.body;

    if (!id_faq || !answer) {
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
      SET answer = ?
      WHERE id_faq = ?
    `;

    connection.query(query, [answer, id_faq], (error, results) => {
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
    s.name AS service_name, 
    GROUP_CONCAT(st.name ORDER BY st.name SEPARATOR '; ') AS service_type_names
        FROM 
          service s
        INNER JOIN 
    service_type st ON s.id_service = st.id_service
        WHERE 
          s.id_salon = ?
      GROUP BY 
            s.name;

  `;

    connection.query(query, [id_salon], (error, results) => {
      if (error) {
        console.error(
          "Error al cargar los servicios y tipos de servicios:",
          error
        );
        return connection.rollback(() => {
          res
            .status(500)
            .json({
              error: "Error al cargar los servicios y tipos de servicios.",
            });
        });
      }

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

        // Devolver los resultados
        res.json({ services: results });
      });
    });
  } catch (err) {
    console.error("Error al cargar los servicios y tipos de servicios:", err);
    res
      .status(500)
      .json({ error: "Error al cargar los servicios y tipos de servicios." });
  }
});

export default router;
