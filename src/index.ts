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

const app = express();
app.use(express.json());

app.use(cors());


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
app.listen(3900, () => {
  console.log('Servidor iniciado en http://localhost:3900');
});