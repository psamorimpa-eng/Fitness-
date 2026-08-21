"use client";

import { useEffect, useRef } from "react";

type SentinelaWakeLock = {
  released?: boolean;
  release: () => Promise<void>;
  addEventListener?: (tipo: "release", listener: () => void) => void;
};

type NavegadorComWakeLock = Navigator & {
  wakeLock?: {
    request: (tipo: "screen") => Promise<SentinelaWakeLock>;
  };
};

/**
 * Mantém a tela acordada enquanto a página de execução do treino está aberta.
 * Navegadores sem suporte continuam funcionando normalmente.
 */
export default function ManterTelaAcordada() {
  const sentinela = useRef<SentinelaWakeLock | null>(null);

  useEffect(() => {
    let montado = true;
    const navegador = navigator as NavegadorComWakeLock;

    async function adquirir() {
      if (!montado || !navegador.wakeLock || document.visibilityState !== "visible") return;
      if (sentinela.current && !sentinela.current.released) return;

      try {
        const nova = await navegador.wakeLock.request("screen");
        if (!montado) {
          await nova.release();
          return;
        }
        sentinela.current = nova;
        nova.addEventListener?.("release", () => {
          if (sentinela.current === nova) sentinela.current = null;
        });
      } catch {
        // Sem permissão/suporte: o treino continua funcionando sem Wake Lock.
      }
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === "visible") void adquirir();
    }

    void adquirir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      montado = false;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      const atual = sentinela.current;
      sentinela.current = null;
      if (atual && !atual.released) void atual.release();
    };
  }, []);

  return null;
}
