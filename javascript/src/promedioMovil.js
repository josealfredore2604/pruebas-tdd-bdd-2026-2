function promedioMovil(serie, ventana) {
  validarVentana(serie, ventana);

  return serie
    .slice(ventana)
    .map((_, i) => promedio(serie.slice(i, i + ventana)));
}

function promedio(valores) {
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function validarVentana(serie, ventana) {
  if (!Number.isInteger(ventana) || ventana < 1) {
    throw new Error('La ventana debe ser un entero mayor o igual a 1');
  }
  if (ventana >= serie.length) {
    throw new Error('La ventana debe ser menor que el numero de periodos de la serie');
  }
}

module.exports = { promedioMovil };
