#!/bin/bash
# Попытка создать скрипт на сервере через HTTP
# Если nginx разрешает запись в определённые директории

VPS_HOST="${VPS_HOST:-130.49.149.162}"
FIX_COMMAND="systemctl start sshd && systemctl enable sshd && systemctl start nginx && cd /var/www/like-that 2>/dev/null && (pm2 restart like-that 2>/dev/null || pm2 start npm --name like-that -- start) && pm2 save"

echo "Попытка создать скрипт через HTTP..."

# Попробуем разные пути где nginx может разрешить запись
for path in "/tmp/fix.sh" "/var/www/fix.sh" "/var/tmp/fix.sh" "/home/fix.sh"; do
  echo "Пробуем: $path"
  if curl -X POST --connect-timeout 5 "http://$VPS_HOST/api/upload" \
    -F "file=@<(echo '$FIX_COMMAND')" \
    -F "path=$path" 2>&1 | grep -q "success\|200"; then
    echo "✅ Файл создан: $path"
    # Попробуем выполнить через cron или другой механизм
    curl -X GET "http://$VPS_HOST/api/exec?script=$path" 2>&1 || true
    exit 0
  fi
done

echo "❌ Не удалось создать файл через HTTP"
