.

🔹 1FN (Primera Forma Normal)

👉 Regla: Nada de cosas repetidas en una misma casilla.

Imagina una tabla así:

Estudiante	Cursos
Juan	Matemáticas, Inglés

Aquí está mal porque en “Cursos” hay dos cosas en una sola celda.

Para que esté en 1FN debe quedar así:

Estudiante	Curso
Juan	Matemáticas
Juan	Inglés

✔ Ahora cada celda tiene solo un dato.
Eso es 1FN: un solo valor por casilla y nada de listas dentro de una celda.

🔹 2FN (Segunda Forma Normal)

👉 Regla: Que la información dependa completamente de la clave.

Ahora imagina esta tabla:

Estudiante	Curso	Profesor
Juan	Mate	Carlos
Ana	Mate	Carlos

El problema es que el profesor depende del curso, no del estudiante.

Entonces lo ordenamos así:

Tabla Cursos:

Curso	Profesor
Mate	Carlos

Tabla Inscripciones:

Estudiante	Curso
Juan	Mate
Ana	Mate

✔ Ahora cada dato está donde realmente pertenece.

Eso es 2FN:
Quitar información que no depende completamente de la clave principal.

🔹 3FN (Tercera Forma Normal)

👉 Regla: Nada debe depender de algo que no sea la clave.

Mira esto:

Estudiante	Ciudad	CódigoPostal
Juan	Medellín	050001

El código postal depende de la ciudad, no del estudiante.

Entonces lo separamos:

Tabla Estudiantes:

Estudiante	Ciudad
Juan	Medellín

Tabla Ciudades:

Ciudad	CódigoPostal
Medellín	050001

✔ Ahora todo depende directamente de su clave.

Eso es 3FN:
Eliminar dependencias indirectas.

🎯 Resumen fácil

1FN → No meter varias cosas en una sola celda.

2FN → Cada dato debe depender totalmente de la clave.

3FN → Ningún dato debe depender de otro dato que no sea la clave.