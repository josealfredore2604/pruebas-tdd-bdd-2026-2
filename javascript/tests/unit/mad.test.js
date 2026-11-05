const { mad } = require('../../src/mad');

describe('mad', () => {
  test('calcula el error absoluto medio de una serie de pronosticos', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    expect(mad(real, pronostico)).toBeCloseTo(11.00, 2);
  });

  test('devuelve 0 cuando el pronostico es exacto', () => {
    expect(mad([100, 100], [100, 100])).toBe(0);
  });

  test('lanza un error si las series no tienen la misma longitud', () => {
    expect(() => mad([100, 110], [100])).toThrow('mismo numero de periodos');
  });

  test('lanza un error si alguna de las series esta vacia', () => {
    expect(() => mad([], [])).toThrow('al menos un periodo');
  });
});
