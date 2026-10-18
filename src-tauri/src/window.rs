use tauri::{AppHandle, Manager};

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    if let Some(w) = app.get_webview_window("main") {
        w.set_decorations(false)?;
        w.set_always_on_top(true)?;
        w.set_resizable(false)?;
        w.set_skip_taskbar(true)?;
        w.set_shadow(false)?;

        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_NCRENDERING_POLICY, DWMNCRP_DISABLED};
            use windows::Win32::UI::WindowsAndMessaging::{
                GetWindowLongW, SetWindowLongW, GWL_STYLE, 
                WS_CAPTION, WS_THICKFRAME, WS_MINIMIZEBOX, WS_MAXIMIZEBOX, WS_SYSMENU,
                SetWindowPos, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_FRAMECHANGED
            };

            if let Ok(raw_hwnd) = w.hwnd() {
                let hwnd = HWND(raw_hwnd.0);
                unsafe {
                    let mut style = GetWindowLongW(hwnd, GWL_STYLE);
                    style &= !((WS_CAPTION.0 | WS_THICKFRAME.0 | WS_MINIMIZEBOX.0 | WS_MAXIMIZEBOX.0 | WS_SYSMENU.0) as i32);
                    SetWindowLongW(hwnd, GWL_STYLE, style);

                    let _ = SetWindowPos(
                        hwnd, 
                        None, 
                        0, 0, 0, 0, 
                        SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED
                    );

                    let _ = DwmSetWindowAttribute(
                        hwnd,
                        DWMWA_NCRENDERING_POLICY,
                        &DWMNCRP_DISABLED as *const _ as *const _,
                        std::mem::size_of::<i32>() as u32,
                    );
                }
            }
        }
    }
    Ok(())
}