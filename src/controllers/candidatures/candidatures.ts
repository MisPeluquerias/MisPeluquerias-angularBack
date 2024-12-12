import express from "express";
import connection from "../../db/db";
import bodyParser from "body-parser";
import verifyToken from "../../token/token";
import { Request, Response } from "express";
import decodeToken from "../../functions/decodeToken";
import { OkPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';
import { RowDataPacket } from "mysql2";
import { ResultSetHeader } from "mysql2";

const router = express.Router();
router.use(bodyParser.json());



router.get(
    "/getCandidaturesByIdUser",
    verifyToken,
    (req: Request, res: Response) => {
      const { id_user } = req.query;

      if (!id_user) {
        return res.status(400).json({ error: "id_user is required" });
      }
      let decodedIdUser;
      try {
        decodedIdUser = decodeToken(id_user as string);
      } catch (err) {
        console.error("Error decoding token:", err);
        return res.status(400).json({ error: "Invalid token" });
      }
  
      if (!decodedIdUser) {
        return res.status(400).json({ error: "Invalid decoded user ID" });
      }
      const query = `
    SELECT 
        ujs.id_user_job_subscriptions,
        ujs.id_job_offer,
        ujs.id_user,
        ujs.id_salon,
        s.name AS salon_name,
        ujs.work_presentation,
        ujs.path_curriculum,
        ujs.privacy_policy,
        ujs.date_subscriptions,
        jo.category,
        jo.subcategory,
        jo.description,
        jo.date_job_offer,
        jo.requirements,
        jo.img_job_path,
        jo.salary
    FROM 
        user_job_subscriptions ujs
    JOIN 
        jobs_offers jo
    ON 
        ujs.id_job_offer = jo.id_job_offer
    JOIN 
        salon s
    ON 
        ujs.id_salon = s.id_salon
    WHERE 
        ujs.id_user = ?;
`;
  
      connection.query(query, [decodedIdUser], (error, results: any[]) => {
        if (error) {
          console.error("Query error:", error);
          return res.status(500).json({ error: "Failed to retrieve candidatures" });
        }
  
        return res.status(200).json(results);
      });
    }
  );

  
  router.delete('/delete/:id_user_job_subscriptions', (req, res) => {
    const { id_user_job_subscriptions } = req.params;
  
  // Validar el ID
  if (!id_user_job_subscriptions || isNaN(Number(id_user_job_subscriptions))) {
    return res.status(400).json({ message: "ID de la oferta no válido." });
  }

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar la transacción:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    // Primero obtenemos las rutas de los currículos asociados a las suscripciones
    const selectSubscriptionsQuery =
      "SELECT path_curriculum FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";

    connection.query<RowDataPacket[]>(
      selectSubscriptionsQuery,
      [id_user_job_subscriptions],
      (selectErr, subscriptions) => {
        if (selectErr) {
          console.error("Error al obtener las suscripciones:", selectErr);
          return connection.rollback(() => {
            res.status(500).json({ message: "Error interno del servidor." });
          });
        }

        // Verificar que se obtuvieron suscripciones
        if (!subscriptions || subscriptions.length === 0) {
          console.warn("No hay suscripciones asociadas a la oferta.");
        } else {
          // Eliminar físicamente los archivos de los currículos
          subscriptions.forEach((subscription: any) => {
            if (subscription.path_curriculum) {
              // Obtener solo el nombre del archivo
              const fileName = path.basename(subscription.path_curriculum);

              // Construir la ruta física del archivo
              const curriculumPath = path.join(
                __dirname,
                "../../../dist/uploads-curriculums",
                fileName
              );

              fs.unlink(curriculumPath, (unlinkErr: any) => {
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

        // Luego eliminamos las suscripciones asociadas
        const deleteSubscriptionsQuery =
          "DELETE FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";

        connection.query(deleteSubscriptionsQuery, [id_user_job_subscriptions], (deleteSubsErr, subsResult) => {
          if (deleteSubsErr) {
            console.error("Error al eliminar las suscripciones:", deleteSubsErr);
            return connection.rollback(() => {
              res.status(500).json({ message: "Error interno del servidor." });
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
      }
    );
  });



 router.delete('/deleteCandidatureFromAdmin/:id_user_job_subscriptions', (req, res) => {
  const { id_user_job_subscriptions } = req.params;
  
  // Validar el ID
  if (!id_user_job_subscriptions || isNaN(Number(id_user_job_subscriptions))) {
    return res.status(400).json({ message: "ID de la oferta no válido." });
  }

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar la transacción:", err);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    // Primero obtenemos las rutas de los currículos asociados a las suscripciones
    const selectSubscriptionsQuery =
      "SELECT path_curriculum FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";

    connection.query<RowDataPacket[]>(
      selectSubscriptionsQuery,
      [id_user_job_subscriptions],
      (selectErr, subscriptions) => {
        if (selectErr) {
          console.error("Error al obtener las suscripciones:", selectErr);
          return connection.rollback(() => {
            res.status(500).json({ message: "Error interno del servidor." });
          });
        }

        // Verificar que se obtuvieron suscripciones
        if (!subscriptions || subscriptions.length === 0) {
          console.warn("No hay suscripciones asociadas a la oferta.");
        } else {
          // Eliminar físicamente los archivos de los currículos
          subscriptions.forEach((subscription: any) => {
            if (subscription.path_curriculum) {
              // Obtener solo el nombre del archivo
              const fileName = path.basename(subscription.path_curriculum);

              // Construir la ruta física del archivo
              const curriculumPath = path.join(
                __dirname,
                "../../../dist/uploads-curriculums",
                fileName
              );

              fs.unlink(curriculumPath, (unlinkErr: any) => {
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

        // Luego eliminamos las suscripciones asociadas
        const deleteSubscriptionsQuery =
          "DELETE FROM user_job_subscriptions WHERE id_user_job_subscriptions = ?";

        connection.query(deleteSubscriptionsQuery, [id_user_job_subscriptions], (deleteSubsErr, subsResult) => {
          if (deleteSubsErr) {
            console.error("Error al eliminar las suscripciones:", deleteSubsErr);
            return connection.rollback(() => {
              res.status(500).json({ message: "Error interno del servidor." });
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
      }
    );
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
  
      // Primero obtenemos las rutas de los currículos asociados a las suscripciones
      const selectSubscriptionsQuery =
        "SELECT path_curriculum FROM user_job_subscriptions WHERE id_job_offer = ?";
  
      connection.query<RowDataPacket[]>(
        selectSubscriptionsQuery,
        [id_job_offer],
        (selectErr, subscriptions) => {
          if (selectErr) {
            console.error("Error al obtener las suscripciones:", selectErr);
            return connection.rollback(() => {
              res.status(500).json({ message: "Error interno del servidor." });
            });
          }
  
          // Verificar que se obtuvieron suscripciones
          if (!subscriptions || subscriptions.length === 0) {
            console.warn("No hay suscripciones asociadas a la oferta.");
          } else {
            // Eliminar físicamente los archivos de los currículos
            subscriptions.forEach((subscription: any) => {
              if (subscription.path_curriculum) {
                // Obtener solo el nombre del archivo
                const fileName = path.basename(subscription.path_curriculum);
  
                // Construir la ruta física del archivo
                const curriculumPath = path.join(
                  __dirname,
                  "../uploads/curriculums",
                  fileName
                );
  
                fs.unlink(curriculumPath, (unlinkErr: any) => {
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
  
          // Luego eliminamos las suscripciones asociadas
          const deleteSubscriptionsQuery =
            "DELETE FROM user_job_subscriptions WHERE id_job_offer = ?";
  
          connection.query(deleteSubscriptionsQuery, [id_job_offer], (deleteSubsErr, subsResult) => {
            if (deleteSubsErr) {
              console.error("Error al eliminar las suscripciones:", deleteSubsErr);
              return connection.rollback(() => {
                res.status(500).json({ message: "Error interno del servidor." });
              });
            }
  
            // Finalmente eliminamos la oferta de empleo
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
        }
      );
    });
  });

  
  
  
  

export default router;
