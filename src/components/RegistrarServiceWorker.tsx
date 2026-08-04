"use client";
import { useEffect } from "react";
import { ligarSincronizacaoAutomatica } from "@/lib/offline";

/** Instala o Service Worker e liga a fila de sincronização do treino. */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return ligarSincronizacaoAutomatica();
  }, []);
  return null;
}
