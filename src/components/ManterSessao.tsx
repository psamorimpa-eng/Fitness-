"use client";
import { useEffect, useRef } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

export default function ManterSessao() {
  const cliente = useRef<ReturnType<typeof criarClienteNavegador> | null>(null);
  if (!cliente.current) cliente.current = criarClienteNavegador();

  useEffect(() => {
    const supabase = cliente.current!;
    void supabase.auth.getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // createBrowserClient persiste os tokens renovados nos cookies automaticamente.
    });

    const aoFocar = () => void supabase.auth.getSession();
    const aoVisivel = () => {
      if (document.visibilityState === "visible") void supabase.auth.getSession();
    };
    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoVisivel);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoVisivel);
    };
  }, []);

  return null;
}
