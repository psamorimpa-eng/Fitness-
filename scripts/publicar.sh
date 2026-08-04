#!/usr/bin/env bash
# Publicação do Minha Ficha Fitness.
# Uso: bash scripts/publicar.sh
# Para na primeira falha, para não publicar build quebrado.
set -euo pipefail

azul() { printf "\n\033[1;34m==> %s\033[0m\n" "$1"; }

azul "1/5 Conferindo variáveis de ambiente"
if [ ! -f .env.local ]; then
  echo "Falta o arquivo .env.local. Copie de .env.example e preencha as chaves do Supabase."
  exit 1
fi
for chave in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  grep -q "^${chave}=." .env.local || { echo "Variável ${chave} vazia em .env.local"; exit 1; }
done

azul "2/5 Instalando dependências"
npm install

azul "3/5 Build de produção"
npm run build

azul "4/5 Aplicando migrations no Supabase"
if command -v supabase >/dev/null 2>&1; then
  supabase db push
else
  echo "CLI do Supabase não encontrada. Rode: npm i -g supabase && supabase login && supabase link"
  exit 1
fi

azul "5/5 Publicando na Vercel"
if command -v vercel >/dev/null 2>&1; then
  vercel --prod
else
  echo "CLI da Vercel não encontrada. Rode: npm i -g vercel && vercel login && vercel link"
  exit 1
fi

azul "Concluído"
echo "Lembre de cadastrar o endereço publicado em Authentication, URL Configuration, no Supabase."
