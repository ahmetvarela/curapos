# CuraPOS Web

Sitio web estático de CuraPOS (HTML, CSS y JavaScript, sin build).

## Archivos

- `index.html` — página principal
- `pos-home-3d.css` / `pos-home-3d.js` — estilos y animaciones de la portada
- `pos-enhance.css` / `pos-enhance.js` — mejoras de interfaz
- `support.js` — módulo de soporte

## Desarrollo local

Abrir `index.html` en el navegador, o servirlo:

```bash
python -m http.server 8000
```

Luego visitar http://localhost:8000

## Despliegue

Publicado con GitHub Pages desde la rama `main` (carpeta raíz), en el dominio
[curapos.com](https://curapos.com).

Para publicar un cambio:

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

📖 **Ver [DEPLOY.md](DEPLOY.md)** para la guía completa: configuración de DNS en
Cloudflare, estado del HTTPS, comandos de diagnóstico y solución de problemas.
