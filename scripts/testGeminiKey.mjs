import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_KEY ?? process.env.VITE_GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY_BACKUP;

if (!apiKey) {
  console.error("No Gemini API key provided. Set GEMINI_KEY or VITE_GEMINI_API_KEY in the environment.");
  process.exit(1);
}

const MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  "gemini-pro"
];

const API_VERSIONS = ["v1beta", "v1"];

async function tryModel(client, model) {
  for (const version of API_VERSIONS) {
    try {
      const requestOptions = version === "v1beta" ? undefined : { apiVersion: version };
      const modelClient = client.getGenerativeModel({ model }, requestOptions);
      const result = await modelClient.generateContent("Responda com a palavra OK se você estiver funcionando.");
      const text = result.response.text();
      console.log(`✅ Modelo ${model} respondeu usando ${version}:`, text.trim());
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Falha no modelo ${model} (${version}): ${message}`);
      if (error instanceof Error && error.stack) {
        const statusMatch = error.stack.match(/\b[45]\d{2}\b/);
        if (statusMatch) {
          console.error(`   ↳ Código HTTP detectado: ${statusMatch[0]}`);
        }
      }
    }
  }
  return false;
}

async function main() {
  console.log("Testando chave do Gemini...");
  const client = new GoogleGenerativeAI(apiKey);
  for (const model of MODELS) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await tryModel(client, model);
    if (ok) {
      console.log("✅ Pelo menos um modelo respondeu com sucesso.");
      return;
    }
  }
  console.error("❌ Nenhum modelo respondeu com sucesso usando a chave informada.");
  process.exitCode = 2;
}

main().catch(error => {
  console.error("❌ Erro inesperado ao testar chave do Gemini:", error);
  process.exit(1);
});
