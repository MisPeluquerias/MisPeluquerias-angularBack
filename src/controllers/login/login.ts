import express, { Request, Response } from "express";
import connection from "../../db/db";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const saltRounds = 10;
const router = express.Router();
const SECRET_KEY = 'cosertyglobal';

router.use(express.json());

router.post('/', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log(`Intento de login con email: ${email}`); // Debugging

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const query = `SELECT * FROM user WHERE email = ?;`;

    try {
        const [rows]: any = await connection.promise().query(query, [email]);
        const resultado = rows;

        console.log('Usuario encontrado:', resultado.length > 0); // Debugging

        if (resultado.length > 0) {
            const usuario: any = resultado[0];
            const match = await bcrypt.compare(password, usuario.password);

            console.log('Coincidencia de contraseña:', match); // Debugging

            if (match) {
                // Genera el token con el id_user
                const token = jwt.sign({ id: usuario.id_user }, SECRET_KEY, { expiresIn: '2h' });
                return res.json({ token, userId: usuario.id_user, permiso: usuario.permiso }); // Envía el token, el id_user y el permiso
            } else {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }
        } else {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error en el proceso de autenticación:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});


export default router;
