import express from 'express';
import cors from 'cors';
import searchBar from './controllers/searchInLiveNavBar/searchInLiveNavBar'
import RegisteredsearchBusiness from './controllers/registered-search-map-business/registered-search-map-business'
import Login from './controllers/login/login';
import register from './controllers/register/register';
import UnregisteredSearchBusiness from './controllers/unregistered-search-map-business/unregistered-search-map-business'
import DetailsBusiness from './controllers/details-business/details-business'
import decodeTokenPermiso from './functions/decodeTokenPermiso';
import Contact from './controllers/contact/contact';
import contactProffesional from './controllers/contact-proffesional/contact-proffesional';
import salonReclamation from './controllers/salon-reclamation/salon-reclamation'
import Home from './controllers/home/home';
import ProfileUser from './controllers/profileUser/profileUser';
import favoritesSalon from './controllers/favorite-salon/favorite-salon';
import siteMap from './functions/generate-sitemap';
import path from 'path';

const app = express();
app.use(express.json());

app.use(cors());

app.use('/uploads-reclamation', express.static(path.join(__dirname, '../dist/uploads-reclamation')));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Access-Control-Allow-Headers, Authorization, Accept");
    next();
  });

  app.use('/searchBar',searchBar);
  app.use('/business',RegisteredsearchBusiness);
  app.use('/login',Login);
  app.use('/register',register);
  app.use('/searchUnRegistered',UnregisteredSearchBusiness);
  app.use('/details-business', DetailsBusiness);
  app.use('/decode-permiso',decodeTokenPermiso);
  app.use('/contact',Contact);
  app.use('/contact-proffesional',contactProffesional);
  app.use('/salon-reclamation',salonReclamation);
  app.use('/home',Home);
  app.use('/profile-user',ProfileUser);
  app.use('/favorites',favoritesSalon);
  app.use('/sitemap.xml', siteMap);


app.listen(3900, () => {
  console.log('Servidor iniciado en http://localhost:3900');
});