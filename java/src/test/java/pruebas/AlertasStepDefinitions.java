package pruebas;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.cucumber.java.es.Cuando;
import io.cucumber.java.es.Dado;
import io.cucumber.java.es.Entonces;

public class AlertasStepDefinitions {

    private int umbral;
    private boolean resultado;

    @Dado("un umbral de alerta configurado en {int} %")
    public void unUmbralDeAlertaConfiguradoEn(int umbral) {
        this.umbral = umbral;
    }

    @Cuando("el error del pronóstico es {int} %")
    public void elErrorDelPronosticoEs(int error) {
        resultado = Alertas.debeGenerarAlerta(error, umbral);
    }

    @Entonces("se debe generar una alerta")
    public void seDebeGenerarUnaAlerta() {
        assertTrue(resultado);
    }

    @Entonces("no se debe generar una alerta")
    public void noSeDebeGenerarUnaAlerta() {
        assertFalse(resultado);
    }
}
