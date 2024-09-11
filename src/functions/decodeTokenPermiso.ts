import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'uN3!pK@9rV$4zF6&hS*8xM2+bC0^wQ1!';
const router = express.Router();

function decodeTokenPermiso(token: string): any | null {
  try {

    const decoded: any = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
}

router.post('/', (req: Request, res: Response) => {
  const { permiso } = req.body; // Espera recibir el token de permiso en el cuerpo de la solicitud
  const decoded = decodeTokenPermiso(permiso);

  if (decoded && decoded.permiso) {
    res.json({ permiso: decoded.permiso });
  } else {
    res.status(400).json({ message: 'Token de permiso inválido' });
  }
});

export default router;
