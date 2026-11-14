/**
 * Tolerancja w pikselach dla porównań liczb zmiennoprzecinkowych w całym silniku.
 * Obiekty, które tylko stykają się krawędziami (albo nachodzą o mniej niż EPSILON
 * przez błędy zaokrągleń), nie kolidują.
 */
export const EPSILON = 1e-6
