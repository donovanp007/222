#!/bin/bash
# AI Medical Scribe - Automated Backup Script
# Runs every 6 hours to backup database and critical data

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_NAME="mediscribe_prod"
DB_USER="mediscribe"
RETENTION_DAYS=30

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/mediscribe_backup_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Create database backup
echo "Starting database backup at $(date)"
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}")
    echo "Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"
else
    echo "ERROR: Backup file was not created!"
    exit 1
fi

# Create backup manifest
MANIFEST_FILE="${BACKUP_DIR}/backup_manifest.txt"
echo "${TIMESTAMP},${BACKUP_FILE},${BACKUP_SIZE}" >> "${MANIFEST_FILE}"

# Cleanup old backups (keep last 30 days)
echo "Cleaning up old backups..."
find "${BACKUP_DIR}" -name "mediscribe_backup_*.sql" -type f -mtime +${RETENTION_DAYS} -delete

# Optional: Upload to cloud storage (uncomment if using S3/DigitalOcean Spaces)
# if [ ! -z "${AWS_ACCESS_KEY_ID}" ]; then
#     echo "Uploading backup to cloud storage..."
#     aws s3 cp "${BACKUP_FILE}" "s3://${BACKUP_BUCKET}/database-backups/" --storage-class STANDARD_IA
# fi

# Health check - ensure we have at least one recent backup
RECENT_BACKUPS=$(find "${BACKUP_DIR}" -name "mediscribe_backup_*.sql" -type f -mtime -1 | wc -l)
if [ "${RECENT_BACKUPS}" -eq 0 ]; then
    echo "WARNING: No recent backups found!"
    exit 1
fi

echo "Backup process completed successfully at $(date)"

# Optional: Test backup integrity
# echo "Testing backup integrity..."
# pg_restore --list "${BACKUP_FILE}" > /dev/null
# echo "Backup integrity check passed"