def mad(real, pronostico):
    _validar_misma_longitud(real, pronostico)
    _validar_al_menos_un_periodo(real)

    errores_absolutos = [
        abs(real_i - pronostico_i) for real_i, pronostico_i in zip(real, pronostico)
    ]
    return sum(errores_absolutos) / len(real)


def _validar_misma_longitud(real, pronostico):
    if len(real) != len(pronostico):
        raise ValueError("Las series deben tener el mismo numero de periodos")


def _validar_al_menos_un_periodo(real):
    if len(real) == 0:
        raise ValueError("Se necesita al menos un periodo para calcular el MAD")
