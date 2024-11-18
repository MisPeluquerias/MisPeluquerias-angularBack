import express from "express";
const path = require('path');

const router = express.Router();

router.use(express.static(path.join(__dirname, 'public')));

// Opcional: ruta explícita para robots.txt
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'Robots.txt'));
});

export default router;

