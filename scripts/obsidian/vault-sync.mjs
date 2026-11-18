#!/usr/bin/env node
/**
 * scripts/obsidian/vault-sync.mjs
 * Obsidian Kasa Güvenli Otomatik Senkronizasyon ve Gizli Bilgi (Secret) Filtreleme Betiği
 * 
 * Hakemli Hibrit Sistemi - Teknik Çözüm Standardı
 * 
 * Görevler:
 * 1. Process & Lock Kontrolü: Obsidian açık/kapalı durumunu ve .git/index.lock kilitlerini denetler.
 * 2. Secret Scanner Güvenlik Duvarı: API anahtarı, token veya credential içeren dosyaların commit edilmesini engeller.
 * 3. Ghost Sync Çözümü: Obsidian kapalı olsa dahi yereldeki tüm değişiklikleri güvenle commit ve push yapar.
 * 4. Çakışma Önleme: Remote ile pull --rebase yaparak senkronizasyonu tamamlar.
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || 'C:\\Users\\hsyn\\Documents\\Notlar';

// 1. SECRET SCANNER REGEX KALIPLARI
const SECRET_PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/ },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{20,}/ },
  { name: 'Google Gemini/Cloud Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'GitHub Personal Token', regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA|EC|OPENSSH|PGP|DSA)? ?PRIVATE KEY-----/ },
  { name: 'Database Connection URI', regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^\s:]+:[^\s@]+@/ },
  { name: 'Generic Password/Secret Assignment', regex: /(?:password|secret|apikey|access_token|private_key)\s*[:=]\s*["'][^"']{8,}["']/i }
];

function log(msg) {
  console.log(`[Vault-Sync] ${msg}`);
}

function errorLog(msg) {
  console.error(`\x1b[31m[Vault-Sync ERROR]\x1b[0m ${msg}`);
}

function runGit(args) {
  return execSync(`git -C "${VAULT_PATH}" ${args}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function checkProcessRunning(processName) {
  try {
    const stdout = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`, { encoding: 'utf-8' });
    return stdout.toLowerCase().includes(processName.toLowerCase());
  } catch {
    return false;
  }
}

function handleIndexLock() {
  const lockFile = path.join(VAULT_PATH, '.git', 'index.lock');
  if (fs.existsSync(lockFile)) {
    log('Uyarı: .git/index.lock tespit edildi. Çalışan git işlemleri kontrol ediliyor...');
    const isGitRunning = checkProcessRunning('git.exe');
    if (isGitRunning) {
      log('Bir git işlemi devam ediyor, 3 saniye bekleniyor...');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
      if (fs.existsSync(lockFile)) {
        throw new Error('Git işlemi devam ettiği için işlem kilitlendi. Lütfen bekleyin veya çakışmayı giderin.');
      }
    } else {
      log('Kalıntı (stale) .git/index.lock temizleniyor...');
      try {
        fs.unlinkSync(lockFile);
        log('.git/index.lock başarıyla temizlendi.');
      } catch (err) {
        throw new Error(`index.lock silinemedi: ${err.message}`);
      }
    }
  }
}

function scanForSecrets() {
  log('Güvenlik Duvarı: Değişiklikler ve yeni dosyalar gizli bilgi (secret) taramasından geçiriliyor...');
  
  // Untracked ve modified dosyaları bul
  const statusOutput = runGit('status --porcelain');
  if (!statusOutput) return;

  const lines = statusOutput.split('\n');
  const filesToScan = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const filePath = line.substring(3).trim().replace(/^"|"$/g, '');
    filesToScan.push(filePath);
  }

  const detectedSecrets = [];

  for (const relPath of filesToScan) {
    const fullPath = path.join(VAULT_PATH, relPath);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
    
    // .git veya ikili dosyaları atla
    if (relPath.startsWith('.git') || relPath.endsWith('.png') || relPath.endsWith('.jpg') || relPath.endsWith('.pdf')) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const contentLines = content.split('\n');

    for (let i = 0; i < contentLines.length; i++) {
      const lineText = contentLines[i];
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(lineText)) {
          detectedSecrets.push({
            file: relPath,
            line: i + 1,
            type: pattern.name,
            snippet: lineText.trim().substring(0, 50) + '...'
          });
        }
      }
    }
  }

  if (detectedSecrets.length > 0) {
    errorLog('KRİTİK GÜVENLİK İHLALİ: Kasada gizli anahtar/token (secret) tespit edildi! Senkronizasyon iptal edildi.');
    detectedSecrets.forEach(sec => {
      console.error(`  -> [${sec.type}] ${sec.file}:${sec.line} | "${sec.snippet}"`);
    });
    console.error('\nLütfen bu bilgiyi Obsidian kasasından derhal temizleyin veya gizleyin.');
    process.exit(1);
  }

  log('Güvenlik Duvarı: Sıfır sızıntı doğrulandı (Secret Scan PASS).');
}

function syncVault() {
  try {
    if (!fs.existsSync(VAULT_PATH)) {
      throw new Error(`Kasa dizini bulunamadı: ${VAULT_PATH}`);
    }

    log(`Kasa dizini: ${VAULT_PATH}`);

    // 1. Kilit kontrolü
    handleIndexLock();

    // 2. Obsidian durumu
    const isObsidianRunning = checkProcessRunning('Obsidian.exe');
    log(`Obsidian Süreç Durumu: ${isObsidianRunning ? 'AÇIK (obsidian-git eklentisi aktif)' : 'KAPALI (Bağımsız Otomatik Senkronizasyon devreye alınıyor)'}`);

    // 3. Durum kontrolü
    const status = runGit('status --porcelain');
    if (!status) {
      log('Kasada kaydedilmemiş değişiklik yok. Senkronizasyon güncel.');
      return;
    }

    // 4. Secret taraması
    scanForSecrets();

    // 5. Git Add & Commit
    log('Değişiklikler indeksleniyor (git add -A)...');
    runGit('add -A');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const commitMsg = `vault backup (AI auto-sync): ${timestamp}`;
    log(`Yerel commit oluşturuluyor: "${commitMsg}"...`);
    runGit(`commit -m "${commitMsg}"`);

    // 6. Pull --rebase & Push
    log('Uzak depo ile senkronize ediliyor (git pull --rebase origin main)...');
    try {
      runGit('pull --rebase origin main');
    } catch (pullErr) {
      log(`Rebase uyarısı/notu: ${pullErr.message}`);
    }

    log('Uzak depoya gönderiliyor (git push origin main)...');
    const pushOutput = runGit('push origin main');
    log(`Push tamamlandı: ${pushOutput || 'Başarılı'}`);

    log('✅ Obsidian Kasa Senkronizasyonu Eksiksiz Tamamlandı.');
  } catch (err) {
    errorLog(`Senkronizasyon hatası: ${err.message}`);
    process.exit(1);
  }
}

syncVault();
