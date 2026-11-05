const { mape } = require('../../src/mape');

describe('mape', () => {
  test('calcula el error porcentual absoluto medio de una serie de pronosticos', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    expect(mape(real, pronostico)).toBeCloseTo(7.62, 2);
  });

  test('devuelve 0 cuando el pronostico es exacto', () => {
    expect(mape([100, 100], [100, 100])).toBe(0);
  });

  test('excluye los periodos con demanda real 0 en vez de dividir entre cero', () => {
    // Solo cuentan los periodos 2 y 3: (10/100 + 10/200) / 2 = 7.5 %
    const resultado = mape([0, 100, 200], [50, 90, 210]);

    expect(Number.isFinite(resultado)).toBe(true);
    expect(resultado).toBeCloseTo(7.5, 5);
  });

  test('lanza un error si toda la demanda real es 0', () => {
    expect(() => mape([0, 0], [10, 20])).toThrow('demanda real distinta de cero');
  });

  test('lanza un error si las series no tienen la misma longitud', () => {
    expect(() => mape([100, 110], [100])).toThrow('mismo numero de periodos');
  });

  test('lanza un error si alguna de las series esta vacia', () => {
    expect(() => mape([], [])).toThrow('al menos un periodo');
  });
});
