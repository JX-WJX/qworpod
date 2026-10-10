use tauri::{AppHandle, Manager};

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    if let Some(w) = app.get_webview_window("main") {
        w.set_decorations(false)?;
        w.set_always_on_top(true)?;
        w.set_resizable(false)?;
        w.set_skip_taskbar(true)?;
        w.set_shadow(false)?;
    }
    Ok(())
}