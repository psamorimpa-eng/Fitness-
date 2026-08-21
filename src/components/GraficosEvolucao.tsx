"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Cartao, Rotulo } from "@/components/ui";
import { fmtData } from "@/lib/formato";

type Serie = { data: string; carga: number }[];

const eixo = { fill: "#9AA3B2", fontSize: 10 };
const dica = { background: "#181B22", border: "1px solid #2C313C", borderRadius: 12, color: "#F2F4F8", fontSize: 12 };

export default function GraficosEvolucao({
  volume, frequencia, medidas, progressao,
}: {
  volume: { semana: string; volume: number }[];
  frequencia: { semana: string; treinos: number }[];
  medidas: { data: string; peso: number | null; gordura: number | null }[];
  progressao: Record<string, Serie>;
}) {
  const exercicios = Object.keys(progressao).sort();
  const [exercicio, setExercicio] = useState(exercicios[0] ?? "");

  const dadosCarga = (progressao[exercicio] ?? []).map((p) => ({ dia: fmtData(p.data).slice(0, 5), carga: p.carga }));
  const dadosVolume = volume.slice(-8).map((v) => ({ dia: fmtData(v.semana).slice(0, 5), volume: Math.round(v.volume / 1000) }));
  const dadosFreq = frequencia.slice(-8).map((f) => ({ dia: fmtData(f.semana).slice(0, 5), treinos: f.treinos }));
  const dadosMedidas = medidas.map((m) => ({ dia: fmtData(m.data).slice(0, 5), peso: m.peso, gordura: m.gordura }));

  return (
    <div className="space-y-4 px-4 pt-4">
      {!!exercicios.length && (
        <Cartao>
          <div className="flex items-center justify-between gap-2">
            <Rotulo>Carga por exercício</Rotulo>
            <select value={exercicio} onChange={(e) => setExercicio(e.target.value)}
              className="max-w-[170px] rounded-lg px-2 py-1 text-xs outline-none"
              style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }}>
              {exercicios.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="mt-3" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosCarga}>
                <CartesianGrid stroke="var(--linha)" vertical={false} />
                <XAxis dataKey="dia" tick={eixo} axisLine={false} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={dica} />
                <Line type="monotone" dataKey="carga" name="Carga (kg)" stroke="#E23A2E" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}

      {!!dadosVolume.length && (
        <Cartao>
          <Rotulo>Volume semanal (toneladas)</Rotulo>
          <div className="mt-3" style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosVolume}>
                <CartesianGrid stroke="var(--linha)" vertical={false} />
                <XAxis dataKey="dia" tick={eixo} axisLine={false} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={dica} cursor={{ fill: "var(--superficie-2)" }} />
                <Bar dataKey="volume" name="Volume (t)" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}

      {!!dadosMedidas.length && (
        <Cartao>
          <Rotulo>Peso corporal e gordura</Rotulo>
          <div className="mt-3" style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosMedidas}>
                <CartesianGrid stroke="var(--linha)" vertical={false} />
                <XAxis dataKey="dia" tick={eixo} axisLine={false} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={dica} />
                <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#F2F4F8" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="gordura" name="Gordura (%)" stroke="#F4C20D" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}

      {!!dadosFreq.length && (
        <Cartao>
          <Rotulo>Frequência semanal</Rotulo>
          <div className="mt-3" style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFreq}>
                <CartesianGrid stroke="var(--linha)" vertical={false} />
                <XAxis dataKey="dia" tick={eixo} axisLine={false} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} width={22} />
                <Tooltip contentStyle={dica} cursor={{ fill: "var(--superficie-2)" }} />
                <Bar dataKey="treinos" name="Treinos" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}
    </div>
  );
}
