"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const searchInLiveNavBar_1 = __importDefault(require("./controllers/searchInLiveNavBar/searchInLiveNavBar"));
const registered_search_map_business_1 = __importDefault(require("./controllers/registered-search-map-business/registered-search-map-business"));
const login_1 = __importDefault(require("./controllers/login/login"));
const register_1 = __importDefault(require("./controllers/register/register"));
const unregistered_search_map_business_1 = __importDefault(require("./controllers/unregistered-search-map-business/unregistered-search-map-business"));
const details_business_1 = __importDefault(require("./controllers/details-business/details-business"));
const decodeTokenPermiso_1 = __importDefault(require("./functions/decodeTokenPermiso"));
const contact_1 = __importDefault(require("./controllers/contact/contact"));
const contact_proffesional_1 = __importDefault(require("./controllers/contact-proffesional/contact-proffesional"));
const salon_reclamation_1 = __importDefault(require("./controllers/salon-reclamation/salon-reclamation"));
const home_1 = __importDefault(require("./controllers/home/home"));
const profileUser_1 = __importDefault(require("./controllers/profileUser/profileUser"));
const favorite_salon_1 = __importDefault(require("./controllers/favorite-salon/favorite-salon"));
const generate_sitemap_1 = __importDefault(require("./public/generate-sitemap"));
const path_1 = __importDefault(require("path"));
const decodeTokenIdUser_1 = __importDefault(require("./functions/decodeTokenIdUser"));
const http_1 = __importDefault(require("http"));
const robots_1 = __importDefault(require("./public/robots"));
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configuración de Socket.IO con CORS para permitir todos los orígenes
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Permitir todos los orígenes (puedes especificar el dominio en producción)
        methods: ['GET', 'POST'],
        allowedHeaders: ['Authorization'],
        credentials: true
    }
});
app.use((req, res, next) => {
    req.io = io;
    next();
});
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Máximo 1000 solicitudes por IP
});
app.use(limiter);
app.use(limiter);
app.use(express_1.default.json());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use('/uploads-reclamation', express_1.default.static(path_1.default.join(__dirname, '../dist/uploads-reclamation')));
app.use('/uploads-curriculums', express_1.default.static(path_1.default.join(__dirname, '../dist/uploads-curriculums')));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Access-Control-Allow-Headers, Authorization, Accept");
    next();
});
app.use('/searchBar', searchInLiveNavBar_1.default);
app.use('/business', registered_search_map_business_1.default);
app.use('/login', login_1.default);
app.use('/register', register_1.default);
app.use('/searchUnRegistered', unregistered_search_map_business_1.default);
app.use('/details-business', details_business_1.default);
app.use('/decode-permiso', decodeTokenPermiso_1.default);
app.use('/contact', contact_1.default);
app.use('/contact-proffesional', contact_proffesional_1.default);
app.use('/salon-reclamation', salon_reclamation_1.default);
app.use('/home', home_1.default);
app.use('/profile-user', profileUser_1.default);
app.use('/favorites', favorite_salon_1.default);
app.use('/sitemap.xml', generate_sitemap_1.default);
app.use('/decode-token', decodeTokenIdUser_1.default);
app.use('/robots.txt', robots_1.default);
io.on('connection', (socket) => {
    //console.log('Cliente conectado a Socket.IO');
    // Manejo de mensajes recibidos del cliente
    socket.on('message', (message) => {
        //onsole.log('Mensaje recibido:', message);
        io.emit('message', message); // Envía el mensaje a todos los clientes conectados
    });
    // Manejo de desconexiones
    socket.on('disconnect', () => {
        //console.log('Cliente desconectado de Socket.IO');
    });
});
/*
app.listen(3900, () => {
  console.log('Servidor iniciado en http://localhost:3900');

  
});
*/
server.listen(3900, () => {
    console.log('Servidor iniciado en http://localhost:3900');
});
