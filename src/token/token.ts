import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Función para extraer el token
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Encabezado de autorización no proporcionado o no tiene el formato correcto');
    return null;
  }
  const token = authHeader.substring(7).trim();
  return token || null;
}

// Middleware para verificar el token y calcular el tiempo restante
function verifyToken(req: Request | any, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado o inválido' });
  }

  try {
    const secretKey = 'uN3!pK@9rV$4zF6&hS*8xM2+bC0^wQ1!'; // Usa tu clave secreta

    // Verificar el token con la clave secreta
    const verified = jwt.verify(token, secretKey);

    //console.log('Token verificado con éxito:', verified);

    // Obtener el tiempo de expiración (exp) del token y el tiempo actual
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    const exp = (verified as any).exp; // La marca de tiempo 'exp' en segundos (Unix timestamp)

    if (exp) {
      const timeLeft = exp - currentTime; // Calcular el tiempo restante en segundos

      // Si el tiempo restante es menor o igual a cero, el token ha expirado
      if (timeLeft <= 0) {
        return res.status(401).json({ message: 'Token expirado' });
      }

      // Convertir el tiempo restante a un formato legible (minutos y segundos)
      const minutesLeft = Math.floor(timeLeft / 60);
      const secondsLeft = timeLeft % 60;

      //console.log(`El token expira en: ${minutesLeft} minutos y ${secondsLeft} segundos.`);
    }

    // Almacenar el token verificado en req.user para acceder después
    req.user = verified;
    next(); // Continuar al siguiente middleware o controlador
  } catch (error: any) {
    console.error('Error al verificar el token:', error.message);

    // Manejar diferentes errores de verificación
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export default verifyToken;
