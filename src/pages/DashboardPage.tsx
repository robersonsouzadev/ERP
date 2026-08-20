import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { KPICard } from '../components/ui/KPICard';
import { AIInsight } from '../components/ui/AIComponents';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../lib/formatters';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Package,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

// 7-day revenue evolution data
const REVENUE_SERIES = [
  { day: '08/Ago', real: 142000, meta: 160000 },
  { day: '09/Ago', real: 189000, meta: 160000 },
  { day: '10/Ago', real: 215000, meta: 170000 },
  { day: '11/Ago', real: 178000, meta: 170000 },
  { day: '12/Ago', real: 198000, meta: 170000 },
  { day: '13/Ago', real: 224000, meta: 180000 },
  { day: '14/Ago', real: 138300, meta: 180000 },
];

const CATEGORY_DISTRIBUTION = [
  { nome: 'Tintas & Complementos Automotivos', valor: 539400, percent: 42, color: 'var(--action-primary)' },
  { nome: 'Peças & Componentes Mecânicos', valor: 359600, percent: 28, color: 'var(--domain-estoque)' },
  { nome: 'Abrasivos, Lixas & Polimento', valor: 231100, percent: 18, color: 'var(--domain-compras)' },
  { nome: 'Ferramentas & Equipamentos', valor: 154200, percent: 12, color: 'var(--domain-fiscal)' },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<'diretor' | 'comercial' | 'financeiro' | 'estoque'>('diretor');
  const [period, setPeriod] = useState<'mes' | '7dias' | 'hoje'>('mes');
  const [filial, setFilial] = useState<'todas' | 'matriz' | 'dourados'>('todas');

  const recentSales = [
    { id: 'PED-1024', cliente: 'PIVETA DISTRIBUIDORA DE TINTAS', canal: 'Balcão / PDV', valor: 14200.0, status: 'Aprovado', data: '2026-08-14' },
    { id: 'PED-1023', cliente: 'AUTO PEÇAS DOURADOS LTDA', canal: 'Representante', valor: 8450.5, status: 'Bloqueado', data: '2026-08-14' },
    { id: 'PED-1022', cliente: 'SUPERMERCADO CENTRAL MS', canal: 'Pedido Faturado', valor: 32900.0, status: 'Pendente', data: '2026-08-13' },
    { id: 'PED-1021', cliente: 'MECÂNICA E FUNILARIA SILVA', canal: 'Balcão / PDV', valor: 2150.0, status: 'Concluído', data: '2026-08-13' },
    { id: 'PED-1020', cliente: 'AGROPECUÁRIA GUARANÍ LTDA', canal: 'Representante', valor: 18740.0, status: 'Aprovado', data: '2026-08-13' },
  ];

  // SVG Chart Dimensions & Calculations
  const chartW = 540;
  const chartH = 140;
  const maxVal = 250000;

  const pointsReal = REVENUE_SERIES.map((d, i) => {
    const x = 30 + (i * (chartW - 60)) / (REVENUE_SERIES.length - 1);
    const y = chartH - 25 - (d.real / maxVal) * (chartH - 45);
    return `${x},${y}`;
  }).join(' ');

  const pointsMeta = REVENUE_SERIES.map((d, i) => {
    const x = 30 + (i * (chartW - 60)) / (REVENUE_SERIES.length - 1);
    const y = chartH - 25 - (d.meta / maxVal) * (chartH - 45);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="coliseu-page" style={{ gap: 'var(--spacing-4)' }}>
      {/* Header do Workspace */}
      <PageHeader
        title="Cockpit Executivo & Visão 360°"
        description="Painel unificado de tomada de decisão com telemetria financeira, operacional e previsão de liquidez."
        breadcrumbItems={[
          { label: 'Visão Geral', active: false },
          { label: 'Cockpit Executivo', active: true },
        ]}
        primaryAction={{
          label: 'Nova Venda (PDV)',
          onClick: () => onNavigate?.('pdv'),
          icon: <ShoppingBag aria-hidden="true" size={14} />,
        }}
      />

      {/* Barra de Contexto & Filtros Operacionais */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--spacing-3)',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px var(--spacing-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          {/* Perfil Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Visão:
            </span>
            {(['diretor', 'comercial', 'financeiro', 'estoque'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                style={{
                  backgroundColor: profile === p ? 'var(--surface-2)' : 'transparent',
                  color: profile === p ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: profile === p ? '1px solid var(--border-default)' : '1px solid transparent',
                  borderRadius: 'var(--radius-xs)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: profile === p ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all var(--motion-fast) var(--motion-ease)',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Período Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              style={{
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 6px',
                fontSize: '11px',
                outline: 'none',
              }}
            >
              <option value="mes">Agosto / 2026 (Mês Atual)</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="hoje">Hoje (Tempo Real)</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Filial Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
            <select
              value={filial}
              onChange={(e) => setFilial(e.target.value as any)}
              style={{
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 6px',
                fontSize: '11px',
                outline: 'none',
              }}
            >
              <option value="todas">Consolidado (Todas as Filiais)</option>
              <option value="matriz">01 - Filial Matriz Dourados</option>
              <option value="dourados">02 - Filial Campo Grande</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>Dados atualizados em tempo real</span>
        </div>
      </div>

      {/* Faixa de Indicadores Principais (Sem cards desnecessários - Inline Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-3)',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--spacing-3) var(--spacing-4)',
        }}
      >
        <KPICard
          title="Faturamento Bruto"
          value={1284300.0}
          isCurrency
          change={8.4}
          periodLabel="vs. mês anterior"
          subtitle="Meta: R$ 1.500.000 (85.6%)"
          actionText="Ver DRE"
          onAction={() => onNavigate?.('dre')}
        />
        <KPICard
          title="Margem de Contribuição"
          value="34,2%"
          change={1.8}
          periodLabel="p.p. vs. meta"
          subtitle="Lucro Operacional R$ 439.230"
          actionText="Ver Rentabilidade"
          onAction={() => onNavigate?.('reports')}
        />
        <KPICard
          title="Contas a Receber"
          value={342150.0}
          isCurrency
          change={-2.1}
          periodLabel="vs. semana anterior"
          subtitle="12 títulos vencem hoje"
          actionText="Ver Financeiro"
          onAction={() => onNavigate?.('financial')}
        />
        <KPICard
          title="Pedidos em Carteira"
          value="48 Pedidos"
          change={14.2}
          periodLabel="vs. ontem"
          subtitle="3 bloqueados por limite"
          actionText="Ver Pedidos"
          onAction={() => onNavigate?.('sales')}
        />
        <KPICard
          title="Giro de Estoque"
          value="18,4 Dias"
          change={-4.0}
          periodLabel="otimização de capital"
          subtitle="5 itens em ponto de pedido"
          actionText="Ver Saldos"
          onAction={() => onNavigate?.('inventory')}
        />
      </div>

      {/* Bloco Central Analítico: Gráficos de Evolução & Distribuição */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--spacing-3)' }}>
        {/* Painel 1: Evolução de Vendas vs Meta (7 dias) */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Evolução Diária de Faturamento vs. Meta
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                Comparativo diário de faturamento realizado contra meta estabelecida
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--action-primary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Realizado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--text-subtle)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Meta Diária</span>
              </div>
            </div>
          </div>

          {/* Inline SVG Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
              {/* Grid Lines */}
              {[0, 1, 2, 3].map((g) => {
                const y = 15 + g * 32;
                return (
                  <line
                    key={g}
                    x1="30"
                    y1={y}
                    x2={chartW - 20}
                    y2={y}
                    stroke="var(--border-subtle)"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Meta Line (Dashed) */}
              <polyline
                fill="none"
                stroke="var(--text-subtle)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                points={pointsMeta}
              />

              {/* Real Line (Solid Blue) */}
              <polyline
                fill="none"
                stroke="var(--action-primary)"
                strokeWidth="2"
                points={pointsReal}
              />

              {/* Points Real */}
              {REVENUE_SERIES.map((d, i) => {
                const x = 30 + (i * (chartW - 60)) / (REVENUE_SERIES.length - 1);
                const y = chartH - 25 - (d.real / maxVal) * (chartH - 45);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="var(--surface-1)" stroke="var(--action-primary)" strokeWidth="2" />
                    {/* Day label */}
                    <text x={x} y={chartH - 5} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Painel 2: Distribuição por Linha de Produto */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Composição da Receita por Linha
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Top 4 Categorias</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORY_DISTRIBUTION.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    {cat.nome}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {formatCurrency(cat.valor)} ({cat.percent}%)
                  </span>
                </div>
                {/* Progress Bar */}
                <div style={{ height: '4px', backgroundColor: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seção Operações Prioritárias + Inteligência Contextual */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--spacing-3)' }}>
        {/* Bloco 1: Atenção Operacional Imediata */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
              <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />
              <span>Atenção Operacional Imediata</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>3 itens pendentes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Linha 1: Pedidos Bloqueados */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: 'var(--surface-2)',
                borderLeft: '3px solid var(--status-danger)',
                borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3 pedidos bloqueados</strong> por estouro de limite de crédito
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('sales')}
                className="coliseu-btn coliseu-btn-secondary coliseu-btn--sm"
              >
                <span>Resolver</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Linha 2: Títulos Vencendo Hoje */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: 'var(--surface-2)',
                borderLeft: '3px solid var(--status-warning)',
                borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>12 títulos a receber vencem hoje</strong> (R$ 28.400,00)
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('financial')}
                className="coliseu-btn coliseu-btn-secondary coliseu-btn--sm"
              >
                <span>Ver Títulos</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Linha 3: Ponto de Pedido Estoque */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: 'var(--surface-2)',
                borderLeft: '3px solid var(--status-info)',
                borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>5 itens críticos</strong> atingiram o ponto de reposição
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('inventory')}
                className="coliseu-btn coliseu-btn-secondary coliseu-btn--sm"
              >
                <span>Gerar Pedido</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Inteligência Contextual Discreta */}
        <AIInsight
          title="ATENÇÃO FINANCEIRA"
          message="Concentração de contas a pagar nos próximos 3 dias (R$ 84.200,00) contra recebimento estimado de R$ 42.100,00. Risco temporário de fluxo de caixa negativo projetado para 17/08."
          actionText="Ver Projeção de Caixa"
          onAction={() => onNavigate?.('financial')}
        />
      </div>

      {/* Tabela Resumida de Vendas & Pedidos Recentes */}
      <div
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Operações Comerciais Recentes
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
              Últimos pedidos faturados e emitidos nos caixas e canais remotos
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('sales')}
            className="coliseu-btn coliseu-btn-secondary coliseu-btn--sm"
          >
            Ver Todos os Pedidos
          </button>
        </div>

        <div className="coliseu-table-container">
          <table className="coliseu-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente / Razão Social</th>
                <th>Canal de Venda</th>
                <th>Data</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'center' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-link)' }} className="text-mono">
                    {sale.id}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                    {sale.cliente}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{sale.canal}</td>
                  <td>{formatDate(sale.data)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'var(--font-weight-semibold)' }} className="tabular-nums">
                    {formatCurrency(sale.valor)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
