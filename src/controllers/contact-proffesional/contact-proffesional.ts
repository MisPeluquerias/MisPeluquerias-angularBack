import express from 'express';
import { ResultSetHeader } from 'mysql2';
import connection from '../../db/db';

const router = express.Router();

router.post('/newContactProffesional', async (req, res) => {
  const { name, email, phone, msg, state='Pendiente', term_cond } = req.body;

  // Usando una transacción con una conexión existente
  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al iniciar la transacción' });
    }

    connection.query<ResultSetHeader>(
      `
      INSERT INTO contact_proffesional (name, email, phone, text, state, terms_condition, created_at)
      VALUES (?, ?, ?, ?, ?,?, NOW());
      `,
      [name, email, phone, msg, state, term_cond],
      (err, results) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: 'Error al insertar el contacto' });
          });
        }

        // Si todo está bien, confirmar la transacción
        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: 'Error al confirmar la transacción' });
            });
          }

          res.status(201).json({
            message: 'Contacto añadido exitosamente',
            contactId: results.insertId,
          });
        });
      }
    );
  });
});

export default router;
