use acorde_core::Score;
use wasm_bindgen::prelude::*;

fn parse_score(json: &str) -> Result<Score, JsValue> {
    let score: Score = serde_json::from_str(json)
        .map_err(|error| JsValue::from_str(&format!("invalid score JSON: {error}")))?;
    if !acorde_core::validate(&score).is_valid() {
        return Err(JsValue::from_str("invalid score"));
    }
    Ok(score)
}

#[wasm_bindgen]
pub fn analyze_vertical(score_json: &str) -> Result<String, JsValue> {
    let score = parse_score(score_json)?;
    let result = serde_json::json!({
        "sonorities": acorde_analysis::analyze_vertical_sonorities_report(&score),
        "arpeggiated": acorde_analysis::analyze_arpeggiated_bars_report(&score),
        "cadences": acorde_analysis::analyze_vertical_cadences_report(&score),
    });
    serde_json::to_string(&result).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn analyze_local_keys(score_json: &str, radius: usize) -> Result<String, JsValue> {
    if !(1..=16).contains(&radius) {
        return Err(JsValue::from_str("local-key radius must be 1..=16"));
    }
    let score = parse_score(score_json)?;
    serde_json::to_string(&acorde_analysis::estimate_local_keys_with_aarden_essen_profile(&score, radius))
        .map_err(|error| JsValue::from_str(&error.to_string()))
}
