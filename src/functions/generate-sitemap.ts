import express, { Request, Response } from 'express';
import xmlbuilder from 'xmlbuilder';
import mysql from 'mysql2';
import connection from '../db/db'; // Asegúrate de que la ruta es correcta

const router = express.Router();

// Función para obtener URLs de los negocios desde la base de datos
const getBusinessUrls = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id_salon, name 
      FROM salon
    `;
    connection.query(query, (error, results) => {
      if (error) {
        return reject(error);
      }

      // Mapea los resultados para formar las URLs
      const businessUrls = Array.isArray(results)
        ? results.map((salon: any) => `/centro/${salon.name.replace(/ /g, '-').toLowerCase()}/${salon.id_salon}`)
        : [];

      resolve(businessUrls);
    });
  });
};

router.get('/', async (req: Request, res: Response) => {
  const root = xmlbuilder.create('urlset', { version: '1.0', encoding: 'UTF-8' });
  root.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  const staticRoutes = [
    '/',
    '/home',
    '/terminos-y-condiciones',
    '/politica-de-privacidad',
    '/aviso-legal',
    '/cookies',
    '/preguntas-frecuentes',
    '/contacto',
    '/profesionales',
    '/reclamation',
    '/login',
    '/centros',
    '/buscador',
    '/profile',
    '/favorite'
  ];

  // Añadir rutas estáticas
  staticRoutes.forEach(route => {
    const url = root.ele('url');
    url.ele('loc', `https://mispeluquerias.com${route}`);
  });

  try {
    // Obtener rutas dinámicas de negocios desde la base de datos
    const businessRoutes = await getBusinessUrls();
    businessRoutes.forEach(route => {
      const url = root.ele('url');
      url.ele('loc', `https://mispeluquerias.com${route}`);
    });

    res.header('Content-Type', 'application/xml');
    res.send(root.end({ pretty: true }));
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
