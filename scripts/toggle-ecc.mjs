#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const geminiMdPath = path.join(rootDir, 'GEMINI.md');
const eccRulePath = path.join(rootDir, '.agents', 'rules', 'ecc-kurallari.md');

const ACTION = (process.argv[2] || '--status').toLowerCase().replace(/^--?/, '');

function getFileStatus(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('ECC_STATUS:ACTIVE') || content.includes('<!-- ECC_STATUS:ACTIVE -->')) {
    return 'AKTİF';
  }
  if (content.includes('ECC_STATUS:INACTIVE') || content.includes('<!-- ECC_STATUS:INACTIVE -->')) {
    return 'PASİF';
  }
  return 'TANIMSIZ';
}

function updateFileStatus(filePath, makeActive) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf-8');

  if (makeActive) {
    content = content.replace(/<!--\s*ECC_STATUS:INACTIVE\s*-->/g, '<!-- ECC_STATUS:ACTIVE -->');
    content = content.replace(/> \*\*ECC DURUMU:\*\* `PASİF`/g, '> **ECC DURUMU:** `AKTİF`');
    content = content.replace(/DURUM: PASİF <!-- ECC_STATUS:INACTIVE -->/g, 'DURUM: AKTİF <!-- ECC_STATUS:ACTIVE -->');
  } else {
    content = content.replace(/<!--\s*ECC_STATUS:ACTIVE\s*-->/g, '<!-- ECC_STATUS:INACTIVE -->');
    content = content.replace(/> \*\*ECC DURUMU:\*\* `AKTİF`/g, '> **ECC DURUMU:** `PASİF`');
    content = content.replace(/DURUM: AKTİF <!-- ECC_STATUS:ACTIVE -->/g, 'DURUM: PASİF <!-- ECC_STATUS:INACTIVE -->');
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

const currentStatus = getFileStatus(geminiMdPath) || 'PASİF';

switch (ACTION) {
  case 'status':
  case 'info':
  case 'check':
    console.log(`\n[ECC ENTEGRASYON DURUMU]: ${currentStatus}`);
    console.log(`- GEMINI.md: ${getFileStatus(geminiMdPath)}`);
    console.log(`- ecc-kurallari.md: ${getFileStatus(eccRulePath)}`);
    console.log(`- ecc dizini: ${fs.existsSync(path.join(rootDir, 'ecc')) ? 'Mevcut (Kurulu)' : 'Eksik'}\n`);
    break;

  case 'enable':
  case 'activate':
  case 'on':
  case '1':
    updateFileStatus(geminiMdPath, true);
    updateFileStatus(eccRulePath, true);
    console.log('\n[ECC ENTEGRASYONU AKTİF EDİLDİ]');
    console.log('Gemini bundan sonraki oturumlarda ve görevlerde `ecc/` reposunu okumak ve uygulamakla yükümlüdür.\n');
    break;

  case 'disable':
  case 'deactivate':
  case 'off':
  case '0':
    updateFileStatus(geminiMdPath, false);
    updateFileStatus(eccRulePath, false);
    console.log('\n[ECC ENTEGRASYONU DEAKTİVE EDİLDİ (PASİF)]');
    console.log('Gemini için `ecc/` reposunu okuma ve uygulama zorunluluğu kaldırıldı. Standart repo kuralları geçerlidir.\n');
    break;

  case 'toggle':
  case 'switch':
    const targetState = currentStatus !== 'AKTİF';
    updateFileStatus(geminiMdPath, targetState);
    updateFileStatus(eccRulePath, targetState);
    console.log(`\n[ECC ENTEGRASYONU DEĞİŞTİRİLDİ]: ${targetState ? 'AKTİF' : 'PASİF'}\n`);
    break;

  default:
    console.log(`Kullanım: node scripts/toggle-ecc.js [--status | --enable | --disable | --toggle]`);
    process.exit(1);
}
