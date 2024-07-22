import jwt from 'jsonwebtoken';

const secretKey = 'uN3!pK@9rV$4zF6&hS*8xM2+bC0^wQ1!'


function decodeToken(token: string): any | null {
    try {
      // Decodifica el token JWT utilizando la clave secreta
      const decoded : any = jwt.verify(token, secretKey);
  
      // Devuelve los datos decodificados del token
      return decoded.data.id;
    } catch (error) {
      // Si ocurre algún error durante la decodificación, se captura aquí
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }


export default decodeToken;