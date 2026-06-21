const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const BACKUP_DIR = '/root/erp-system/backups';
const MAX_BACKUPS = 30;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `erp-backup-${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;

  const pgDumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl | gzip > "${filepath}"`;

  try {
    await execAsync(pgDumpCmd, {
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      maxBuffer: 10 * 1024 * 1024
    });

    const stats = fs.statSync(filepath);

    await pruneOldBackups();

    return {
      filename,
      filepath,
      size: stats.size,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Backup failed: ${error.message}`);
  }
}

async function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return files;
}

async function restoreBackup(filename) {
  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error('Backup file not found');
  }

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;

  const restoreCmd = `gunzip -c "${filepath}" | psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl`;

  try {
    await execAsync(restoreCmd, {
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      maxBuffer: 10 * 1024 * 1024
    });

    return { success: true, filename };
  } catch (error) {
    throw new Error(`Restore failed: ${error.message}`);
  }
}

async function deleteBackup(filename) {
  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error('Backup file not found');
  }

  fs.unlinkSync(filepath);
  return { success: true, filename };
}

async function pruneOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => a.time - b.time);

  while (files.length > MAX_BACKUPS) {
    const oldest = files.shift();
    fs.unlinkSync(path.join(BACKUP_DIR, oldest.name));
  }
}

module.exports = { createBackup, listBackups, restoreBackup, deleteBackup };
