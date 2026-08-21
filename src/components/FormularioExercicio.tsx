"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, ImageOff, Save } from "lucide-react";
import { salvarExercicio, type EstadoExercicio } from "@/app/(app)/exercicios/acoes";
import { Rotulo } from "@/components/ui";

type Opcao = { id: number; nome: string };

type DadosExercicio = {
  id?: string | null;
  nome?: string | null;
  categoria_id?: number | null;
  equipamento_id?: number | null;
  nivel?: string | null;
  tipo?: string | null;
  descricao?: string | null;
  instrucoes?: string | null;
  erros_comuns?: string | null;
  imagem_url?: string | null;
  video_url?: string | null;
  observacoes?: string | null;
};

const campo = {
  background: "var(--superficie-2)",
  border: "1px solid var(--linha)",
  color: "var(--texto)",
};

function BotaoSalvar({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white disabled:opacity-50"
      style={{ background: "var(--marca)" }}
    >
      <Save size={17} /> {pending ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar exercício"}
    </button>
  );
}

export default function FormularioExercicio({
  categorias,
  equipamentos,
  dados = {},
  secundariosAtuais = [],
}: {
  categorias: Opcao[];
  equipamentos: Opcao[];
  dados?: DadosExercicio;
  secundariosAtuais?: number[];
}) {
  const [estado, acao] = useFormState(salvarExercicio, null as EstadoExercicio);
  const [categoria, setCategoria] = useState(String(dados.categoria_id ?? ""));
  const [imagem, setImagem] = useState(dados.imagem_url ?? "");
  const [video, setVideo] = useState(dados.video_url ?? "");
  const secundarios = useMemo(
    () => categorias.filter((c) => String(c.id) !== categoria),
    [categorias, categoria]
  );

  return (
    <form action={acao} className="space-y-4">
      {dados.id && <input type="hidden" name="id" value={dados.id} />}

      <label className="block">
        <Rotulo>Nome do exercício *</Rotulo>
        <input
          name="nome"
          required
          minLength={2}
          defaultValue={dados.nome ?? ""}
          placeholder="Ex.: Supino inclinado no Smith"
          className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
          style={campo}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Rotulo>Grupo principal *</Rotulo>
          <select
            name="categoria_id"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
            style={campo}
          >
            <option value="">Selecione</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label className="block">
          <Rotulo>Equipamento *</Rotulo>
          <select
            name="equipamento_id"
            required
            defaultValue={String(dados.equipamento_id ?? "")}
            className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
            style={campo}
          >
            <option value="">Selecione</option>
            {equipamentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Rotulo>Nível</Rotulo>
          <select name="nivel" defaultValue={dados.nivel ?? "Intermediário"} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
            <option>Iniciante</option>
            <option>Intermediário</option>
            <option>Avançado</option>
          </select>
        </label>
        <label className="block">
          <Rotulo>Categoria</Rotulo>
          <select name="tipo" defaultValue={dados.tipo ?? "Musculação"} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
            <option>Musculação</option>
            <option>Peso corporal</option>
            <option>Alongamento</option>
            <option>Mobilidade</option>
            <option>Pliometria</option>
            <option>Cardio</option>
            <option>Powerlifting</option>
            <option>Levantamento olímpico</option>
            <option>Strongman</option>
            <option>Funcional</option>
          </select>
        </label>
      </div>

      <div>
        <Rotulo>Grupos musculares secundários</Rotulo>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl p-3" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
          {secundarios.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="secundarios" value={c.id} defaultChecked={secundariosAtuais.includes(c.id)} />
              <span>{c.nome}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <Rotulo>Descrição</Rotulo>
        <textarea name="descricao" rows={3} defaultValue={dados.descricao ?? ""} placeholder="Para que serve e qual é o foco do exercício." className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
      </label>

      <label className="block">
        <Rotulo>Instruções passo a passo</Rotulo>
        <textarea name="instrucoes" rows={6} defaultValue={dados.instrucoes ?? ""} placeholder={'1. Ajuste a posição...\n2. Execute o movimento...\n3. Retorne de forma controlada...'} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
      </label>

      <label className="block">
        <Rotulo>Erros comuns</Rotulo>
        <textarea name="erros_comuns" rows={3} defaultValue={dados.erros_comuns ?? ""} placeholder="Ex.: perder a postura, usar impulso, reduzir a amplitude..." className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
      </label>

      <label className="block">
        <Rotulo>URL da foto</Rotulo>
        <input
          name="imagem_url"
          type="url"
          value={imagem}
          onChange={(e) => setImagem(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
          style={campo}
        />
      </label>

      <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
        <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "var(--fraco)" }}><ImageOff size={26} />Prévia da imagem</div>
        {imagem && <img src={imagem} alt="Prévia do exercício" className="absolute inset-0 h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
      </div>

      <label className="block">
        <Rotulo>URL do vídeo ou demonstração</Rotulo>
        <input
          name="video_url"
          type="url"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
          placeholder="https://youtube.com/..."
          className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
          style={campo}
        />
      </label>
      {video && (
        <a href={video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--marca)" }}>
          <ExternalLink size={15} /> Abrir demonstração
        </a>
      )}

      <label className="block">
        <Rotulo>Observações</Rotulo>
        <textarea name="observacoes" rows={3} defaultValue={dados.observacoes ?? ""} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
      </label>

      {estado?.erro && (
        <div className="flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
        </div>
      )}

      <BotaoSalvar editando={Boolean(dados.id)} />
      <p className="text-center text-[11px]" style={{ color: "var(--fraco)" }}>
        Exercícios cadastrados aqui ficam visíveis somente na sua conta.
      </p>
    </form>
  );
}
