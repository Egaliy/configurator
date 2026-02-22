import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

// ВРЕМЕННЫЙ endpoint для исправления SSH после перезагрузки
// УДАЛИТЬ после использования!
export async function POST(request: Request) {
  try {
    const { command, secret } = await request.json();
    
    // Простая защита - секретный ключ
    if (secret !== "FIX_SSH_2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command required" }, { status: 400 });
    }
    
    // Разрешённые команды только для исправления SSH
    const allowedCommands = [
      "systemctl start sshd",
      "systemctl enable sshd",
      "systemctl start nginx",
      "pm2 restart like-that",
      "pm2 start npm --name like-that -- start",
      "pm2 save",
      "systemctl status sshd",
      "systemctl status nginx",
      "pm2 list"
    ];
    
    const isAllowed = allowedCommands.some(cmd => command.includes(cmd));
    if (!isAllowed) {
      return NextResponse.json({ error: "Command not allowed" }, { status: 403 });
    }
    
    const output = execSync(command, { 
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 1024 * 1024 
    });
    
    return NextResponse.json({ 
      success: true,
      output: output.toString(),
      command 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      output: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || ""
    }, { status: 500 });
  }
}
