use tauri::State;
use crate::db::DbState;
use crate::ai::llm_router::{LlmRouter, LlmProviderInfo, PingResult};
use crate::ai::encryption::{encrypt_key, decrypt_key};
use uuid::Uuid;
use chrono::Local;

const SECRET_SALT: &str = "COLISEU_ERP_SECRET_SALT_2026_AI_KEY";

#[derive(Debug, Clone)]
struct DbProviderRecord {
    key_enc: Option<String>,
    api_url: Option<String>,
    default_model: Option<String>,
}

#[tauri::command]
pub async fn list_llm_providers(state: State<'_, DbState>) -> Result<Vec<LlmProviderInfo>, String> {
    let default_providers = vec![
        ("openai", "Coliseu AI — OpenAI", vec!["GPT-4o (Flagship)", "GPT-4o Mini", "o3-mini"]),
        ("anthropic", "Coliseu AI — Anthropic", vec!["Claude 3.5 Sonnet", "Claude 3.5 Haiku"]),
        ("gemini", "Coliseu AI — Google Gemini", vec!["Gemini 2.0 Flash", "Gemini 1.5 Pro"]),
        ("deepseek", "Coliseu AI — DeepSeek", vec!["DeepSeek-V3", "DeepSeek-R1"]),
        ("ollama", "Coliseu AI — Ollama Local", vec!["Llama 3.3", "DeepSeek-R1 Local", "Qwen 2.5"]),
    ];

    let mut records = Vec::new();

    // 1. Ler dados do banco e soltar o lock antes dos pings assíncronos
    {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        for (p_type, _, _) in &default_providers {
            let mut stmt = conn.prepare("SELECT api_key_encrypted, api_url, default_model FROM llm_providers WHERE provider_type = ?1")
                .map_err(|e: rusqlite::Error| e.to_string())?;

            let db_row = stmt.query_row([*p_type], |r| {
                Ok(DbProviderRecord {
                    key_enc: r.get(0)?,
                    api_url: r.get(1)?,
                    default_model: r.get(2)?,
                })
            }).ok();

            records.push((*p_type, db_row));
        }
    }

    // 2. Executar pings assíncronos sem travar a conexão com o banco
    let mut results = Vec::new();

    for (p_type, name, models) in default_providers {
        let rec = records.iter().find(|(t, _)| *t == p_type).and_then(|(_, r)| r.clone());

        let (has_key, status, status_reason, url, def_model) = match rec {
            Some(DbProviderRecord { key_enc, api_url, default_model }) => {
                let decrypted = key_enc.as_deref().and_then(|k| decrypt_key(k, SECRET_SALT).ok());
                let has_k = decrypted.as_ref().map(|k| !k.is_empty()).unwrap_or(false) || p_type == "ollama";
                
                let ping = LlmRouter::ping_provider(p_type, decrypted.as_deref().unwrap_or(""), api_url.as_deref()).await;

                (
                    has_k,
                    if ping.ok { "CONECTADO".to_string() } else { "DESCONECTADO".to_string() },
                    ping.reason,
                    api_url,
                    default_model,
                )
            }
            None => {
                (
                    p_type == "ollama",
                    "DESCONECTADO".to_string(),
                    "Chave API não configurada".to_string(),
                    None,
                    None,
                )
            }
        };

        results.push(LlmProviderInfo {
            id: p_type.to_string(),
            provider_type: p_type.to_string(),
            name: name.to_string(),
            status,
            status_reason,
            models: models.into_iter().map(String::from).collect(),
            has_key_configured: has_key,
            api_url: url,
            default_model: def_model,
        });
    }

    Ok(results)
}

#[tauri::command]
pub async fn set_llm_provider_key(
    state: State<'_, DbState>,
    provider_type: String,
    api_key: String,
    api_url: Option<String>,
) -> Result<PingResult, String> {
    let encrypted = encrypt_key(&api_key, SECRET_SALT);
    let ping = LlmRouter::ping_provider(&provider_type, &api_key, api_url.as_deref()).await;

    let now = Local::now().to_rfc3339();

    {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT id FROM llm_providers WHERE provider_type = ?1")
            .map_err(|e: rusqlite::Error| e.to_string())?;

        let existing_id: Option<String> = stmt.query_row([&provider_type], |r| r.get(0)).ok();

        if let Some(id) = existing_id {
            conn.execute(
                "UPDATE llm_providers SET api_key_encrypted = ?1, api_url = ?2, is_active = ?3, updated_at = ?4 WHERE id = ?5",
                rusqlite::params![encrypted, api_url, if ping.ok { 1 } else { 0 }, now, id],
            ).map_err(|e: rusqlite::Error| e.to_string())?;
        } else {
            let new_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO llm_providers (id, device_id, created_at, updated_at, provider_type, name, api_key_encrypted, api_url, is_active)
                 VALUES (?1, 'local', ?2, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![new_id, now, provider_type, format!("Provedor {}", provider_type), encrypted, api_url, if ping.ok { 1 } else { 0 }],
            ).map_err(|e: rusqlite::Error| e.to_string())?;
        }
    }

    Ok(ping)
}

#[tauri::command]
pub async fn ping_llm_provider(
    state: State<'_, DbState>,
    provider_type: String,
) -> Result<PingResult, String> {
    let (key, url) = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT api_key_encrypted, api_url FROM llm_providers WHERE provider_type = ?1")
            .map_err(|e: rusqlite::Error| e.to_string())?;

        let row = stmt.query_row([&provider_type], |r| {
            Ok((r.get::<_, Option<String>>(0)?, r.get::<_, Option<String>>(1)?))
        }).ok();

        match row {
            Some((Some(enc), u)) => (decrypt_key(&enc, SECRET_SALT).unwrap_or_default(), u),
            Some((None, u)) => (String::new(), u),
            None => (String::new(), None),
        }
    };

    Ok(LlmRouter::ping_provider(&provider_type, &key, url.as_deref()).await)
}
