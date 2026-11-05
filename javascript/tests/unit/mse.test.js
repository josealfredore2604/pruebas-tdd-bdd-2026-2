const { mse } = require('../../src/mse');

describe('mse', () => {
  test('calcula el error cuadratico medio de una serie de pronosticos', () => {
    const real = [141, 138, 150];
    // Pronosticos del promedio movil sin redondear: con 126.67, 133.67 y 135.67 el MSE da 143.15, no 143.22
    const pronostico = [380 / 3, 401 / 3, 407 / 3];

    expect(mse(real, pronostico)).toBeCloseTo(143.22, 2);
  });

  test('devuelve 0 cuando el pronostico es exacto', () => {
    expect(mse([100, 100], [100, 100])).toBe(0);
  });

  test('penaliza mas los errores grandes que los pequenos', () => {
    // Mismo error absoluto total (10), pero concentrado en un solo periodo
    expect(mse([100, 100], [105, 95])).toBe(25);
    expect(mse([100, 100], [110, 100])).toBe(50);
  });

  test('lanza un error si las series no tienen la misma longitud', () => {
    expect(() => mse([100, 110], [100])).toThrow('mismo numero de periodos');
  });

  test('lanza un error si alguna de las series esta vacia', () => {
    expect(() => mse([], [])).toThrow('al menos un periodo');
  });
});
