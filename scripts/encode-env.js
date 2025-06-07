#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para codificar el archivo .env en base64 para GitHub Secrets
 */

const envPath = path.join(process.cwd(), '.env');
const outputDir = path.join(process.cwd(), 'github-secrets');

if (!fs.existsSync(envPath)) {
    console.error('❌ Error: No se encontró el archivo .env en el directorio actual');
    console.log('💡 Crea un archivo .env con tus variables de entorno primero');
    process.exit(1);
}

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (!envContent.trim()) {
        console.error('❌ Error: El archivo .env está vacío');
        process.exit(1);
    }
    
    const base64Content = Buffer.from(envContent).toString('base64');
    
    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Creado directorio: ${outputDir}`);
    }
    
    // Guardar en archivo
    fs.writeFileSync(path.join(outputDir, 'ENV_BASE64.txt'), base64Content);
    
    console.log('🎉 ¡Archivo .env codificado exitosamente!');
    console.log('');
    console.log('📄 Archivo generado: github-secrets/ENV_BASE64.txt');
    console.log('');
    console.log('📋 Instrucciones:');
    console.log('1. Ve a tu repositorio de GitHub');
    console.log('2. Settings → Secrets and variables → Actions');
    console.log('3. Crea un nuevo secret llamado: ENV_BASE64');
    console.log('4. Copia todo el contenido del archivo ENV_BASE64.txt');
    console.log('');
    console.log('🔐 También puedes ver el contenido aquí:');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│ ${base64Content.substring(0, 39)}... │`);
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    console.log('🚀 Una vez configurado ENV_BASE64, continúa con los assets');
    
} catch (error) {
    console.error('❌ Error leyendo el archivo .env:', error.message);
    process.exit(1);
} 