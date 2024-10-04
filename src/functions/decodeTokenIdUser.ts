import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'uN3!pK@9rV$4zF6&hS*8xM2+bC0^wQ1!';
const router = express.Router();

function decodeToken(token: string): any | null {
    try {
      // Decodifica el token JWT utilizando la clave secreta
      const decoded: any = jwt.verify(token, secretKey);
      
      // Devuelve los datos decodificados del token
      if (decoded && decoded.usuarioId) {
        return decoded.usuarioId; // Corrige el acceso a la propiedad correcta
      } else {
        console.error('Token decodificado no contiene usuarioId');
        return null;
      }
    } catch (error) {
      // Si ocurre algún error durante la decodificación, se captura aquí
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }

  router.post('/', (req: Request, res: Response) => {
    const token = req.body.token;  // Recibe el token del cuerpo de la solicitud
  
    if (!token) {
      return res.status(400).json({ message: 'No se proporcionó un token' });
    }
  
    const usuarioId = decodeToken(token);
  
    if (usuarioId) {
      return res.status(200).json({ usuarioId });  // Cambiado de 'usuarioId' a 'id'
    } else {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  });

export default router;