"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const xmlbuilder_1 = __importDefault(require("xmlbuilder"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3900;
// Define your application's routes
const routes = [
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
    '/centro/:salonSlug/:id',
    '/profile',
    '/favorite'
];
app.get('/sitemap.xml', (req, res) => {
    const root = xmlbuilder_1.default.create('urlset', { version: '1.0', encoding: 'UTF-8' });
    root.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    routes.forEach(route => {
        const url = root.ele('url');
        url.ele('loc', `https://mispeluquerias.com${route}`);
        // You can add more elements like <changefreq> and <priority> here if needed
    });
    res.header('Content-Type', 'application/xml');
    res.send(root.end({ pretty: true }));
});
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
