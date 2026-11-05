function regresionLineal(serie) {
  validarAlMenosDosPeriodos(serie);

  const n = serie.length;
  const periodos = serie.map((_, i) => i + 1);
  const promedioX = promedio(periodos);
  const promedioY = promedio(serie);

  const covarianza = suma(periodos.map((x, i) => (x - promedioX) * (serie[i] - promedioY)));
  const varianzaX = suma(periodos.map((x) => (x - promedioX) ** 2));

  const pendiente = covarianza / varianzaX;
  const intercepto = promedioY - pendiente * promedioX;

  return { pendiente, intercepto, pronosticoSiguiente: intercepto + pendiente * (n + 1) };
}

function suma(valores) {
  return valores.reduce((acumulado, valor) => acumulado + valor, 0);
}

function promedio(valores) {
  return suma(valores) / valores.length;
}

function validarAlMenosDosPeriodos(serie) {
  if (serie.length < 2) {
    throw new Error('Se necesitan al menos dos periodos para ajustar la regresion');
  }
}

module.exports = { regresionLineal };
