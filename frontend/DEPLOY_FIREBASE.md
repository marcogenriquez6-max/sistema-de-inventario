# Despliegue en Firebase Hosting

## 1) Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

## 2) Iniciar sesión

```bash
firebase login
```

## 3) Crear o seleccionar proyecto en Firebase

En Firebase Console crea un proyecto o usa uno existente.

## 4) Inicializar Hosting

```bash
cd frontend
firebase init hosting
```

Selecciona:
- "Use an existing project" o "Create a new project"
- Elige el proyecto de Firebase
- El directorio público: `dist/frontend`
- Configura como SPA: `Yes`

## 5) Construir la app

```bash
npm run build
```

## 6) Desplegar

```bash
firebase deploy
```

## 7) URL final

Firebase te entregará una URL tipo:

```text
https://<tu-proyecto>.web.app
```
