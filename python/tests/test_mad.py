import pytest

from src.mad import mad


def test_calcula_el_error_absoluto_medio_de_una_serie_de_pronosticos():
    real = [141, 138, 150]
    pronostico = [126.67, 133.67, 135.67]

    assert mad(real, pronostico) == pytest.approx(11.00, abs=0.01)


def test_devuelve_0_cuando_el_pronostico_es_exacto():
    assert mad([100, 100], [100, 100]) == 0


def test_lanza_un_error_si_las_series_no_tienen_la_misma_longitud():
    with pytest.raises(ValueError, match="mismo numero de periodos"):
        mad([100, 110], [100])


def test_lanza_un_error_si_alguna_de_las_series_esta_vacia():
    with pytest.raises(ValueError, match="al menos un periodo"):
        mad([], [])
