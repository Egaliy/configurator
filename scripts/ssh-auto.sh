#!/usr/bin/expect -f
# Автоматический SSH с паролем через expect
# Использование: ./scripts/ssh-auto.sh "команда"

set timeout 60
set host "130.49.149.162"
set user "root"
set password "PjuRKDx6pe3CCNPb"
set command [lindex $argv 0]

spawn ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 $user@$host $command

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    timeout {
        puts "Connection timeout"
        exit 1
    }
    eof
}

wait
