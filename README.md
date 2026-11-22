# PULSO 90
**La emoción convertida en sonido**  
T06_Sonidos · Diseño UDP · 2026

> PULSO 90 transforma cambios visuales de una jugada de fútbol en una composición sonora. No reproduce el sonido del estadio ni reconoce cuándo ocurre un gol: interpreta la actividad de los fotogramas como **contención, tensión y estallido**.

## 1. Concepto y relación imagen–sonido

La idea surgió al observar una jugada de fútbol que acumula incertidumbre antes de terminar en gol. Quise explorar qué ocurre si esa tensión se **escucha**, en vez de añadir música que acompañe las imágenes. La propuesta trata la jugada y la reacción colectiva como si fueran un organismo: respira, pulsa, se acelera y libera energía.

La relación es de **traducción**, no de semejanza literal. El sistema no identifica emociones, jugadores ni balones; mide cambios de píxeles entre fotogramas. Con esos datos compone un paisaje sonoro de latidos, respiraciones, fricciones, movimientos y un impacto excepcional. Otra persona puede probar diferentes videos locales o la cámara y descubrir cómo una misma regla produce distintas interpretaciones.

Lo que quiero hacer audible es la **variación de intensidad** que solemos sentir durante una jugada, aunque no sea un dato que una cámara pueda medir directamente. Esa distancia entre medición visual y emoción interpretada es parte de la propuesta.

## 2. Banco de sonidos y disparador visual

La plataforma utiliza **ocho muestras WAV** tomadas de Freesound, editadas en fragmentos cortos y normalizadas para su uso interactivo. Según las fichas de origen consultadas para elaborar el banco, las ocho se distribuyen bajo **CC0 1.0**. Se conservan autores y enlaces aunque esa licencia no exija atribución.

| Muestra en `sonidos/` | Autor | Origen | Licencia | Función |
|---|---|---|---|---|
| `01_latido_base.wav` | Seth_Makes_Sounds | [Freesound 850306](https://freesound.org/people/Seth_Makes_Sounds/sounds/850306/) | CC0 1.0 | Reposo / anticipación |
| `02_latido_rapido.wav` | loudernoises | [Freesound 332806](https://freesound.org/people/loudernoises/sounds/332806/) | CC0 1.0 | Aceleración |
| `03_respiracion.wav` | giddster | [Freesound 336532](https://freesound.org/people/giddster/sounds/336532/) | CC0 1.0 | Pausa / espera |
| `04_friccion.wav` | IENBA | [Freesound 850705](https://freesound.org/people/IENBA/sounds/850705/) | CC0 1.0 | Movimiento pequeño |
| `05_murmullo.wav` | craigsmith | [Freesound 480719](https://freesound.org/people/craigsmith/sounds/480719/) | CC0 1.0 | Capa colectiva |
| `06_desplazamiento.wav` | DJT4NN3R | [Freesound 449996](https://freesound.org/people/DJT4NN3R/sounds/449996/) | CC0 1.0 | Movimiento rápido |
| `07_tension.wav` | SoundEffectsForAll | [Freesound 840719](https://freesound.org/people/SoundEffectsForAll/sounds/840719/) | CC0 1.0 | Intensidad alta |
| `08_estallido.wav` | SoundEffectsForAll | [Freesound 840614](https://freesound.org/people/SoundEffectsForAll/sounds/840614/) | CC0 1.0 | Clímax |

**Disparador principal — modo Zonas:** cada fotograma se compara con el anterior. Se calcula el porcentaje de píxeles que cambian en una grilla configurable; una zona debe superar la sensibilidad para poder sonar. Se elige la zona con mayor actividad como candidata al siguiente evento. La ubicación horizontal controla el paneo estéreo; la energía controla el volumen.

**Regla de composición:**
- **Contención:** actividad baja → latido base, respiración y fricción ocasional.
- **Tensión:** actividad media → latido rápido, murmullo y desplazamiento; actividad alta → textura de tensión.
- **Estallido:** actividad global elevada **o subida repentina respecto de su historial**, confirmada durante varios ciclos → impacto sonoro. Tiene histéresis y un mínimo de **5 segundos** antes de poder repetirse.

Para que el resultado no sea un ruido continuo, el motor limita a **3 voces automáticas simultáneas** y separa los disparos normales **al menos 650 ms**. Cada muestra tiene además su propio tiempo de recuperación. El silencio es un resultado válido, no un fallo que debamos rellenar.

**Fuentes visuales:** ejemplo incorporado, cámara web o video elegido desde el computador. Los videos locales se procesan en el navegador y no se envían a un servidor.

## 3. Parámetros y gráfica

La interfaz se diseñó como un **monitor de intensidad audiovisual**, no como un reproductor musical convencional.

**Parámetros principales:**
- **Sensibilidad y umbral:** deciden cuánto cambio visible basta para producir un evento; representan qué tan reactivo es el organismo.
- **Tiempo entre repeticiones:** regula la respuesta rítmica y evita saturación.
- **Volumen:** controla la presencia general de la composición.
- **Filtro pasa-bajos:** permite una escucha más apagada o más abierta, asociada a contención o tensión.
- **Reverb:** aporta sensación de espacio y resonancia colectiva.
- **Grilla y paneo:** convierten la distribución espacial del movimiento en distribución sonora.

En los otros modos heredados de la herramienta base se mantienen controles y síntesis de notas para experimentar con líneas de cruce y escaneo.

**Decisiones gráficas:** fondo azul casi negro (`#10151C`), superficies oscuras (`#1A232D`), blanco cálido (`#F2F1EB`) y acento coral (`#E56A5D`). El coral señala actividad y destaca el nombre **PULSO 90**. Las letras monoespaciadas y las líneas finas remiten a instrumentos de observación. Un monitor muestra el **porcentaje real de cambio**, su historial temporal y las visualizaciones acústicas; el video o la cámara conservan el protagonismo.



## 4. Reflexión y posibles mejoras

En las primeras pruebas el sonido estaba demasiado saturado: muchos eventos ocurrían a la vez y costaba distinguir una progresión. Reducir la polifonía, espaciar los disparos y reservar el impacto para picos poco frecuentes permitió escuchar mejor la transición entre anticipación y tensión. Descubrí que traducir imagen en sonido no significa asignar un efecto a cada píxel, sino **decidir también cuándo algo debe callar**.

El ejercicio también hizo visible una limitación del sistema: mide cambios de imagen, no significado deportivo ni emoción. Un corte de cámara, un cambio de iluminación o el movimiento del encuadre pueden provocar actividad aunque la jugada no sea especialmente intensa. Del mismo modo, una acción decisiva podría producir pocos cambios visuales.

**Mejora 1 — Compensación de cortes y movimiento de cámara.** Incorporaría una detección que distinga la actividad local de los cambios globales de encuadre. Así disminuirían los falsos clímax de transmisiones con muchos cortes.

**Mejora 2 — Editor de dramaturgia sonora.** Permitiría ajustar gráficamente los umbrales de contención, tensión y estallido, escuchar una vista previa y guardar presets por video. Esto facilitaría comparar distintas lecturas de una misma jugada sin modificar código.

### Cómo usar

1. Abrir la [plataforma publicada](#publicacion) o ejecutar la carpeta con un servidor local:
   ```bash
   py -m http.server 8124
   ```
2. Entrar a `http://localhost:8124`.
3. Pulsar **Activar sonido** (el navegador requiere un gesto del usuario).
4. Escoger **Ejemplo**, **Cámara** o **Cargar video**.
5. Usar **Zonas** para oír el banco de muestras y explorar **Banco**, **Detección**, **Acústica** y **Mapping**.

### Publicación

Plataforma interactiva: https://charlesdiner0.github.io/oir-la-luz/

Repositorio: https://github.com/CharlesDiner0/oir-la-luz

### Créditos y procedencia

PULSO 90 se desarrolló a partir de **[Oír la luz](https://github.com/fefeliperoar/oir-la-luz)**, herramienta de Felipe Roa y Santiago Gaete para DPPI / Diseño UDP (2026). Se reutilizó su procesamiento visual, la lógica de audio de Web Audio y diversos modos de interacción, adaptados a un banco de muestras, un mapping emocional y una identidad gráfica propia.

Los ocho sonidos proceden de Freesound y sus fuentes individuales figuran en la tabla anterior. El material deportivo utilizado por cada persona se carga localmente; **el repositorio no incluye videos de transmisiones televisivas de terceros**.

---
**Estado:** PULSO 90, plataforma interactiva publicada y funcional en GitHub Pages.
