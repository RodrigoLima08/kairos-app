"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Pedido {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto: string;
  quantidade: number;
  valor: number;
  status: string;
  observacao: string;
  created_at: string;
}

interface Estoque {
  id: string;
  produto: string;
  quantidade: number;
  preco_custo: number;
  preco_venda: number;
}

const STATUS_CORES: { [key: string]: string } = {
  aguardando: "#c8a96e",
  producao: "#5b8a6b",
  pronto: "#7ab648",
  entregue: "#888",
  cancelado: "#c0392b",
};

const STATUS_LISTA = ["aguardando", "producao", "pronto", "entregue", "cancelado"];
const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const SENHA = "kairos123";
const VERDE = "#5b8a6b";
const VERDE_CLARO = "#7aaa8a";
const FUNDO = "#0d1a13";
const CARD = "#132018";
const BORDA = "#1e3028";

export default function KairosApp() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [aba, setAba] = useState<"pedidos" | "estoque" | "financeiro">("pedidos");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroPedido, setFiltroPedido] = useState<string>("todos");
  const [novoPedido, setNovoPedido] = useState({ cliente_nome: "", cliente_telefone: "", produto: "", quantidade: "1", valor: "", observacao: "" });
  const [showFormPedido, setShowFormPedido] = useState(false);
  const [savingPedido, setSavingPedido] = useState(false);
  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);
  const [novoEstoque, setNovoEstoque] = useState({ produto: "", quantidade: "", preco_custo: "", preco_venda: "" });
  const [showFormEstoque, setShowFormEstoque] = useState(false);
  const [savingEstoque, setSavingEstoque] = useState(false);

  const login = () => {
    if (senha === SENHA) { setAutenticado(true); setErroSenha(""); }
    else setErroSenha("Senha incorreta.");
  };

  useEffect(() => {
    if (autenticado) { carregarPedidos(); carregarEstoque(); }
  }, [autenticado]);

  const carregarPedidos = async () => {
    setLoadingPedidos(true);
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    setPedidos(data || []);
    setLoadingPedidos(false);
  };

  const carregarEstoque = async () => {
    setLoadingEstoque(true);
    const { data } = await supabase.from("estoque").select("*").order("produto");
    setEstoque(data || []);
    setLoadingEstoque(false);
  };

  const adicionarPedido = async () => {
    if (!novoPedido.cliente_nome || !novoPedido.produto || !novoPedido.valor) return;
    setSavingPedido(true);
    await supabase.from("pedidos").insert({ ...novoPedido, quantidade: parseInt(novoPedido.quantidade), valor: parseFloat(novoPedido.valor) });
    setNovoPedido({ cliente_nome: "", cliente_telefone: "", produto: "", quantidade: "1", valor: "", observacao: "" });
    setShowFormPedido(false);
    setSavingPedido(false);
    carregarPedidos();
  };

  const atualizarStatusPedido = async (id: string, status: string) => {
    await supabase.from("pedidos").update({ status }).eq("id", id);
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const excluirPedido = async (id: string) => {
    await supabase.from("pedidos").delete().eq("id", id);
    setPedidos(prev => prev.filter(p => p.id !== id));
  };

  const adicionarEstoque = async () => {
    if (!novoEstoque.produto || !novoEstoque.quantidade) return;
    setSavingEstoque(true);
    await supabase.from("estoque").insert({ produto: novoEstoque.produto, quantidade: parseInt(novoEstoque.quantidade), preco_custo: parseFloat(novoEstoque.preco_custo) || 0, preco_venda: parseFloat(novoEstoque.preco_venda) || 0 });
    setNovoEstoque({ produto: "", quantidade: "", preco_custo: "", preco_venda: "" });
    setShowFormEstoque(false);
    setSavingEstoque(false);
    carregarEstoque();
  };

  const excluirEstoque = async (id: string) => {
    await supabase.from("estoque").delete().eq("id", id);
    setEstoque(prev => prev.filter(e => e.id !== id));
  };

  const pedidosFiltrados = filtroPedido === "todos" ? pedidos : pedidos.filter(p => p.status === filtroPedido);
  const receitaTotal = pedidos.filter(p => p.status !== "cancelado").reduce((acc, p) => acc + p.valor, 0);
  const receitaMes = pedidos.filter(p => { const d = new Date(p.created_at); const h = new Date(); return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear() && p.status !== "cancelado"; }).reduce((acc, p) => acc + p.valor, 0);
  const pedidosPendentes = pedidos.filter(p => p.status === "aguardando" || p.status === "producao").length;

  const s: { [key: string]: React.CSSProperties } = {
    root: { minHeight: "100vh", background: FUNDO, fontFamily: "'Georgia', serif", color: "#fff", padding: "24px 16px 48px" },
    container: { maxWidth: "520px", margin: "0 auto" },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    tag: { fontSize: "11px", letterSpacing: "3px", color: VERDE_CLARO, textTransform: "uppercase", marginBottom: "4px", fontFamily: "sans-serif" },
    title: { fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 },
    subtitle: { fontSize: "12px", color: VERDE_CLARO, margin: "2px 0 0", fontFamily: "sans-serif", fontStyle: "italic" },
    logoutBtn: { background: "transparent", border: `1px solid ${BORDA}`, color: "#888", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontFamily: "sans-serif" },
    tabs: { display: "flex", gap: "8px", marginBottom: "24px" },
    tab: { flex: 1, padding: "10px 8px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "600" },
    statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" },
    statCard: { background: CARD, border: `2px solid ${BORDA}`, borderRadius: "12px", padding: "14px 12px", textAlign: "center" },
    statLabel: { fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontFamily: "sans-serif" },
    statValue: { fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 },
    card: { background: CARD, border: `2px solid ${BORDA}`, borderRadius: "14px", padding: "20px", marginBottom: "16px" },
    label: { display: "block", fontSize: "11px", letterSpacing: "2px", color: VERDE_CLARO, textTransform: "uppercase", marginBottom: "6px", fontFamily: "sans-serif" },
    input: { width: "100%", background: FUNDO, border: `2px solid ${BORDA}`, borderRadius: "8px", padding: "12px 14px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "sans-serif", marginBottom: "16px" },
    btnPrimary: { width: "100%", background: VERDE, color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "sans-serif" },
    filtros: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" as const },
    filtroBtn: { padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "600" },
    itemCard: { background: CARD, border: `2px solid ${BORDA}`, borderRadius: "14px", padding: "16px", marginBottom: "12px" },
    itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
    itemTitle: { fontSize: "15px", fontWeight: "700", color: "#fff", margin: "0 0 4px" },
    itemSub: { fontSize: "12px", color: "#888", margin: 0, fontFamily: "sans-serif" },
    itemInfo: { fontSize: "13px", color: "#ccc", margin: "0 0 6px", fontFamily: "sans-serif" },
    badge: { fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", fontFamily: "sans-serif", textTransform: "uppercase" as const, letterSpacing: "1px", whiteSpace: "nowrap" as const },
    acoes: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" as const },
    acaoBtn: { padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontFamily: "sans-serif", fontWeight: "600" },
    gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  };

  if (!autenticado) {
    return (
      <div style={s.root}>
        <div style={{ ...s.container, maxWidth: "360px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🕐</div>
            <h1 style={{ ...s.title, fontSize: "28px", letterSpacing: "4px" }}>KAIROS</h1>
            <p style={{ color: VERDE_CLARO, fontSize: "13px", fontFamily: "sans-serif", fontStyle: "italic", marginTop: "8px" }}>
              O tempo certo de presentear com amor
            </p>
          </div>
          <div style={s.card}>
            <label style={s.label}>Senha de acesso</label>
            <input style={s.input} type="password" placeholder="........" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
            {erroSenha && <p style={{ color: "#c0392b", fontSize: "12px", fontFamily: "sans-serif", marginBottom: "12px" }}>{erroSenha}</p>}
            <button style={s.btnPrimary} onClick={login}>Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.container}>
        <div style={s.topBar}>
          <div>
            <p style={s.tag}>Gestao</p>
            <h1 style={s.title}>KAIROS</h1>
            <p style={s.subtitle}>O tempo certo de presentear com amor</p>
          </div>
          <button style={s.logoutBtn} onClick={() => setAutenticado(false)}>Sair</button>
        </div>

        <div style={s.tabs}>
          {(["pedidos", "estoque", "financeiro"] as const).map(t => (
            <button key={t} style={{ ...s.tab, background: aba === t ? VERDE : CARD, color: aba === t ? "#fff" : "#888", border: aba === t ? `2px solid ${VERDE}` : `2px solid ${BORDA}` }} onClick={() => setAba(t)}>
              {t === "pedidos" ? "📦 Pedidos" : t === "estoque" ? "🗃️ Estoque" : "💰 Financeiro"}
            </button>
          ))}
        </div>

        {aba === "pedidos" && (
          <div>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <p style={s.statLabel}>Pendentes</p>
                <p style={{ ...s.statValue, color: "#c8a96e" }}>{pedidosPendentes}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>Total pedidos</p>
                <p style={s.statValue}>{pedidos.length}</p>
              </div>
            </div>
            <button style={{ ...s.btnPrimary, marginBottom: "16px" }} onClick={() => setShowFormPedido(!showFormPedido)}>
              {showFormPedido ? "Cancelar" : "+ Novo Pedido"}
            </button>
            {showFormPedido && (
              <div style={s.card}>
                <p style={{ ...s.tag, marginBottom: "16px" }}>Novo Pedido</p>
                <label style={s.label}>Nome do cliente</label>
                <input style={s.input} type="text" placeholder="Ex: Maria Silva" value={novoPedido.cliente_nome} onChange={e => setNovoPedido({ ...novoPedido, cliente_nome: e.target.value })} />
                <label style={s.label}>WhatsApp</label>
                <input style={s.input} type="tel" placeholder="(51) 99999-9999" value={novoPedido.cliente_telefone} onChange={e => setNovoPedido({ ...novoPedido, cliente_telefone: e.target.value })} />
                <label style={s.label}>Produto</label>
                <input style={s.input} type="text" placeholder="Ex: Caneca sublimada" value={novoPedido.produto} onChange={e => setNovoPedido({ ...novoPedido, produto: e.target.value })} />
                <div style={s.gridTwo}>
                  <div>
                    <label style={s.label}>Quantidade</label>
                    <input style={s.input} type="number" placeholder="1" value={novoPedido.quantidade} onChange={e => setNovoPedido({ ...novoPedido, quantidade: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Valor (R$)</label>
                    <input style={s.input} type="number" placeholder="35.00" value={novoPedido.valor} onChange={e => setNovoPedido({ ...novoPedido, valor: e.target.value })} />
                  </div>
                </div>
                <label style={s.label}>Observacao</label>
                <input style={s.input} type="text" placeholder="Ex: Foto do cliente, cor preferida..." value={novoPedido.observacao} onChange={e => setNovoPedido({ ...novoPedido, observacao: e.target.value })} />
                <button style={s.btnPrimary} onClick={adicionarPedido} disabled={savingPedido}>
                  {savingPedido ? "Salvando..." : "Salvar pedido"}
                </button>
              </div>
            )}
            <div style={s.filtros}>
              {["todos", ...STATUS_LISTA].map(f => (
                <button key={f} style={{ ...s.filtroBtn, background: filtroPedido === f ? VERDE : CARD, color: filtroPedido === f ? "#fff" : "#888", border: filtroPedido === f ? `2px solid ${VERDE}` : `2px solid ${BORDA}` }} onClick={() => setFiltroPedido(f)}>
                  {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {loadingPedidos ? (
              <p style={{ color: "#888", fontFamily: "sans-serif", textAlign: "center", padding: "32px" }}>Carregando...</p>
            ) : pedidosFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "40px" }}>📦</p>
                <p style={{ color: "#888", fontFamily: "sans-serif" }}>Nenhum pedido encontrado.</p>
              </div>
            ) : pedidosFiltrados.map(p => (
              <div key={p.id} style={s.itemCard}>
                <div style={s.itemHeader}>
                  <div>
                    <p style={s.itemTitle}>{p.cliente_nome}</p>
                    {p.cliente_telefone && <p style={s.itemSub}>📱 {p.cliente_telefone}</p>}
                  </div>
                  <span style={{ ...s.badge, background: `${STATUS_CORES[p.status]}20`, color: STATUS_CORES[p.status], border: `1px solid ${STATUS_CORES[p.status]}` }}>
                    {p.status}
                  </span>
                </div>
                <p style={s.itemInfo}>📦 {p.produto} · x{p.quantidade}</p>
                <p style={s.itemInfo}>💰 {formatBRL(p.valor)}</p>
                {p.observacao && <p style={s.itemInfo}>📝 {p.observacao}</p>}
                <p style={s.itemInfo}>🕐 {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                <div style={s.acoes}>
                  {STATUS_LISTA.filter(st => st !== p.status && st !== "cancelado").map(st => (
                    <button key={st} style={{ ...s.acaoBtn, background: `${STATUS_CORES[st]}15`, color: STATUS_CORES[st], border: `1px solid ${STATUS_CORES[st]}` }} onClick={() => atualizarStatusPedido(p.id, st)}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                  <button style={{ ...s.acaoBtn, background: "rgba(192,57,43,0.1)", color: "#c0392b", border: "1px solid #c0392b" }} onClick={() => excluirPedido(p.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "estoque" && (
          <div>
            <button style={{ ...s.btnPrimary, marginBottom: "16px" }} onClick={() => setShowFormEstoque(!showFormEstoque)}>
              {showFormEstoque ? "Cancelar" : "+ Adicionar Produto"}
            </button>
            {showFormEstoque && (
              <div style={s.card}>
                <p style={{ ...s.tag, marginBottom: "16px" }}>Novo Produto</p>
                <label style={s.label}>Produto</label>
                <input style={s.input} type="text" placeholder="Ex: Caneca branca 325ml" value={novoEstoque.produto} onChange={e => setNovoEstoque({ ...novoEstoque, produto: e.target.value })} />
                <label style={s.label}>Quantidade</label>
                <input style={s.input} type="number" placeholder="0" value={novoEstoque.quantidade} onChange={e => setNovoEstoque({ ...novoEstoque, quantidade: e.target.value })} />
                <div style={s.gridTwo}>
                  <div>
                    <label style={s.label}>Preco custo</label>
                    <input style={s.input} type="number" placeholder="0.00" value={novoEstoque.preco_custo} onChange={e => setNovoEstoque({ ...novoEstoque, preco_custo: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Preco venda</label>
                    <input style={s.input} type="number" placeholder="0.00" value={novoEstoque.preco_venda} onChange={e => setNovoEstoque({ ...novoEstoque, preco_venda: e.target.value })} />
                  </div>
                </div>
                <button style={s.btnPrimary} onClick={adicionarEstoque} disabled={savingEstoque}>
                  {savingEstoque ? "Salvando..." : "Salvar produto"}
                </button>
              </div>
            )}
            {loadingEstoque ? (
              <p style={{ color: "#888", fontFamily: "sans-serif", textAlign: "center", padding: "32px" }}>Carregando...</p>
            ) : estoque.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "40px" }}>🗃️</p>
                <p style={{ color: "#888", fontFamily: "sans-serif" }}>Nenhum produto cadastrado.</p>
              </div>
            ) : estoque.map(e => (
              <div key={e.id} style={s.itemCard}>
                <div style={s.itemHeader}>
                  <p style={s.itemTitle}>{e.produto}</p>
                  <span style={{ ...s.badge, background: e.quantidade <= 5 ? "rgba(192,57,43,0.1)" : `${VERDE}20`, color: e.quantidade <= 5 ? "#c0392b" : VERDE_CLARO, border: `1px solid ${e.quantidade <= 5 ? "#c0392b" : VERDE}` }}>
                    {e.quantidade} un.
                  </span>
                </div>
                <p style={s.itemInfo}>💲 Custo: {formatBRL(e.preco_custo)} · Venda: {formatBRL(e.preco_venda)}</p>
                {e.preco_venda > 0 && e.preco_custo > 0 && (
                  <p style={{ ...s.itemInfo, color: VERDE_CLARO }}>📈 Margem: {formatBRL(e.preco_venda - e.preco_custo)} ({(((e.preco_venda - e.preco_custo) / e.preco_custo) * 100).toFixed(0)}%)</p>
                )}
                <div style={s.acoes}>
                  <button style={{ ...s.acaoBtn, background: "rgba(192,57,43,0.1)", color: "#c0392b", border: "1px solid #c0392b" }} onClick={() => excluirEstoque(e.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "financeiro" && (
          <div>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <p style={s.statLabel}>Receita do mes</p>
                <p style={{ ...s.statValue, color: VERDE_CLARO, fontSize: "16px" }}>{formatBRL(receitaMes)}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>Receita total</p>
                <p style={{ ...s.statValue, fontSize: "16px" }}>{formatBRL(receitaTotal)}</p>
              </div>
            </div>
            <div style={s.card}>
              <p style={{ ...s.tag, marginBottom: "16px" }}>Pedidos por status</p>
              {STATUS_LISTA.map(st => {
                const total = pedidos.filter(p => p.status === st).reduce((acc, p) => acc + p.valor, 0);
                const count = pedidos.filter(p => p.status === st).length;
                return (
                  <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDA}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: STATUS_CORES[st], display: "inline-block" }} />
                      <span style={{ color: "#ccc", fontFamily: "sans-serif", fontSize: "13px", textTransform: "capitalize" }}>{st}</span>
                      <span style={{ color: "#888", fontFamily: "sans-serif", fontSize: "12px" }}>({count})</span>
                    </div>
                    <span style={{ color: STATUS_CORES[st], fontFamily: "sans-serif", fontSize: "13px", fontWeight: "700" }}>{formatBRL(total)}</span>
                  </div>
                );
              })}
            </div>
            <div style={s.card}>
              <p style={{ ...s.tag, marginBottom: "16px" }}>Ultimos pedidos</p>
              {pedidos.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDA}` }}>
                  <div>
                    <p style={{ color: "#fff", fontFamily: "sans-serif", fontSize: "13px", margin: "0 0 2px" }}>{p.cliente_nome}</p>
                    <p style={{ color: "#888", fontFamily: "sans-serif", fontSize: "11px", margin: 0 }}>{p.produto}</p>
                  </div>
                  <p style={{ color: VERDE_CLARO, fontFamily: "sans-serif", fontSize: "13px", fontWeight: "700", margin: 0 }}>{formatBRL(p.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
