const { test, expect } = require('@playwright/test');

test.describe('Pantalla de carga de datos', () => {
  test('confirma la carga y muestra los pronosticos del promedio movil', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Demanda real por período').fill('120, 132, 128, 141, 138, 150');
    await page.getByLabel('Ventana del promedio móvil').fill('3');
    await page.getByRole('button', { name: 'Cargar datos' }).click();

    await expect(page.getByRole('status')).toHaveText('Datos cargados correctamente: 6 períodos');
    await expect(page.getByRole('listitem')).toHaveText(['126.67', '133.67', '135.67']);
  });

  test('muestra el motivo cuando la ventana es demasiado grande', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Demanda real por período').fill('100, 110, 120');
    await page.getByLabel('Ventana del promedio móvil').fill('3');
    await page.getByRole('button', { name: 'Cargar datos' }).click();

    await expect(page.getByRole('status')).toContainText('menor que el numero de periodos');
  });
});
