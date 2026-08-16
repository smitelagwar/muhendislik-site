import fs from "fs";
import readline from "readline";
import path from "path";

const conversationId = "9071fa34-8368-4cee-b0b2-a0ea2e126fa1";
const transcriptPath = `C:/Users/hsyn/.gemini/antigravity-ide/brain/${conversationId}/.system_generated/logs/transcript_full.jsonl`;
const outputPath = "C:/Users/hsyn/Desktop/sohbet_gecmisi.md";

if (!fs.existsSync(transcriptPath)) {
  console.error("Transcript dosyası bulunamadı:", transcriptPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let markdown = `# Antigravity Sohbet Geçmişi (${new Date().toLocaleDateString("tr-TR")})\n\n`;
markdown += `> **Konuşma ID:** \`${conversationId}\`  \n`;
markdown += `> **Oluşturulma Tarihi:** ${new Date().toLocaleString("tr-TR")}\n\n---\n\n`;

let messageIndex = 1;

for await (const line of rl) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    const type = data.type;
    const source = data.source;
    const content = data.content || "";
    const createdAt = data.created_at ? new Date(data.created_at).toLocaleString("tr-TR") : "";

    if (type === "USER_INPUT" && source === "USER_EXPLICIT") {
      // Clean user request
      let userText = content;
      const userReqMatch = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      if (userReqMatch) {
        userText = userReqMatch[1].trim();
      }

      if (!userText.trim()) {
        userText = "*(Boş veya görsel/sesli girdi)*";
      }

      markdown += `### 👤 Kullanıcı (#${messageIndex})  \n`;
      if (createdAt) markdown += `<small>🕒 ${createdAt}</small>\n\n`;
      markdown += `${userText}\n\n`;
      markdown += `---\n\n`;
      messageIndex++;
    } else if (type === "PLANNER_RESPONSE" && source === "MODEL") {
      let modelText = content.trim();
      
      // If there are tool calls or content
      if (modelText) {
        markdown += `### 🤖 Asistan (Antigravity)  \n`;
        if (createdAt) markdown += `<small>🕒 ${createdAt}</small>\n\n`;
        markdown += `${modelText}\n\n`;
        markdown += `---\n\n`;
      }
    }
  } catch (err) {
    // skip malformed line
  }
}

fs.writeFileSync(outputPath, markdown, "utf-8");
console.log(`✅ Başarıyla dönüştürüldü ve Masaüstüne kaydedildi:`);
console.log(outputPath);
