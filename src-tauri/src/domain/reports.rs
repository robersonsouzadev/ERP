//! Módulo de Relatórios Gerenciais de Giro de Estoque e Estatísticas Executivas
//!
//! Apura giro de estoque, tempo de cobertura em dias e indicadores de desempenho.

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemGiroEstoque {
    pub produto_id: String,
    pub codigo_sku: String,
    pub descricao: String,
    pub estoque_atual: f64,
    pub quantidade_vendida_periodo: f64,
    pub giro_estoque: f64,
    pub cobertura_dias: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatorioGiroEstoqueReport {
    pub total_itens: usize,
    pub itens: Vec<ItemGiroEstoque>,
}

/// Gera o relatório gerencial de Giro de Estoque e Cobertura em Dias
pub fn gerar_relatorio_giro_estoque(
    conn: &Connection,
    filial_id: &str,
    dias_periodo: u32,
) -> Result<RelatorioGiroEstoqueReport, String> {
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.codigo_sku, p.descricao,
                    COALESCE((SELECT SUM(quantidade_atual) FROM estoque_saldos WHERE produto_id = p.id), 0.0) as saldo,
                    COALESCE((SELECT SUM(vi.quantidade) FROM vendas_itens vi JOIN vendas v ON v.id = vi.venda_id WHERE vi.produto_id = p.id AND v.status = 'CONCLUIDA'), 0.0) as qtd_vendida
             FROM produtos p
             JOIN empresas e ON e.id = p.empresa_id
             JOIN filiais f ON f.empresa_id = e.id
             WHERE f.id = ?1 AND p.is_deleted = 0
             ORDER BY saldo DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([filial_id], |r| {
            let p_id: String = r.get(0)?;
            let sku: String = r.get(1)?;
            let desc: String = r.get(2)?;
            let saldo: f64 = r.get(3)?;
            let qtd_vendida: f64 = r.get(4)?;

            let consumo_diario = if dias_periodo > 0 {
                qtd_vendida / (dias_periodo as f64)
            } else {
                0.0
            };

            let cobertura = if consumo_diario > 0.0 {
                saldo / consumo_diario
            } else {
                999.0
            };

            let giro = if saldo > 0.0 {
                qtd_vendida / saldo
            } else {
                0.0
            };

            Ok(ItemGiroEstoque {
                produto_id: p_id,
                codigo_sku: sku,
                descricao: desc,
                estoque_atual: saldo,
                quantidade_vendida_periodo: qtd_vendida,
                giro_estoque: (giro * 100.0).round() / 100.0,
                cobertura_dias: (cobertura * 10.0).round() / 10.0,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }

    info!("Relatório de giro de estoque gerado com sucesso. {} itens apurados.", result.len());

    Ok(RelatorioGiroEstoqueReport {
        total_itens: result.len(),
        itens: result,
    })
}
