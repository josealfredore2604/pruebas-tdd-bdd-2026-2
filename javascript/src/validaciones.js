function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real, metrica) {
  if (real.length === 0) {
    throw new Error(`Se necesita al menos un periodo para calcular el ${metrica}`);
  }
}

module.exports = { validarMismaLongitud, validarAlMenosUnPeriodo };
