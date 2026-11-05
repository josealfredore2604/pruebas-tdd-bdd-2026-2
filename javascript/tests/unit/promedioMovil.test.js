const { promedioMovil } = require('../../src/promedioMovil');

const serie = [120, 132, 128, 141, 138, 150];

describe('promedioMovil', () => {
  test('pronostica los periodos 4, 5 y 6 con una ventana de 3', () => {
    const pronostico = promedioMovil(serie, 3);

    expect(pronostico).toHaveLength(3);
    [126.67, 133.67, 135.67].forEach((esperado, i) => {
      expect(pronostico[i]).toBeCloseTo(esperado, 2);
    });
  });

  test('con ventana de 1 el pronostico repite la demanda del periodo anterior', () => {
    expect(promedioMovil([10, 20, 30], 1)).toEqual([10, 20]);
  });

  test('lanza un error si la ventana no es un entero mayor o igual a 1', () => {
    expect(() => promedioMovil(serie, 0)).toThrow('entero mayor o igual a 1');
    expect(() => promedioMovil(serie, 2.5)).toThrow('entero mayor o igual a 1');
  });

  test('lanza un error si la ventana no es menor que el numero de periodos', () => {
    expect(() => promedioMovil([100, 110, 120], 3)).toThrow('menor que el numero de periodos');
  });
});
