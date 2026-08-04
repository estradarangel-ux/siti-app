# Catálogo de empresas compartido (Firestore)

El campo **Cliente / Empresa** de Levantamiento autocompleta contacto, teléfono,
correo y dirección a partir de un catálogo de empresas. Cuando la app corre con
Firebase, ese catálogo es **compartido por todo el equipo**: se guarda en la
colección `empresas` de Firestore (cada empresa capturada en un dispositivo
aparece en los demás).

## Paso necesario: reglas de seguridad

Para que el catálogo compartido funcione, hay que permitir que cualquier usuario
con sesión iniciada lea y escriba la colección `empresas`. En la consola de
Firebase → **Firestore Database → Reglas**, agrega este bloque **dentro** de tu
`match /databases/{database}/documents { ... }` (junto a las reglas que ya
tienes para `surveys` y `users`, sin borrarlas):

```
match /empresas/{empresaId} {
  allow read, write: if request.auth != null;
}
```

Publica las reglas. A partir de ahí, cada vez que se guarda un levantamiento, la
empresa (nombre, contacto, teléfono, correo y dirección) queda registrada en el
catálogo compartido.

## Notas

- El catálogo se sincroniza **en tiempo real**: una empresa nueva capturada por
  un técnico aparece de inmediato en los demás dispositivos con la app abierta
  (suscripción `onSnapshot` de Firestore).
- No se borra información: si un campo se guarda vacío, se conserva el último
  dato conocido de esa empresa (`merge`).
- En modo local / preview (sin Firebase) el catálogo se guarda solo en ese
  dispositivo, como antes.
