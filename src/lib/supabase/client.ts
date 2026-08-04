"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos";

export const criarClienteNavegador = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
