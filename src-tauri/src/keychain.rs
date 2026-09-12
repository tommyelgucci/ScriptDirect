use keyring::Entry;

const SERVICE: &str = "com.scriptdirect.app";

fn entry_for(provider: &str) -> Result<Entry, String> {
  Entry::new(SERVICE, provider).map_err(|error| error.to_string())
}

/// OS keychain-backed BYOK key storage for the Tauri desktop build, per
/// ARCHITECTURE.md's Platform Strategy. `keyring` picks the native backend
/// per OS (Keychain on macOS, Credential Manager on Windows, the
/// secret-service D-Bus API on Linux) — there is no ScriptDirect-owned
/// storage involved, and nothing here ever touches disk directly.
#[tauri::command]
pub fn keychain_get_api_key(provider: String) -> Result<Option<String>, String> {
  match entry_for(&provider)?.get_password() {
    Ok(password) => Ok(Some(password)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
pub fn keychain_set_api_key(provider: String, api_key: String) -> Result<(), String> {
  entry_for(&provider)?.set_password(&api_key).map_err(|error| error.to_string())
}

/// Deleting an entry that isn't there isn't an error: `writeApiKey('')` on
/// the frontend clears a key unconditionally, whether or not one was ever
/// set for that provider.
#[tauri::command]
pub fn keychain_delete_api_key(provider: String) -> Result<(), String> {
  match entry_for(&provider)?.delete_credential() {
    Ok(()) => Ok(()),
    Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}
