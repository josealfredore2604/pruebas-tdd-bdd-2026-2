from pytest_bdd import given, parsers, scenarios, then, when

from src.alertas import debe_generar_alerta

scenarios("alertas.feature")


@given(parsers.parse("un umbral de alerta configurado en {umbral:d} %"), target_fixture="umbral")
def umbral_configurado(umbral):
    return umbral


@when(parsers.parse("el error del pronóstico es {error:d} %"), target_fixture="resultado")
def error_del_pronostico(umbral, error):
    return debe_generar_alerta(error, umbral)


@then("se debe generar una alerta")
def se_genera_alerta(resultado):
    assert resultado is True


@then("no se debe generar una alerta")
def no_se_genera_alerta(resultado):
    assert resultado is False
