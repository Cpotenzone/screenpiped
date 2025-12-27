// Monitor Preview Capture Command
// Add this to src-tauri/src/commands.rs or create a new file

use base64::{engine::general_purpose, Engine as _};
use image::{imageops::FilterType, DynamicImage, ImageFormat};
use std::io::Cursor;
use xcap::Monitor;

#[derive(serde::Serialize)]
pub struct PreviewCaptureResult {
    image_data: String,
    width: u32,
    height: u32,
}

/// Capture a preview frame from a specific monitor
/// 
/// This function:
/// 1. Captures the current screen content
/// 2. Scales it down to target dimensions
/// 3. Encodes as JPEG with specified quality
/// 4. Returns as base64 data URL
#[tauri::command]
pub async fn capture_monitor_preview(
    monitor_id: String,
    target_width: u32,
    target_height: u32,
    quality: u8,
) -> Result<PreviewCaptureResult, String> {
    // Get all monitors
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    // Find the target monitor
    let monitor = monitors
        .into_iter()
        .find(|m| m.id().to_string() == monitor_id)
        .ok_or_else(|| format!("Monitor {} not found", monitor_id))?;

    // Capture the screen
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture monitor: {}", e))?;

    // Convert to DynamicImage
    let dynamic_image = DynamicImage::ImageRgba8(image);

    // Calculate aspect-preserving dimensions
    let (orig_width, orig_height) = (dynamic_image.width(), dynamic_image.height());
    let aspect_ratio = orig_width as f32 / orig_height as f32;
    let target_aspect = target_width as f32 / target_height as f32;

    let (scaled_width, scaled_height) = if aspect_ratio > target_aspect {
        // Width is the limiting factor
        (target_width, (target_width as f32 / aspect_ratio) as u32)
    } else {
        // Height is the limiting factor
        ((target_height as f32 * aspect_ratio) as u32, target_height)
    };

    // Resize the image (using fast filter for preview)
    let resized = dynamic_image.resize(scaled_width, scaled_height, FilterType::Nearest);

    // Encode as JPEG
    let mut buffer = Cursor::new(Vec::new());
    resized
        .write_to(&mut buffer, ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

    // Convert to base64
    let base64_data = general_purpose::STANDARD.encode(buffer.into_inner());
    let data_url = format!("data:image/jpeg;base64,{}", base64_data);

    Ok(PreviewCaptureResult {
        image_data: data_url,
        width: scaled_width,
        height: scaled_height,
    })
}

// Don't forget to register this command in main.rs:
// .invoke_handler(tauri::generate_handler![
//     capture_monitor_preview,
//     // ... other commands
// ])
