const UMBRAL_VIGILANCIA = 8;

function errorPorcentual({ real, pron }) {
  const faltaPronostico = pron === undefined || pron === null;
  if (real === 0 || faltaPronostico) {
    return null;
  }
  return (Math.abs(real - pron) / real) * 100;
}

function clasificar(error, umbralAlerta) {
  if (error === null) return 'sin demanda';
  if (error >= umbralAlerta) return 'alerta';
  if (error >= UMBRAL_VIGILANCIA) return 'vigilar';
  return 'ok';
}

function procesarPeriodos(periodos, umbralAlerta) {
  return periodos.map((periodo) => {
    const error = errorPorcentual(periodo);
    return { periodo: periodo.periodo, error, estado: clasificar(error, umbralAlerta) };
  });
}

// Con errores empatados gana el primer periodo, igual que antes del refactor
function periodoConMayorError(periodos) {
  let mayor = { periodo: null, error: -1 };
  for (const periodo of periodos) {
    const error = errorPorcentual(periodo);
    if (error !== null && error > mayor.error) {
      mayor = { periodo: periodo.periodo, error };
    }
  }
  return mayor.periodo;
}

module.exports = { procesarPeriodos, periodoConMayorError };
