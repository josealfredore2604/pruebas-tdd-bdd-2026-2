const { validarMismaLongitud, validarAlMenosUnPeriodo } = require('./validaciones');

function mse(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real, 'MSE');

  const erroresCuadrados = real.map((valorReal, i) => (valorReal - pronostico[i]) ** 2);
  const sumaErrores = erroresCuadrados.reduce((acumulado, error) => acumulado + error, 0);

  return sumaErrores / real.length;
}

module.exports = { mse };
