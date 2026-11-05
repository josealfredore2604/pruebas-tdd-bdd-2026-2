const { validarMismaLongitud, validarAlMenosUnPeriodo } = require('./validaciones');

function mad(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real, 'MAD');

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  const sumaErrores = erroresAbsolutos.reduce((acumulado, error) => acumulado + error, 0);

  return sumaErrores / real.length;
}

module.exports = { mad };
