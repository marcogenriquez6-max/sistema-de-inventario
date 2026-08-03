# Firebase Data Connect para sistema de repuestos

Esta carpeta contiene una estructura mínima para empezar con Firebase Data Connect / SQL Connect.

## Archivos principales
- dataconnect.yaml: configuración del servicio
- schema/schema.gql: esquema GraphQL + tablas
- queries/queries.gql: consultas de ejemplo
- mutations/mutations.gql: mutaciones de ejemplo
- seed_data.gql: datos iniciales para probar localmente

## Próximo paso
Ejecuta en la terminal:

```powershell
npm install -g firebase-tools
firebase login
firebase init dataconnect
```

Luego usa la extensión de VS Code para iniciar el emulador y probar los archivos.
