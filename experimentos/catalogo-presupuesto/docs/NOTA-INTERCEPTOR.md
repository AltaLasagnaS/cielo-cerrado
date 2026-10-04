# Nota reproducible para Claude: límite inferior de solveTd

Se leyó el módulo de `main` en `4bbb5a2` mediante `git show`, sin cambiar rama ni archivos. La nota es diagnóstico; no se implementó una corrección en el repo.

En el modelo actual, al terminar la aceleración ya se recorrió `s_b = vmax × tb / 2`. Si se desea un tiempo de llegada `T > tb`, ningún frenado posterior puede hacer que la distancia acumulada sea menor o igual a `s_b` mediante un tiempo de frenado finito positivo.

La condición documentada `T > tb` y `vmax × (T − tb/2) > R` controla el límite superior sin frenado, pero no comprueba este límite inferior. El código de `solveTd` busca desde `τd = 0,001` y puede devolver ese extremo aunque no exista solución.

Reproducción con datos matemáticos ficticios, no de una munición:

```js
const tb = 20, vmax = 200, R = 1000, T = 100;
const td = solveTd(tb, vmax, R, T);
// Resultado observado en 4bbb5a2: td = 0.001
distAt({ tb, vmax, td }, T);
// ≈ 2002.2579588827157 m, no los 1000 m solicitados.
```

En ese ejemplo, durante la aceleración ya se recorrieron 2000 m. Frenar después no permite volver a 1000 m. La igualdad con `s_b` también requiere tratarse como límite, no solución positiva finita.

No se comprobó que esto suceda con los valores probables ni con los rangos actuales de `UNC`. No implica que los escenarios medidos por Claude sean inválidos. Sí es pertinente antes de sumar perfiles y revisar combinaciones sorteadas.

Recomendación: incorporar una guarda y prueba para `R ≤ s_b` con `T > tb`, y decidir/documentar el comportamiento alternativo. Revisar también que los límites numéricos de la bisección realmente encierren la solución antes de informar calibración exitosa.

El comprobador del paquete paralelo devuelve `requires-review` para esos datos; no inventa `τd`, no altera el motor y no presenta esa condición como perfil calibrado.
