//! Comandos IPC do Módulo de Segurança RBAC, Alçadas & Audit Logs
//!
//! Exposição de rotas IPC para login, validação de alçada de desconto e consulta de audit log.

use crate::db::DbState;
use crate::domain::audit::{self, AuditLogEntry};
use crate::domain::rbac::{self, Usuario, ValidacaoAlcadaResult};
use tauri::State;
use tracing::info;

#[tauri::command]
pub async fn autenticar_usuario(
    state: State<'_, DbState>,
    username: String,
    password_hash: String,
) -> Result<Usuario, String> {
    let conn = state.conn.lock().unwrap();
    let user = rbac::autenticar_usuario(&conn, &username, &password_hash)?;
    audit::registrar_audit_log(
        &conn,
        &state.device_id,
        Some(&user.id),
        Some(&user.nome),
        "LOGIN_EFETUADO",
        "AUTENTICACAO",
        Some("Login realizado com sucesso"),
    )?;
    Ok(user)
}

#[tauri::command]
pub async fn validar_alcada_desconto(
    state: State<'_, DbState>,
    usuario_id: String,
    percentual_solicitado: f64,
) -> Result<ValidacaoAlcadaResult, String> {
    let conn = state.conn.lock().unwrap();
    let res = rbac::validar_alcada_desconto(&conn, &usuario_id, percentual_solicitado)?;
    audit::registrar_audit_log(
        &conn,
        &state.device_id,
        Some(&usuario_id),
        None,
        "VALIDACAO_ALCADA_DESCONTO",
        "PDV",
        Some(&res.mensagem),
    )?;
    Ok(res)
}

#[tauri::command]
pub async fn salvar_usuario(
    state: State<'_, DbState>,
    empresa_id: String,
    nome: String,
    username: String,
    password_hash: String,
    perfil: String,
) -> Result<Usuario, String> {
    let conn = state.conn.lock().unwrap();
    let user = rbac::salvar_usuario(
        &conn,
        &state.device_id,
        &empresa_id,
        &nome,
        &username,
        &password_hash,
        &perfil,
    )?;
    audit::registrar_audit_log(
        &conn,
        &state.device_id,
        Some(&user.id),
        Some(&user.nome),
        "USUARIO_SALVO",
        "SEGURANCA",
        Some(&format!("Perfil: {}", perfil)),
    )?;
    Ok(user)
}

#[tauri::command]
pub async fn listar_usuarios(
    state: State<'_, DbState>,
    empresa_id: String,
) -> Result<Vec<Usuario>, String> {
    let conn = state.conn.lock().unwrap();
    rbac::listar_usuarios(&conn, &empresa_id)
}

#[tauri::command]
pub async fn listar_audit_logs(
    state: State<'_, DbState>,
    limit: Option<u32>,
) -> Result<Vec<AuditLogEntry>, String> {
    let conn = state.conn.lock().unwrap();
    audit::listar_audit_logs(&conn, limit.unwrap_or(100))
}
