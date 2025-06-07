#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script simple para generar solo las variables de entorno para GitHub
 */

console.log('🔧 Generando variables de entorno para GitHub...');
console.log('');

const outputDir = path.join(process.cwd(), 'github-secrets');

try {
    // Crear directorio de salida
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Creado directorio: ${outputDir}`);
    }

    // Limpiar archivos anteriores
    if (fs.existsSync(outputDir)) {
        const existingFiles = fs.readdirSync(outputDir);
        existingFiles.forEach(file => {
            fs.unlinkSync(path.join(outputDir, file));
        });
        console.log('🧹 Limpiando archivos anteriores...');
    }
    console.log('');

    // Generar ENV_BASE64
    console.log('🔧 Procesando variables de entorno...');
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ Error: No se encontró el archivo .env');
        console.log('💡 Crea un archivo .env con tus variables de entorno primero');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.trim()) {
        console.error('❌ Error: El archivo .env está vacío');
        process.exit(1);
    }

    const envBase64 = Buffer.from(envContent).toString('base64');
    fs.writeFileSync(path.join(outputDir, 'ENV_BASE64.txt'), envBase64);
    console.log('✅ Generado: ENV_BASE64.txt');

    // Generar archivo de instrucciones
    const instructions = `🔐 INSTRUCCIONES PARA GITHUB SECRETS

Ve a tu repositorio → Settings → Secrets and variables → Actions

Configura estos secrets:

1. Secret Name: ENV_BASE64
   Archivo: ENV_BASE64.txt
   Descripción: Variables de entorno del sistema
   📄 Copia todo el contenido del archivo ENV_BASE64.txt

2. Secret Name: EC2_HOST
   Valor: ec2-3-20-176-105.us-east-2.compute.amazonaws.com
   Descripción: IP del servidor AWS

3. Secret Name: EC2_USER
   Valor: ubuntu
   Descripción: Usuario del servidor

4. Secret Name: EC2_PRIVATE_KEY
   Valor: (contenido completo del archivo .pem)
   Descripción: Clave privada SSH para conectar al servidor

⚠️  IMPORTANTE:
- Debes configurar TODOS los 4 secrets listados arriba
- Los nombres deben ser exactamente como se muestran
- Para los assets (firmas, logos), cópialos directamente al servidor

🚀 Una vez configurados todos los secrets, haz push para desplegar automáticamente.

📂 Assets: Cópialos manualmente al servidor en /home/ubuntu/omp_chatbox/assets/
`;

    fs.writeFileSync(path.join(outputDir, '_INSTRUCCIONES.txt'), instructions);
    console.log('✅ Generado: _INSTRUCCIONES.txt');

    // Mostrar resumen
    console.log('');
    console.log('🎉 ¡Archivos generados exitosamente!');
    console.log('');
    console.log('📂 Archivos creados en github-secrets/:');
    console.log('   📄 ENV_BASE64.txt → Secret: ENV_BASE64');
    console.log('   📋 _INSTRUCCIONES.txt → Guía completa');
    console.log('');
    console.log('🎯 PASOS SIGUIENTES:');
    console.log('1. 📖 Lee: github-secrets/_INSTRUCCIONES.txt');
    console.log('2. 🔐 Configura los 4 secrets en GitHub');
    console.log('3. 📁 Copia assets directamente al servidor');
    console.log('4. 🚀 Haz push para desplegar');
    console.log('');
    console.log('💡 Assets: Usa SCP o FileZilla para copiar al servidor');

} catch (error) {
    console.error('❌ Error generando secrets:', error.message);
    console.log('');
    console.log('💡 Verifica que exista:');
    console.log('   - Archivo .env con contenido válido');
    console.log('   - Permisos de escritura en el directorio');
    process.exit(1);
} 