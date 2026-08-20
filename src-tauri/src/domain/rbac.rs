//! Módulo de Segurança RBAC (Role-Based Access Control) & Governança de Alçadas de Desconto
//!
//! Controla perfis de acesso (OPERADOR, GERENTE, ADMIN), limites de desconto e liberação atômica.

use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usuario {
    pub id: String,
    pub empresa_id: String,
    pub nome: String,
    pub username: String,
    pub perfil: String, // 'OPERADOR', 'GERENTE', 'ADMIN'
    pub ativo: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlcadaDesconto {
    pub perfil: String,
    pub percentual_max_desconto: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidacaoAlcadaResult {
    pub aprovado: bool,
    pub perfil_usuario: String,
    pub limite_permitido_percentual: f64,
    pub mensagem: String,
}

/// Autentica um usuário via username e password_hash
pub fn autenticar_usuario(
    conn: &Connection,
    username: &str,
    password_hash: &str,
) -> Result<Usuario, String> {
    conn.query_row(
        "SELECT id, empresa_id, nome, username, perfil, ativo
         FROM usuarios
         WHERE username = ?1 AND password_hash = ?2 AND ativo = 1",
        params![username, password_hash],
        |r| {
            Ok(Usuario {
                id: r.get(0)?,
                empresa_id: r.get(1)?,
                nome: r.get(2)?,
                username: r.get(3)?,
                perfil: r.get(4)?,
                ativo: r.get(5)?,
            })
        },
    )
    .map_err(|_| "Credenciais inválidas ou usuário inativo".to_string())
}

/// Valida se o percentual de desconto solicitado respeita a alçada do perfil do usuário
pub fn validar_alcada_desconto(
    conn: &Connection,
    usuario_id: &str,
    percentual_solicitado: f64,
) -> Result<ValidacaoAlcadaResult, String> {
    // 1. Busca o perfil do usuário
    let perfil: String = conn
        .query_row(
            "SELECT perfil FROM usuarios WHERE id = ?1 AND ativo = 1",
            params![usuario_id],
            |r| r.get(0),
        )
        .map_err(|_| "Usuário não encontrado".to_string())?;

    // 2. Define limite padrão por perfil se não houver cadastro na tabela alcadas_desconto
    let limite_max = match perfil.as_str() {
        "ADMIN" => 100.0,
        "GERENTE" => 20.0,
        _ => 5.0, // OPERADOR limite padrão de 5%
    };

    let limite_tabela: f64 = conn
        .query_row(
            "SELECT percentual_max_desconto FROM alcadas_desconto WHERE perfil = ?1",
            params![perfil],
            |r| r.get(0),
        )
        .unwrap_or(limite_max);

    if percentual_solicitado <= limite_tabela {
        Ok(ValidacaoAlcadaResult {
            aprovado: true,
            perfil_usuario: perfil.clone(),
            limite_permitido_percentual: limite_tabela,
            mensagem: format!("Desconto de {:.1}% aprovado dentro da alçada de {:.1}%", percentual_solicitado, limite_tabela),
        })
    } else {
        Ok(ValidacaoAlcadaResult {
            aprovado: false,
            perfil_usuario: perfil.clone(),
            limite_permitido_percentual: limite_tabela,
            mensagem: format!(
                "Desconto de {:.1}% excede a alçada permitida de {:.1}% para o perfil {}. Exige liberação de Gerente/Admin.",
                percentual_solicitado, limite_tabela, perfil
            ),
        })
    }
}

/// Cadastra ou atualiza um usuário no sistema
pub fn salvar_usuario(
    conn: &Connection,
    device_id: &str,
    empresa_id: &str,
    nome: &str,
    username: &str,
    password_hash: &str,
    perfil: &str,
) -> Result<Usuario, String> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO usuarios (
            id, device_id, created_at, updated_at, x_sync_status, x_version, is_deleted,
            empresa_id, nome, username, password_hash, perfil, ativo
        ) VALUES (?1, ?2, ?3, ?3, 'pending', 1, 0, ?4, ?5, ?6, ?7, ?8, 1)
        ON CONFLICT(username) DO UPDATE SET
            nome = excluded.nome,
            password_hash = excluded.password_hash,
            perfil = excluded.perfil,
            updated_at = excluded.updated_at,
            x_version = x_version + 1, x_sync_status = 'pending'",
        params![id, device_id, now, empresa_id, nome, username, password_hash, perfil],
    )
    .map_err(|e| format!("Erro ao salvar usuário: {}", e))?;

    info!("Usuário {} ({}) salvo com sucesso com perfil {}", nome, username, perfil);

    autenticar_usuario(conn, username, password_hash)
}

/// Lista todos os usuários cadastrados
pub fn listar_usuarios(conn: &Connection, empresa_id: &str) -> Result<Vec<Usuario>, String> {
    let mut stmt = conn
        .prepare("SELECT id, empresa_id, nome, username, perfil, ativo FROM usuarios WHERE empresa_id = ?1 AND is_deleted = 0 ORDER BY nome ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([empresa_id], |r| {
            Ok(Usuario {
                id: r.get(0)?,
                empresa_id: r.get(1)?,
                nome: r.get(2)?,
                username: r.get(3)?,
                perfil: r.get(4)?,
                ativo: r.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }
    Ok(result)
}
