#!/usr/bin/env node

/**
 * Скрипт для автоматической генерации manifest.json
 * Сканирует папки в assets и создает список всех файлов
 * 
 * Использование: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const manifestPath = path.join(assetsDir, 'manifest.json');

// Папки для сканирования
const folders = ['icons', 'images', 'ui'];

const manifest = {};

folders.forEach(folder => {
    const folderPath = path.join(assetsDir, folder);
    
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        manifest[folder] = files.filter(file => {
            // Исключаем системные файлы и неподдерживаемые форматы
            return !file.startsWith('.') || file === '.gitkeep';
        });
    } else {
        manifest[folder] = [];
    }
});

// Записываем manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log('✅ manifest.json успешно создан!');
console.log('📁 Найдено файлов:');
Object.keys(manifest).forEach(folder => {
    const count = manifest[folder].filter(f => !f.startsWith('.')).length;
    console.log(`   ${folder}: ${count} файл(ов)`);
});
