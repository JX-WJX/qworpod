#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu;
mod tray;
mod window;

use cpu::CpuState;
use std::sync::{Arc, Mutex};
use tauri_plugin_autostart::MacosLauncher;

fn main() {
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--webview2-default-background-color=00000000");

    let cpu_value = Arc::new(Mutex::new(0.0f32));
    cpu::start_sampler(cpu_value.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(CpuState(cpu_value))
        .invoke_handler(tauri::generate_handler![cpu::get_cpu])
        .setup(|app| {
            window::setup(app.handle())?;
            tray::setup(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Qworpod");
}