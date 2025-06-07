# 🤖 OMP ChatBox - Sistema de Certificados Laborales

Sistema automatizado de WhatsApp para generación de certificados laborales.

## 🚀 Despliegue Súper Fácil

### ⭐ Método Simplificado
```bash
# 1. Generar archivo de variables de entorno
npm run generate-secrets

# 2. Abre la carpeta: github-secrets/
# 3. Lee: _INSTRUCCIONES.txt
# 4. Configura los 4 secrets en GitHub
# 5. Copia assets directamente al servidor
```

### 📂 Lo que obtienes:
```
github-secrets/
├── ENV_BASE64.txt        → Secret: ENV_BASE64
└── _INSTRUCCIONES.txt    → 📋 Tu guía paso a paso
```

### 🎯 Proceso Completo:

1. **Generar variables de entorno:**
   ```bash
   npm run generate-secrets
   ```

2. **Configurar GitHub Secrets:**
   - Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
   - Abre la carpeta `github-secrets/`
   - Lee `_INSTRUCCIONES.txt`
   - Configura estos 4 secrets:
     - `ENV_BASE64` (del archivo ENV_BASE64.txt)
     - `EC2_HOST`: `ec2-3-20-176-105.us-east-2.compute.amazonaws.com`
     - `EC2_USER`: `ubuntu`
     - `EC2_PRIVATE_KEY`: Contenido completo del archivo `.pem`

3. **Copiar assets al servidor:**
   ```bash
   # Usando SCP (reemplaza la ruta de tu .pem)
   scp -i "tu-clave.pem" -r assets/ ubuntu@ec2-3-20-176-105.us-east-2.compute.amazonaws.com:/home/ubuntu/omp_chatbox/
   
   # O usando FileZilla/WinSCP con GUI
   ```

4. **Desplegar:**
   ```bash
   git push origin main
   ```

## 📋 Comandos Disponibles

```bash
# Verificar configuración
npm run check-deploy

# Generar variables de entorno (RECOMENDADO)
npm run generate-secrets

# Solo variables de entorno
npm run encode-env
```

## 🔧 Desarrollo

```bash
# Desarrollo local
npm run start:dev

# Producción local
npm run build
npm run start:prod
```

## 🔧 Monitoreo en Servidor

```bash
# Conectar al servidor
ssh -i "chatbox_omp_key_server.pem" ubuntu@ec2-3-20-176-105.us-east-2.compute.amazonaws.com

# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs chatbox-omp

# Reiniciar aplicación
pm2 restart chatbox-omp
```

## ✨ Características

- 🔧 **Variables de Entorno Protegidas**: Configuración segura
- 🤖 **Despliegue Automático**: Push → Deploy automático
- 📁 **Assets Directos**: Copia manual al servidor (más rápido)
- 📋 **Proceso Simple**: Solo 4 secrets de GitHub
- ⚡ **Súper Fácil**: Un comando para variables de entorno

## 📖 Documentación Completa

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para documentación detallada.

## 🔒 Seguridad

- ✅ Variables de entorno encriptadas  
- ✅ Archivos de secrets en .gitignore
- ✅ Assets copiados directamente (no expuestos)
- ✅ Conexión SSH segura
- ✅ Despliegue automático sin exposición de secretos

---

**Desarrollado para OMP Abogados** | Sistema de Certificados Laborales v2.0
