package pruebas;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MadTest {

    @Test
    @DisplayName("calcula el error absoluto medio de una serie de pronosticos")
    void calculaElErrorAbsolutoMedio() {
        double[] real = {141, 138, 150};
        double[] pronostico = {126.67, 133.67, 135.67};

        assertEquals(11.00, Mad.mad(real, pronostico), 0.01);
    }

    @Test
    @DisplayName("devuelve 0 cuando el pronostico es exacto")
    void devuelveCeroCuandoElPronosticoEsExacto() {
        assertEquals(0, Mad.mad(new double[] {100, 100}, new double[] {100, 100}));
    }

    @Test
    @DisplayName("lanza un error si las series no tienen la misma longitud")
    void lanzaUnErrorSiLasSeriesNoTienenLaMismaLongitud() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Mad.mad(new double[] {100, 110}, new double[] {100}));

        assertEquals("Las series deben tener el mismo numero de periodos", error.getMessage());
    }

    @Test
    @DisplayName("lanza un error si alguna de las series esta vacia")
    void lanzaUnErrorSiAlgunaDeLasSeriesEstaVacia() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Mad.mad(new double[] {}, new double[] {}));

        assertEquals("Se necesita al menos un periodo para calcular el MAD", error.getMessage());
    }
}
