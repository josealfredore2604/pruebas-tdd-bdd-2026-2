function debeGenerarAlerta(errorPorcentual, umbralPorcentual) {
  return errorPorcentual >= umbralPorcentual;
}

module.exports = { debeGenerarAlerta };
