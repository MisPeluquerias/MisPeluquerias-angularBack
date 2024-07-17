import express from 'express';
import cors from 'cors';
import searchBar from './controllers/searchInLiveNavBar/searchInLiveNavBar'
import RegisteredsearchBusiness from './controllers/registered-search-map-business/registered-search-map-business'
import login from './controllers/login/login'
import register from './controllers/register/register'
import UnregisteredSearchBusiness from './controllers/unregistered-search-map-business/unregistered-search-map-business'
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
  app.use('/login',login);
  app.use('/register',register);
  app.use('/searchUnRegistered',UnregisteredSearchBusiness);

app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
 