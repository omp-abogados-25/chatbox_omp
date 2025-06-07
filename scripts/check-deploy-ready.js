#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para verificar que el proyecto está listo para el despliegue
 */

console.log('🔍 Verificando configuración de despliegue...');
console.log('');

let allGood = true;
const issues = [];
const warnings = [];

// 1. Verificar archivo .env
console.log('📄 Verificando archivo .env...');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    allGood = false;
    issues.push('❌ Archivo .env no encontrado');
    console.log('❌ No existe .env');
} else {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.trim()) {
        allGood = false;
        issues.push('❌ Archivo .env está vacío');
        console.log('❌ .env está vacío');
    } else {
        console.log('✅ Archivo .env encontrado');
        
        // Verificar variables críticas
        const requiredVars = [
            'NODE_ENV',
            'PORT', 
            'GRAPH_API_TOKEN',
            'BUSINESS_PHONE_NUMBER_ID'
        ];
        
        const missingVars = [];
        requiredVars.forEach(varName => {
            if (!envContent.includes(varName)) {
                missingVars.push(varName);
            }
        });
        
        if (missingVars.length > 0) {
            warnings.push(`⚠️ Variables faltantes en .env: ${missingVars.join(', ')}`);
            console.log(`⚠️ Variables faltantes: ${missingVars.join(', ')}`);
        } else {
            console.log('✅ Variables críticas presentes');
        }
    }
}

// 2. Verificar assets locales
console.log('');
console.log('🖼️ Verificando assets...');
const assetsPath = path.join(process.cwd(), 'assets');
if (!fs.existsSync(assetsPath)) {
    warnings.push('⚠️ Carpeta assets/ no encontrada - copia manualmente al servidor');
    console.log('⚠️ No existe carpeta assets/');
    console.log('💡 Recuerda copiar assets directamente al servidor');
} else {
    const assetFiles = fs.readdirSync(assetsPath, { recursive: true });
    console.log(`✅ Carpeta assets encontrada (${assetFiles.length} archivos)`);
    
    // Verificar archivos importantes
    const importantAssets = ['firma.png', 'firma2.png', 'logo-omp.png'];
    const missingAssets = [];
    
    importantAssets.forEach(asset => {
        const assetPath = path.join(assetsPath, asset);
        if (!fs.existsSync(assetPath)) {
            missingAssets.push(asset);
        }
    });
    
    if (missingAssets.length > 0) {
        warnings.push(`⚠️ Assets importantes faltantes: ${missingAssets.join(', ')}`);
        console.log(`⚠️ Assets faltantes: ${missingAssets.join(', ')}`);
    } else {
        console.log('✅ Assets importantes presentes');
    }
    
    console.log('💡 Recuerda: copiar assets al servidor con SCP o FileZilla');
}

// 3. Verificar package.json
console.log('');
console.log('📦 Verificando package.json...');
const packagePath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packagePath)) {
    allGood = false;
    issues.push('❌ package.json no encontrado');
    console.log('❌ No existe package.json');
} else {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log('✅ package.json válido');
        
        if (!packageJson.scripts || !packageJson.scripts.build) {
            warnings.push('⚠️ Script "build" no encontrado en package.json');
            console.log('⚠️ Script "build" faltante');
        } else {
            console.log('✅ Script "build" presente');
        }
        
        if (!packageJson.scripts || !packageJson.scripts['generate-secrets']) {
            warnings.push('⚠️ Script "generate-secrets" no encontrado');
            console.log('⚠️ Script "generate-secrets" faltante');
        } else {
            console.log('✅ Script "generate-secrets" presente');
        }
        
    } catch (error) {
        allGood = false;
        issues.push('❌ package.json inválido');
        console.log('❌ package.json malformado');
    }
}

// 4. Verificar scripts
console.log('');
console.log('🔧 Verificando scripts...');
const scriptsPath = path.join(process.cwd(), 'scripts');
if (!fs.existsSync(scriptsPath)) {
    allGood = false;
    issues.push('❌ Carpeta scripts/ no encontrada');
    console.log('❌ No existe carpeta scripts/');
} else {
    const requiredScripts = ['generate-all-secrets.js', 'encode-env.js'];
    const missingScripts = [];
    
    requiredScripts.forEach(script => {
        const scriptPath = path.join(scriptsPath, script);
        if (!fs.existsSync(scriptPath)) {
            missingScripts.push(script);
        }
    });
    
    if (missingScripts.length > 0) {
        allGood = false;
        issues.push(`❌ Scripts faltantes: ${missingScripts.join(', ')}`);
        console.log(`❌ Scripts faltantes: ${missingScripts.join(', ')}`);
    } else {
        console.log('✅ Scripts requeridos presentes');
    }
}

// 5. Verificar workflow
console.log('');
console.log('⚙️ Verificando GitHub Actions...');
const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
if (!fs.existsSync(workflowPath)) {
    allGood = false;
    issues.push('❌ Workflow de GitHub Actions no encontrado');
    console.log('❌ No existe .github/workflows/deploy.yml');
} else {
    console.log('✅ Workflow de GitHub Actions presente');
}

// Mostrar resumen
console.log('');
console.log('📊 RESUMEN:');
console.log('');

if (allGood && issues.length === 0) {
    console.log('🎉 ¡Todo está listo para el despliegue!');
} else {
    console.log('🔧 Se encontraron algunos problemas:');
    issues.forEach(issue => console.log(`   ${issue}`));
}

if (warnings.length > 0) {
    console.log('');
    console.log('⚠️ Advertencias:');
    warnings.forEach(warning => console.log(`   ${warning}`));
}

console.log('');
console.log('🎯 PRÓXIMOS PASOS:');
console.log('1. 🔧 npm run generate-secrets');
console.log('2. 🔐 Configurar 4 secrets en GitHub');
console.log('3. 📁 Copiar assets al servidor');
console.log('4. 🚀 git push origin main');
console.log('');
console.log('💡 Para copiar assets:');
console.log('   scp -i "tu-clave.pem" -r assets/ ubuntu@ec2-ip:/home/ubuntu/omp_chatbox/');

if (!allGood) {
    process.exit(1);
} 