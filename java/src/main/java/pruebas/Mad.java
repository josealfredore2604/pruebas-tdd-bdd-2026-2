package pruebas;

import java.util.stream.IntStream;

public class Mad {

    public static double mad(double[] real, double[] pronostico) {
        validarMismaLongitud(real, pronostico);
        validarAlMenosUnPeriodo(real);

        double sumaErrores = IntStream.range(0, real.length)
                .mapToDouble(i -> Math.abs(real[i] - pronostico[i]))
                .sum();
        return sumaErrores / real.length;
    }

    private static void validarMismaLongitud(double[] real, double[] pronostico) {
        if (real.length != pronostico.length) {
            throw new IllegalArgumentException("Las series deben tener el mismo numero de periodos");
        }
    }

    private static void validarAlMenosUnPeriodo(double[] real) {
        if (real.length == 0) {
            throw new IllegalArgumentException("Se necesita al menos un periodo para calcular el MAD");
        }
    }
}
