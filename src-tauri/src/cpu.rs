use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use tauri::State;

pub struct CpuState(pub Arc<Mutex<f32>>);

#[tauri::command]
pub fn get_cpu(state: State<CpuState>) -> f32 {
    *state.0.lock().unwrap()
}

pub fn start_sampler(arc: Arc<Mutex<f32>>) {
    thread::spawn(move || {
        let mut sys = System::new();
        sys.refresh_cpu_usage();
        thread::sleep(Duration::from_millis(300));
        loop {
            sys.refresh_cpu_usage();
            let usage = sys.global_cpu_usage();
            *arc.lock().unwrap() = usage;
            thread::sleep(Duration::from_millis(1000));
        }
    });
}