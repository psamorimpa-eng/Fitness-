/**
 * Cria as contas de demonstração no Supabase Auth.
 * Uso: node scripts/criar-usuarios.mjs
 * Requer SUPABASE_SERVICE_ROLE_KEY no ambiente. Nunca rodar no cliente.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

const contas = [
  { email: "admin@fichafitness.app",    nome: "Ricardo Nunes",  papel: "admin" },
  { email: "marina@fichafitness.app",   nome: "Marina Costa",   papel: "personal" },
  { email: "diego@fichafitness.app",    nome: "Diego Ramos",    papel: "personal" },
  { email: "aluno@fichafitness.app",    nome: "Paulo Amorim",   papel: "aluno", altura: 178, peso: 84.2, objetivo: "Hipertrofia" },
  { email: "gabriela@fichafitness.app", nome: "Gabriela Lima",  papel: "aluno", altura: 165, peso: 61.4, objetivo: "Definição muscular" },
  { email: "carlos@fichafitness.app",   nome: "Carlos Menezes", papel: "aluno", altura: 172, peso: 92.8, objetivo: "Emagrecimento" },
  { email: "juliana@fichafitness.app",  nome: "Juliana Prado",  papel: "aluno", altura: 170, peso: 66.0, objetivo: "Ganho de força" },
  { email: "rafael@fichafitness.app",   nome: "Rafael Tavares", papel: "aluno", altura: 181, peso: 78.5, objetivo: "Condicionamento físico" },
];

for (const c of contas) {
  const { error } = await admin.auth.admin.createUser({
    email: c.email,
    password: "123456",
    email_confirm: true,
    user_metadata: c,
  });
  console.log(error ? `falhou ${c.email}: ${error.message}` : `criado ${c.email}`);
}
console.log("\nAgora rode: npx supabase db execute --file supabase/seed.sql");
