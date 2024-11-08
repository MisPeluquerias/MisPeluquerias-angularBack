import express from 'express';
import { ResultSetHeader } from 'mysql2';
import connection from '../../db/db';

const router = express.Router();


router.post('/newContact', async (req, res) => {
  const { name, email, phone, msg, state = 'Pendiente', term_cond } = req.body;

  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al iniciar la transacción' });
    }

    // Inserción del contacto
    connection.query<ResultSetHeader>(
      `
      INSERT INTO contact (name, email, phone, text, state, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW());
      `,
      [name, email, phone, msg, state, term_cond],
      (err, results) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: 'Error al insertar el contacto' });
          });
        }

        const contactId = results.insertId;

        // Inserción de la alerta en la tabla alert_admin
        const alertText = `Nuevo contacto: ${name}`;
        const alertUrl = `/contact`;
        connection.query<ResultSetHeader>(
          `
          INSERT INTO alert_admin (text, url, showed, created_at)
          VALUES (?, ?, 0, NOW());
          `,
          [alertText, alertUrl],
          (err, alertResults) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ error: 'Error al insertar la alerta' });
              });
            }

            // Confirmar la transacción
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: 'Error al confirmar la transacción' });
                });
              }

              // Emitir evento de Socket.IO para notificar al frontend
              if ((req as any).io) {
                (req as any).io.emit('new-alert', {
                  message: alertText,
                  url: alertUrl,
                  alertId: alertResults.insertId,
                });
              } else {
                console.error("Socket.IO no está disponible en req");
              }

              res.status(201).json({
                message: 'Contacto y alerta añadidos exitosamente',
                contactId,
              });
            });
          }
        );
      }
    );
  });
});



export default router;
