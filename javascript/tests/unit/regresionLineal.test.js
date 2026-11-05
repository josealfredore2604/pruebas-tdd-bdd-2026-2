const { regresionLineal } = require('../../src/regresionLineal');

const serie = [120, 132, 128, 141, 138, 150];

describe('regresionLineal', () => {
  test('ajusta la recta de la serie y pronostica el periodo 7', () => {
    const { pendiente, intercepto, pronosticoSiguiente } = regresionLineal(serie);

    expect(pendiente).toBeCloseTo(5.17, 2);
    expect(intercepto).toBeCloseTo(116.73, 2);
    expect(pronosticoSiguiente).toBeCloseTo(152.93, 2);
  });

  test('una serie perfectamente lineal da su pendiente exacta', () => {
    const { pendiente, intercepto, pronosticoSiguiente } = regresionLineal([10, 20, 30, 40]);

    expect(pendiente).toBeCloseTo(10, 10);
    expect(intercepto).toBeCloseTo(0, 10);
    expect(pronosticoSiguiente).toBeCloseTo(50, 10);
  });

  test('una serie constante tiene pendiente 0 y pronostica ese mismo valor', () => {
    const { pendiente, pronosticoSiguiente } = regresionLineal([100, 100, 100]);

    expect(pendiente).toBe(0);
    expect(pronosticoSiguiente).toBe(100);
  });

  test('lanza un error si la serie tiene menos de dos periodos', () => {
    expect(() => regresionLineal([100])).toThrow('al menos dos periodos');
    expect(() => regresionLineal([])).toThrow('al menos dos periodos');
  });
});
