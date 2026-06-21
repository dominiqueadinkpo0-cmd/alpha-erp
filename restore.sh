#!/bin/bash

# ERP System - Restore Script
# Usage: bash restore.sh backups/erp_backup_YYYYMMDD_HHMMSS.sql.gz

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Sauvegardes disponibles:"
    ls -la backups/*.sql.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

source backend/.env

echo "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!"
read -p "Continuer? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "Opération annulée."
    exit 0
fi

echo "Restauration de la base de données..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -U $DB_USER -h $DB_HOST -d $DB_NAME
else
    psql -U $DB_USER -h $DB_HOST -d $DB_NAME < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "Restauration terminée avec succès!"
else
    echo "Erreur lors de la restauration"
    exit 1
fi
