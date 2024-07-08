import express from 'express';
import cors from 'cors';
import searchBar from './controllers/searchBar/searchBar'
const app = express();
app.use(express.json());
app.use(cors());


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Access-Control-Allow-Headers, Authorization, Accept");
    next();
  });

  app.use('/searchBar',searchBar);



app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});

 
  