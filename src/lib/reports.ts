import { invoke } from "@tauri-apps/api/core";

export interface ItemCurvaAbc {
  produto_id: string;
  codigo_sku: string;
  descricao: string;
  faturamento_total: number;
  percentual_relativo: number;
  percentual_acumulado: number;
  classe: 'A' | 'B' | 'C';
}

export interface CurvaAbcReport {
  total_produtos_analisados: number;
  faturamento_total_periodo: number;
  total_classe_a: number;
  total_classe_b: number;
  total_classe_c: number;
  itens: ItemCurvaAbc[];
}

export interface ItemGiroEstoque {
  produto_id: string;
  codigo_sku: string;
  descricao: string;
  estoque_atual: number;
  quantidade_vendida_periodo: number;
  giro_estoque: number;
  cobertura_dias: number;
}

export interface RelatorioGiroEstoqueReport {
  total_itens: number;
  itens: ItemGiroEstoque[];
}

/**
 * Service Layer / Wrapper para Relatórios Gerenciais & Curva ABC.
 */
export const reportsService = {
  async gerarCurvaAbcProdutos(
    filialId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<CurvaAbcReport> {
    return await invoke<CurvaAbcReport>("gerar_curva_abc_produtos", {
      filialId,
      dataInicio,
      dataFim,
    });
  },

  async gerarRelatorioGiroEstoque(
    filialId: string,
    diasPeriodo: number
  ): Promise<RelatorioGiroEstoqueReport> {
    return await invoke<RelatorioGiroEstoqueReport>("gerar_relatorio_giro_estoque", {
      filialId,
      diasPeriodo,
    });
  },
};
