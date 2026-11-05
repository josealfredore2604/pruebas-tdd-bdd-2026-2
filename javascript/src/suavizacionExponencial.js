function suavizacionExponencial(serie, alpha) {
  validarAlpha(alpha);
  validarAlMenosUnPeriodo(serie);

  // El pronostico del periodo 2 arranca con la demanda real del periodo 1
  const pronostico = [serie[0]];
  for (let i = 1; i < serie.length; i++) {
    pronostico.push(corregir(serie[i], pronostico[i - 1], alpha));
  }
  return pronostico;
}

function corregir(demanda, pronosticoAnterior, alpha) {
  return alpha * demanda + (1 - alpha) * pronosticoAnterior;
}

function validarAlpha(alpha) {
  if (typeof alpha !== 'number' || !(alpha >= 0 && alpha <= 1)) {
    throw new Error('El alpha debe estar entre 0 y 1');
  }
}

function validarAlMenosUnPeriodo(serie) {
  if (serie.length === 0) {
    throw new Error('Se necesita al menos un periodo para suavizar la serie');
  }
}

module.exports = { suavizacionExponencial };
