#!/bin/bash

# ERP System - Backup Script
# Usage: bash backup.sh

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/erp_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

source backend/.env

echo "Sauvegarde de la base de données..."
pg_dump -U $DB_USER -h $DB_HOST -d $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Sauvegarde créée: $BACKUP_FILE"
    gzip "$BACKUP_FILE"
    echo "Compression terminée: ${BACKUP_FILE}.gz"
else
    echo "Erreur lors de la sauvegarde"
    exit 1
fi

# Garder seulement les 30 dernières sauvegardes
cd "$BACKUP_DIR"
ls -t erp_backup_*.sql.gz | tail -n +31 | xargs -r rm

echo "Sauvegarde terminée avec succès!"
