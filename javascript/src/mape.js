const { validarMismaLongitud, validarAlMenosUnPeriodo } = require('./validaciones');

function mape(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real, 'MAPE');

  // Con demanda real 0 el error porcentual no esta definido: ese periodo no cuenta
  const erroresPorcentuales = real
    .map((valorReal, i) => ({ valorReal, error: Math.abs(valorReal - pronostico[i]) }))
    .filter(({ valorReal }) => valorReal !== 0)
    .map(({ valorReal, error }) => error / valorReal);

  validarHayDemandaReal(erroresPorcentuales);

  const sumaErrores = erroresPorcentuales.reduce((acumulado, error) => acumulado + error, 0);
  return (sumaErrores / erroresPorcentuales.length) * 100;
}

function validarHayDemandaReal(erroresPorcentuales) {
  if (erroresPorcentuales.length === 0) {
    throw new Error('Se necesita al menos un periodo con demanda real distinta de cero para calcular el MAPE');
  }
}

module.exports = { mape };
