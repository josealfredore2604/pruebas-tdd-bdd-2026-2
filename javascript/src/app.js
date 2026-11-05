const path = require('path');
const express = require('express');
const { promedioMovil } = require('./promedioMovil');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/pronosticos', (req, res) => {
  const { serie, ventana } = req.body ?? {};

  if (!esSerieNumerica(serie)) {
    return res.status(400).json({ error: 'La serie debe ser un arreglo de numeros' });
  }

  try {
    const pronosticos = promedioMovil(serie, ventana);
    res.json({ metodo: 'promedioMovil', ventana, pronosticos });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo debe ser un JSON valido' });
  }
  next(error);
});

function esSerieNumerica(serie) {
  return Array.isArray(serie) && serie.every((valor) => typeof valor === 'number' && Number.isFinite(valor));
}

module.exports = { app };
