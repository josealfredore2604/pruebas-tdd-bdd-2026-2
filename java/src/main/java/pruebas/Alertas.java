package pruebas;

public class Alertas {

    public static boolean debeGenerarAlerta(double errorPorcentual, double umbralPorcentual) {
        return errorPorcentual >= umbralPorcentual;
    }
}
