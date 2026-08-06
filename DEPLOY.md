# Despliegue de CuraPOS — guía completa

> **Para Claude / cualquier chat nuevo:** este archivo tiene todo lo que necesitas
> saber sobre cómo está montada y publicada esta web. Léelo antes de tocar nada
> relacionado con despliegue, DNS o GitHub.

Última actualización: 5 de agosto de 2026.

---

## 1. Qué es este proyecto

Sitio web **estático** de CuraPOS. Solo HTML, CSS y JavaScript.
**No hay build, no hay npm, no hay framework.** Se editan los archivos y listo.

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal (todo el contenido vive aquí) |
| `pos-home-3d.css` / `pos-home-3d.js` | Estilos y animaciones 3D de la portada |
| `pos-enhance.css` / `pos-enhance.js` | Mejoras de interfaz |
| `support.js` | Módulo de soporte |
| `CNAME` | **No borrar.** Le dice a GitHub Pages que el dominio es `curapos.com` |
| `.nojekyll` | **No borrar.** Evita que GitHub Pages ignore archivos que empiezan con `_` |
| `.gitignore` | Excluye `.claude/`, `node_modules/`, `.env`, etc. |

---

## 2. Dónde vive

| Cosa | Valor |
|---|---|
| Carpeta local | `C:\Users\Ultra 7\Documents\cura-posweb` |
| Repositorio | https://github.com/ahmetvarela/curapos |
| Visibilidad | **Público** (obligatorio: GitHub Pages gratis no funciona en repos privados) |
| Rama de publicación | `main`, carpeta raíz (`/`) |
| Hosting | GitHub Pages |
| Dominio | `curapos.com` |
| Registrador / DNS | **Cloudflare** |
| Cuenta GitHub | `ahmetvarela` |

---

## 3. Cómo publicar un cambio (lo que harás el 99% de las veces)

Editas los archivos que quieras y luego, en la terminal:

```bash
cd "C:\Users\Ultra 7\Documents\cura-posweb"
git add -A
git commit -m "describe aquí el cambio"
git push
```

Los cambios salen en vivo en `curapos.com` en **~1 minuto**.

### Ver el sitio localmente antes de subirlo

```bash
cd "C:\Users\Ultra 7\Documents\cura-posweb"
python -m http.server 8000
```

Luego abre http://localhost:8000

---

## 4. Configuración de DNS en Cloudflare (ya hecha, no tocar)

Panel: https://dash.cloudflare.com → `curapos.com` → **DNS → Records**

Nameservers del dominio: `dahlia.ns.cloudflare.com` y `thaddeus.ns.cloudflare.com`

**5 registros, todos con Proxy status = `DNS only` (nube GRIS) y TTL `Auto`:**

| # | Type | Name | Valor |
|---|---|---|---|
| 1 | A | `@` | `185.199.108.153` |
| 2 | A | `@` | `185.199.109.153` |
| 3 | A | `@` | `185.199.110.153` |
| 4 | A | `@` | `185.199.111.153` |
| 5 | CNAME | `www` | `ahmetvarela.github.io` |

### Ajustes críticos de Cloudflare

- **SSL/TLS → Overview → modo `Full`.**
  ❌ Nunca `Flexible`: causa bucle infinito de redirecciones con GitHub Pages.
- **Nubes en GRIS (DNS only).** Con la nube naranja (proxy activado) GitHub
  **no puede emitir el certificado HTTPS**. Solo considerar activar el proxy
  después de que el candado 🔒 ya funcione.

---

## 5. Estado del HTTPS

Al 5 de agosto de 2026: el sitio funciona en `http://curapos.com`, pero GitHub
**todavía no había emitido el certificado HTTPS**. No era un error de
configuración — todo el DNS estaba correcto y verificado, no había registros CAA
bloqueando. GitHub simplemente tarda entre 15 minutos y 24 horas.

### Cómo revisar si ya salió el certificado

```bash
& "C:\Program Files\GitHub CLI\gh.exe" api repos/ahmetvarela/curapos/pages --jq '{cert:.https_certificate.state,https:.https_enforced}'
```

Cuando `cert` diga `approved`, activa el HTTPS forzado:

```bash
& "C:\Program Files\GitHub CLI\gh.exe" api -X PUT repos/ahmetvarela/curapos/pages -F "https_enforced=true"
```

### Si pasadas 24 horas sigue sin certificado

El truco estándar es quitar y volver a poner el dominio personalizado:

```bash
& "C:\Program Files\GitHub CLI\gh.exe" api -X PUT repos/ahmetvarela/curapos/pages -f "cname="
& "C:\Program Files\GitHub CLI\gh.exe" api -X PUT repos/ahmetvarela/curapos/pages -f "cname=curapos.com"
```

O manualmente en https://github.com/ahmetvarela/curapos/settings/pages

---

## 6. Herramientas instaladas

**GitHub CLI** está instalada pero **no está en el PATH**. Hay que llamarla con la
ruta completa:

```bash
& "C:\Program Files\GitHub CLI\gh.exe" <comando>
```

Ya tiene sesión iniciada como `ahmetvarela` (scopes: `repo`, `workflow`,
`read:org`, `gist`).

Identidad de git configurada localmente en este repo:
`ahmetvarela` / `jafetahmet2004@gmail.com`

---

## 7. Comandos de diagnóstico útiles

```powershell
# ¿El sitio responde?
Invoke-WebRequest "http://curapos.com/" -UseBasicParsing | Select-Object StatusCode

# ¿El DNS resuelve bien? (deben salir las 4 IPs 185.199.10x.153)
Resolve-DnsName curapos.com -Type A

# ¿Y el www?
Resolve-DnsName www.curapos.com

# Estado del último build de GitHub Pages
& "C:\Program Files\GitHub CLI\gh.exe" api repos/ahmetvarela/curapos/pages/builds/latest --jq '{status:.status,error:.error.message}'

# Configuración completa de Pages
& "C:\Program Files\GitHub CLI\gh.exe" api repos/ahmetvarela/curapos/pages
```

---

## 8. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El cambio no aparece en la web | No hiciste `git push`, o el build sigue corriendo | Revisa `git status` y el estado del build (sección 7) |
| Bucle de redirecciones infinito | Cloudflare en modo `Flexible` | Cambiar SSL/TLS a `Full` |
| HTTPS no funciona nunca | Nube naranja (proxy) activada | Ponerla en gris (DNS only) |
| Error 404 en todo el sitio | Se borró `CNAME`, o Pages quedó apuntando a otra rama | Revisar sección 5 y settings/pages |
| Archivos que empiezan con `_` no cargan | Falta `.nojekyll` | Recrearlo (archivo vacío) |
| El repo se volvió privado | Pages deja de funcionar (plan gratuito) | Volverlo público |

---

## 9. Reglas importantes

1. **Nunca borrar `CNAME` ni `.nojekyll`.**
2. **El repo debe seguir siendo público** o Pages deja de funcionar.
3. **No poner claves, contraseñas ni tokens en estos archivos** — el repo es
   público y todo lo que subas queda visible para cualquiera. Además, en una web
   estática cualquier visitante puede leer el JavaScript desde su navegador.
4. La rama de publicación es `main`. No renombrarla.
