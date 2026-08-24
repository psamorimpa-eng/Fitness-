"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ImageOff, Play, Video, X } from "lucide-react";
import { Titulo } from "@/components/ui";

export type ExercicioDemonstracao = {
  nome: string;
  imagem_url?: string | null;
  video_url?: string | null;
  video_embutido_url?: string | null;
  video_embutido_licenca?: string | null;
  video_embutido_autor?: string | null;
};

function youtubeEmbed(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) id = u.pathname.split("/").filter(Boolean)[0] ?? null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? null;
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  } catch {
    return null;
  }
}

function videoDireto(url?: string | null) {
  if (!url) return false;
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

function segundaImagem(url?: string | null) {
  if (!url) return null;
  if (/\/0\.jpg(\?|$)/i.test(url)) return url.replace(/\/0\.jpg(\?|$)/i, "/1.jpg$1");
  return null;
}

function AnimacaoFotos({ exercicio }: { exercicio: ExercicioDemonstracao }) {
  const segunda = useMemo(() => segundaImagem(exercicio.imagem_url), [exercicio.imagem_url]);
  const [alternar, setAlternar] = useState(false);
  const [segundaFalhou, setSegundaFalhou] = useState(false);

  useEffect(() => {
    if (!segunda || segundaFalhou) return;
    const t = window.setInterval(() => setAlternar((v) => !v), 850);
    return () => window.clearInterval(t);
  }, [segunda, segundaFalhou]);

  const atual = alternar && segunda && !segundaFalhou ? segunda : exercicio.imagem_url;
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
      {!atual && <div className="flex flex-col items-center gap-2" style={{ color: "var(--fraco)" }}><ImageOff size={30} /><span className="text-xs">Demonstração visual não disponível</span></div>}
      {atual && <img src={atual} alt={`Demonstração de ${exercicio.nome}`} className="h-full w-full object-contain" onError={() => { if (alternar) setSegundaFalhou(true); }} />}
      {segunda && !segundaFalhou && <div className="absolute bottom-2 right-2 rounded-full px-2 py-1 text-[10px]" style={{ background: "rgba(0,0,0,.65)", color: "#fff" }}>Demonstração animada</div>}
    </div>
  );
}

export default function DemonstracaoExercicio({ exercicio, rotulo = "Ver demonstração", pequeno = false }: { exercicio: ExercicioDemonstracao; rotulo?: string; pequeno?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [videoFalhou, setVideoFalhou] = useState(false);
  const incorporado = exercicio.video_embutido_url;
  const youtube = youtubeEmbed(exercicio.video_url);
  const diretoCustom = !incorporado && videoDireto(exercicio.video_url) ? exercicio.video_url : null;
  const fonteVideo = incorporado ?? diretoCustom;
  const temPlayer = !videoFalhou && Boolean(fonteVideo || youtube);

  return (
    <>
      <button type="button" onClick={() => { setVideoFalhou(false); setAberto(true); }} className={`inline-flex items-center gap-1 rounded-xl font-semibold ${pequeno ? "px-2 py-1 text-xs" : "px-3 py-2 text-xs"}`} style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
        <Play size={pequeno ? 12 : 14} /> {rotulo}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,.72)" }} onClick={() => setAberto(false)}>
          <div className="w-full max-w-md overflow-y-auto rounded-t-3xl p-4" style={{ background: "var(--superficie)", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="text-xs" style={{ color: "var(--dim)" }}>Demonstração</div><Titulo tamanho={18}>{exercicio.nome}</Titulo></div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar demonstração"><X size={20} /></button>
            </div>

            {temPlayer && fonteVideo && (
              <video controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl object-contain" style={{ background: "#000" }} onError={() => setVideoFalhou(true)}>
                <source src={fonteVideo} />
                Seu navegador não conseguiu reproduzir este vídeo.
              </video>
            )}
            {temPlayer && !fonteVideo && youtube && (
              <iframe src={youtube} title={`Vídeo de ${exercicio.nome}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-2xl" style={{ border: 0, background: "#000" }} />
            )}
            {!temPlayer && <AnimacaoFotos exercicio={exercicio} />}

            {incorporado && (exercicio.video_embutido_licenca || exercicio.video_embutido_autor) && (
              <p className="mt-2 text-[10px]" style={{ color: "var(--fraco)" }}>
                Vídeo: wger · {exercicio.video_embutido_licenca ?? "licença aberta"}{exercicio.video_embutido_autor ? ` · ${exercicio.video_embutido_autor}` : ""}
              </p>
            )}

            {exercicio.video_url && !youtube && !videoDireto(exercicio.video_url) && (
              <a href={exercicio.video_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs" style={{ border: "1px solid var(--linha)", color: "var(--dim)" }}>
                <Video size={13} /> Abrir vídeo externo <ExternalLink size={11} />
              </a>
            )}
            {videoFalhou && (
              <div className="mt-3">
                <p className="mb-2 text-xs" style={{ color: "var(--dim)" }}>O formato do vídeo não foi suportado neste aparelho. A demonstração visual continua disponível.</p>
                <AnimacaoFotos exercicio={exercicio} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
