"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const xmlbuilder_1 = __importDefault(require("xmlbuilder"));
const db_1 = __importDefault(require("../db/db")); // Asegúrate de que la ruta es correcta
const router = express_1.default.Router();
// Función para obtener URLs de los negocios desde la base de datos
const getBusinessUrls = () => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT id_salon, name 
      FROM salon
    `;
        db_1.default.query(query, (error, results) => {
            if (error) {
                return reject(error);
            }
            // Mapea los resultados para formar las URLs
            const businessUrls = Array.isArray(results)
                ? results.map((salon) => `/centro/${salon.name.replace(/ /g, '-').toLowerCase()}/${salon.id_salon}`)
                : [];
            resolve(businessUrls);
        });
    });
};
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const root = xmlbuilder_1.default.create('urlset', { version: '1.0', encoding: 'UTF-8' });
    root.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    root.att('xmlns:video', 'http://www.google.com/schemas/sitemap-video/1.1');
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
        const businessRoutes = yield getBusinessUrls();
        businessRoutes.forEach(route => {
            const url = root.ele('url');
            url.ele('loc', `https://mispeluquerias.com${route}`);
        });
        const videoUrlElement = root.ele('url');
        videoUrlElement.ele('loc', 'https://www.mispeluquerias.com/home');
        const videoElement = videoUrlElement.ele('video:video');
        videoElement.ele('video:thumbnail_loc', 'https://www.mispeluquerias.com/assets/img/web/logo-mis-peluquerias.svg');
        videoElement.ele('video:title', 'Bienvenida a Mis Peluquerías');
        videoElement.ele('video:description', 'Conoce nuestra plataforma para encontrar el mejor salón de peluquería y belleza en tu ciudad.');
        videoElement.ele('video:content_loc', 'https://www.mispeluquerias.com/assets/video/nav_video.webm');
        videoElement.ele('video:player_loc', 'https://www.mispeluquerias.com/home');
        videoElement.ele('video:duration', '15');
        videoElement.ele('video:publication_date', '2024-11-15T00:00:00+00:00');
        res.header('Content-Type', 'application/xml');
        res.send(root.end({ pretty: true }));
    }
    catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
