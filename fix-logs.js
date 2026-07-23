const fs = require("fs");

const files = [
  "lib/api-client/profile.ts",
  "lib/api-client/workspaces.ts",
  "lib/api-client/members.ts",
  "lib/api-client/subscriptions.ts",
  "lib/api-client/admin.ts",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes('console.error("[AuditLog]')) {
    content = content.replace(
      /console\.error\("\[AuditLog\]/g,
      'log.error("[AuditLog]',
    );
    if (!content.includes("import { log }")) {
      content = 'import { log } from "@/lib/logger";\n' + content;
    }
    fs.writeFileSync(file, content);
  }
}
