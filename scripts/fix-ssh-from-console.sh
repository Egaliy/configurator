#!/bin/bash
# Скрипт для запуска В КОНСОЛИ VPS (веб-консоль/VNC в панели управления)
# Скопируйте и выполните на сервере напрямую

echo "=== Запуск SSH демона ==="
systemctl start sshd
systemctl enable sshd
systemctl status sshd --no-pager | head -10

echo ""
echo "=== Запуск nginx ==="
systemctl start nginx
systemctl status nginx --no-pager | head -10

echo ""
echo "=== Проверка pm2 ==="
pm2 list

echo ""
echo "=== Запуск Like That (если нужно) ==="
cd /var/www/like-that 2>/dev/null && pm2 restart like-that 2>/dev/null || pm2 start npm --name like-that -- start 2>/dev/null || echo "Like That не найден в /var/www/like-that"

echo ""
echo "=== Готово. Проверьте SSH: ssh root@130.49.149.162 ==="
