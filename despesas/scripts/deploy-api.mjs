// Publica o código e atualiza a MESMA implantação (a URL /exec não muda).
// Uso: npm run despesas:api:deploy -- mensagem da versão
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const id = process.env.DESPESAS_DEPLOYMENT_ID;
if (!id) {
  console.error("DESPESAS_DEPLOYMENT_ID não definido (veja .env.example).");
  process.exit(1);
}

const mensagem = process.argv.slice(2).join(" ") || `deploy ${new Date().toISOString()}`;
const cwd = fileURLToPath(new URL("../apps-script/", import.meta.url));

const claspBin = fileURLToPath(
  new URL("../../node_modules/@google/clasp/build/src/index.js", import.meta.url)
);

// Chama o clasp direto pelo Node (sem shell), para a mensagem não ser quebrada em argumentos.
function clasp(...args) {
  const r = spawnSync(process.execPath, [claspBin, ...args], { cwd, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

clasp("push", "-f");
clasp("redeploy", id, "-d", mensagem);
