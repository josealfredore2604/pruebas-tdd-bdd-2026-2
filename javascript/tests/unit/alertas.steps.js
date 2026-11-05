const { loadFeature, defineFeature } = require('jest-cucumber');
const { debeGenerarAlerta } = require('../../src/alertas');

const feature = loadFeature('./tests/unit/alertas.feature');

defineFeature(feature, (test) => {
  test('El error supera el umbral configurado', ({ given, when, then }) => {
    let umbral;
    let error;
    let resultado;

    given('un umbral de alerta configurado en 10 %', () => {
      umbral = 10;
    });

    when('el error del pronóstico es 12 %', () => {
      error = 12;
      resultado = debeGenerarAlerta(error, umbral);
    });

    then('se debe generar una alerta', () => {
      expect(resultado).toBe(true);
    });
  });

  test('El error no supera el umbral configurado', ({ given, when, then }) => {
    let umbral;
    let error;
    let resultado;

    given('un umbral de alerta configurado en 10 %', () => {
      umbral = 10;
    });

    when('el error del pronóstico es 7 %', () => {
      error = 7;
      resultado = debeGenerarAlerta(error, umbral);
    });

    then('no se debe generar una alerta', () => {
      expect(resultado).toBe(false);
    });
  });

  test('El error es exactamente igual al umbral', ({ given, when, then }) => {
    let umbral;
    let error;
    let resultado;

    given('un umbral de alerta configurado en 10 %', () => {
      umbral = 10;
    });

    when('el error del pronóstico es 10 %', () => {
      error = 10;
      resultado = debeGenerarAlerta(error, umbral);
    });

    then('se debe generar una alerta', () => {
      expect(resultado).toBe(true);
    });
  });
});
