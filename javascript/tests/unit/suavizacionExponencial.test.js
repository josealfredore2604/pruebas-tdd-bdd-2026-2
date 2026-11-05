const { suavizacionExponencial } = require('../../src/suavizacionExponencial');

const serie = [120, 132, 128, 141, 138, 150];

describe('suavizacionExponencial', () => {
  test('con alpha 0.3 el pronostico del periodo 7 es 137.5546', () => {
    const pronostico = suavizacionExponencial(serie, 0.3);

    expect(pronostico[pronostico.length - 1]).toBeCloseTo(137.5546, 2);
  });

  test('devuelve un pronostico por periodo y el del periodo 2 es la demanda del periodo 1', () => {
    const pronostico = suavizacionExponencial(serie, 0.3);

    expect(pronostico).toHaveLength(serie.length);
    expect(pronostico[0]).toBe(120);
  });

  test('con alpha 0 el pronostico nunca se corrige y queda en la primera demanda', () => {
    expect(suavizacionExponencial(serie, 0)).toEqual([120, 120, 120, 120, 120, 120]);
  });

  test('con alpha 1 el pronostico es la demanda real del periodo anterior', () => {
    expect(suavizacionExponencial(serie, 1)).toEqual(serie);
  });

  test('lanza un error si alpha esta fuera del rango de 0 a 1', () => {
    expect(() => suavizacionExponencial(serie, -0.1)).toThrow('entre 0 y 1');
    expect(() => suavizacionExponencial(serie, 1.5)).toThrow('entre 0 y 1');
    expect(() => suavizacionExponencial(serie, NaN)).toThrow('entre 0 y 1');
  });

  test('lanza un error si la serie esta vacia', () => {
    expect(() => suavizacionExponencial([], 0.3)).toThrow('al menos un periodo');
  });
});
