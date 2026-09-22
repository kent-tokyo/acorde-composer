use acorde_core::{
    Command, PlaybackOptions, Score, ScoreEngine, compute_playback_position, to_playback_events,
};
use acorde_io::{
    parse_midi, parse_midi_with_report, parse_mxl_with_report, parse_musicxml,
    parse_abc_with_report, parse_musicxml_with_report, serialize_abc_with_report, serialize_midi,
    serialize_midi_with_report, serialize_musicxml, serialize_musicxml_with_report,
};
use acorde_layout::{LayoutConfig, compute_layout};
use acorde_render_svg::{SvgRenderOptions, render_svg, render_svg_metadata};
use acorde_soundfont::{decode_sf2_pcm16, decode_sf3_vorbis, load as load_soundfont, load_materialized, select_preset_zones};
#[cfg(test)]
use acorde_core::PlaybackEvent;
#[cfg(test)]
use acorde_soundfont::{DecodedSample, SampleAction, SampleDecoder, SampleRegion, SampleRenderer, SoundFontPresetZone, render_sample_action, schedule_preset_note_on, schedule_sample_note_on};
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
enum Request {
    InspectEngine,
    ParseMusicxml {
        xml: String,
    },
    ParseAbcReport {
        text: String,
    },
    SerializeMusicxml {
        score: Score,
    },
    Layout {
        score: Score,
        measures_per_row: Option<usize>,
    },
    RenderSvg {
        score: Score,
        width: Option<f32>,
        staff_size: Option<f32>,
        measures_per_system: Option<usize>,
        interactive: Option<bool>,
    },
    RenderSvgMetadata {
        score: Score,
        width: Option<f32>,
        staff_size: Option<f32>,
        measures_per_system: Option<usize>,
        interactive: Option<bool>,
    },
    LoadScore {
        score: Score,
    },
    ExtractPart {
        score: Score,
        part_index: usize,
    },
    ApplyCommand {
        command: Command,
        label: Option<String>,
    },
    Undo,
    Redo,
    SerializeCurrent,
    RenderCurrent {
        width: Option<f32>,
        staff_size: Option<f32>,
        measures_per_system: Option<usize>,
        interactive: Option<bool>,
    },
    PlaybackEvents {
        score: Score,
        bpm: Option<u16>,
        loop_region: Option<(usize, usize)>,
    },
    PlaybackPosition {
        elapsed_secs: f64,
        bpm: Option<u16>,
    },
    ParseMidi {
        data: Vec<u8>,
    },
    SerializeMidi {
        score: Score,
    },
    SerializeMusicxmlReport {
        score: Score,
    },
    SerializeAbcReport {
        score: Score,
    },
    SerializeMidiReport {
        score: Score,
    },
    ParseMusicxmlReport {
        xml: String,
    },
    ParseMidiReport {
        data: Vec<u8>,
    },
    ParseMxlReport {
        data: Vec<u8>,
    },
    InspectSoundfont {
        data: Vec<u8>,
        provider_version: String,
        bank: Option<u16>,
        program: Option<u16>,
    },
    DecodeSoundfontSample {
        format: String,
        data: Vec<u8>,
        start_frame: Option<usize>,
        end_frame: Option<usize>,
        sample_rate: u32,
        channels: u8,
    },
    PrepareSoundfontPlayback {
        data: Vec<u8>,
        provider_version: String,
        bank: u16,
        program: u16,
        channels: u8,
        events: Vec<acorde_core::PlaybackEvent>,
    },
}

#[derive(Debug, Serialize)]
struct Response {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn current_engine(engine: &Option<ScoreEngine>) -> Result<&ScoreEngine, String> {
    engine
        .as_ref()
        .ok_or_else(|| "no score is loaded".to_string())
}

fn render_current_adaptive(
    score: &Score,
    width: f32,
    staff_size: f32,
    requested_measures_per_system: usize,
    interactive: bool,
) -> Result<String, String> {
    let requested = requested_measures_per_system.clamp(1, 16);
    let mut last_width_error = None;
    for measures_per_system in (1..=requested).rev() {
        let options = SvgRenderOptions {
            width,
            staff_size,
            measures_per_system,
            interactive,
        };
        match render_svg(score, &options) {
            Ok(svg) => return Ok(svg),
            Err(error) => {
                let message = error.to_string();
                let recoverable = message.contains("minimum measure widths exceed the available system width")
                    || message.contains("leave no usable measure width");
                if !recoverable {
                    return Err(message);
                }
                last_width_error = Some(message);
            }
        }
    }
    Err(last_width_error.unwrap_or_else(|| "adaptive score rendering failed".into()))
}

fn handle(request: Request, engine: &mut Option<ScoreEngine>) -> Result<serde_json::Value, String> {
    match request {
        Request::InspectEngine => Ok(serde_json::json!({ "ready": true })),
        Request::ParseMusicxml { xml } => {
            let score = parse_musicxml(&xml).map_err(|error| error.to_string())?;
            serde_json::to_value(score).map_err(|error| error.to_string())
        }
        Request::ParseAbcReport { text } => serde_json::to_value(
            parse_abc_with_report(&text).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::SerializeMusicxml { score } => serialize_musicxml(&score)
            .map(serde_json::Value::String)
            .map_err(|error| error.to_string()),
        Request::Layout {
            score,
            measures_per_row,
        } => {
            let config = LayoutConfig {
                measures_per_row: measures_per_row.unwrap_or(4),
                ..Default::default()
            };
            serde_json::to_value(compute_layout(&score, &config)).map_err(|error| error.to_string())
        }
        Request::RenderSvg { score, width, staff_size, measures_per_system, interactive } => {
            let options = SvgRenderOptions {
                width: width.unwrap_or(900.0),
                staff_size: staff_size.unwrap_or(10.0),
                measures_per_system: measures_per_system.unwrap_or(4),
                interactive: interactive.unwrap_or(true),
            };
            render_svg(&score, &options)
                .map(serde_json::Value::String)
                .map_err(|error| error.to_string())
        }
        Request::RenderSvgMetadata { score, width, staff_size, measures_per_system, interactive } => {
            let options = SvgRenderOptions { width: width.unwrap_or(900.0), staff_size: staff_size.unwrap_or(10.0), measures_per_system: measures_per_system.unwrap_or(4), interactive: interactive.unwrap_or(true) };
            let layout = compute_layout(&score, &LayoutConfig { measures_per_row: options.measures_per_system, ..Default::default() });
            serde_json::to_value(render_svg_metadata(&score, &layout, &options).map_err(|error| error.to_string())?).map_err(|error| error.to_string())
        }
        Request::LoadScore { score } => {
            let mut next = ScoreEngine::new();
            next.replace_score(score);
            let result = serde_json::to_value(&next.score).map_err(|error| error.to_string())?;
            *engine = Some(next);
            Ok(result)
        }
        Request::ExtractPart { score, part_index } => serde_json::to_value(
            score
                .extract_part(part_index)
                .ok_or_else(|| format!("part {part_index} not found"))?,
        )
        .map_err(|error| error.to_string()),
        Request::ApplyCommand { command, label } => {
            let state = engine
                .as_mut()
                .ok_or_else(|| "no score is loaded".to_string())?;
            state
                .batch_apply_labeled(vec![command], label.as_deref().unwrap_or("Composer"))
                .map_err(|error| error.to_string())?;
            serde_json::to_value(&state.score).map_err(|error| error.to_string())
        }
        Request::Undo => {
            let state = engine
                .as_mut()
                .ok_or_else(|| "no score is loaded".to_string())?;
            state.undo().map_err(|error| error.to_string())?;
            serde_json::to_value(&state.score).map_err(|error| error.to_string())
        }
        Request::Redo => {
            let state = engine
                .as_mut()
                .ok_or_else(|| "no score is loaded".to_string())?;
            state.redo().map_err(|error| error.to_string())?;
            serde_json::to_value(&state.score).map_err(|error| error.to_string())
        }
        Request::SerializeCurrent => {
            let state = current_engine(engine)?;
            serialize_musicxml(&state.score)
                .map(serde_json::Value::String)
                .map_err(|error| error.to_string())
        }
        Request::RenderCurrent { width, staff_size, measures_per_system, interactive } => {
            let state = current_engine(engine)?;
            render_current_adaptive(
                &state.score,
                width.unwrap_or(900.0),
                staff_size.unwrap_or(10.0),
                measures_per_system.unwrap_or(4),
                interactive.unwrap_or(true),
            )
                .map(serde_json::Value::String)
        }
        Request::PlaybackEvents {
            score,
            bpm,
            loop_region,
        } => {
            let options = PlaybackOptions {
                bpm_override: bpm,
                loop_region,
                ..Default::default()
            };
            serde_json::to_value(to_playback_events(&score, &options))
                .map_err(|error| error.to_string())
        }
        Request::PlaybackPosition { elapsed_secs, bpm } => {
            let state = current_engine(engine)?;
            let options = PlaybackOptions {
                bpm_override: bpm,
                ..Default::default()
            };
            serde_json::to_value(compute_playback_position(
                &state.score,
                &options,
                elapsed_secs,
            ))
            .map_err(|error| error.to_string())
        }
        Request::ParseMidi { data } => {
            let score = parse_midi(&data).map_err(|error| error.to_string())?;
            serde_json::to_value(score).map_err(|error| error.to_string())
        }
        Request::SerializeMidi { score } => serialize_midi(&score)
            .map(|data| serde_json::to_value(data).expect("serialize MIDI bytes"))
            .map_err(|error| error.to_string()),
        Request::SerializeMusicxmlReport { score } => serde_json::to_value(
            serialize_musicxml_with_report(&score).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::SerializeAbcReport { score } => serde_json::to_value(
            serialize_abc_with_report(&score).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::SerializeMidiReport { score } => serde_json::to_value(
            serialize_midi_with_report(&score).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::ParseMusicxmlReport { xml } => serde_json::to_value(
            parse_musicxml_with_report(&xml).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::ParseMidiReport { data } => {
            serde_json::to_value(parse_midi_with_report(&data).map_err(|error| error.to_string())?)
                .map_err(|error| error.to_string())
        }
        Request::ParseMxlReport { data } => serde_json::to_value(
            parse_mxl_with_report(&data).map_err(|error| error.to_string())?,
        )
        .map_err(|error| error.to_string()),
        Request::InspectSoundfont { data, provider_version, bank, program } => {
            let asset = load_soundfont(&data, provider_version).map_err(|error| error.to_string())?;
            let (selected, diagnostics) = match (bank, program) {
                (Some(bank), Some(program)) => match asset.preset(bank, program) {
                    Ok(preset) => (Some(preset), Vec::<String>::new()),
                    Err(acorde_soundfont::Error::PresetNotFound { .. }) => (None, vec![format!("missing-preset:{bank}:{program}")]),
                    Err(error) => return Err(error.to_string()),
                },
                (None, None) => (None, Vec::new()),
                _ => return Err("bank and program must be provided together".into()),
            };
            Ok(serde_json::json!({
                "contract_version": acorde_soundfont::PLAYBACK_CONTRACT_VERSION,
                "format": match asset.format { acorde_soundfont::SoundFontFormat::Sf2 => "sf2", acorde_soundfont::SoundFontFormat::Sf3 => "sf3" },
                "checksum": asset.checksum,
                "provider_version": asset.provider_version,
                "preset_count": asset.presets.len(),
                "presets": asset.presets.iter().take(256).map(|preset| serde_json::json!({ "bank": preset.bank, "program": preset.program, "name": preset.name })).collect::<Vec<_>>(),
                "preset": selected.map(|preset| serde_json::json!({ "bank": preset.bank, "program": preset.program, "name": preset.name })),
                "diagnostics": diagnostics,
            }))
        }
        Request::DecodeSoundfontSample { format, data, start_frame, end_frame, sample_rate, channels } => {
            let sample = match format.as_str() {
                "sf2" => decode_sf2_pcm16(&data, start_frame.unwrap_or(0), end_frame.unwrap_or(usize::MAX), sample_rate, channels),
                "sf3" => decode_sf3_vorbis(&data, sample_rate, channels),
                _ => return Err("unsupported SoundFont format".into()),
            }.map_err(|error| error.to_string())?;
            Ok(serde_json::json!({ "sample_rate": sample.sample_rate, "channels": sample.channels, "pcm_i16": sample.pcm_i16 }))
        }
        Request::PrepareSoundfontPlayback { data, provider_version, bank, program, channels, events } => {
            if !(1..=2).contains(&channels) {
                return Err("SoundFont channel count must be 1 or 2".into());
            }
            let materialized = load_materialized(&data, provider_version).map_err(|error| error.to_string())?;
            let snapshot = materialized.snapshot_for_preset(bank, program).map_err(|error| error.to_string())?;
            let mut samples = serde_json::Map::new();
            let mut prepared = Vec::new();
            let mut diagnostics: Vec<String> = snapshot.diagnostics.iter().map(|diagnostic| format!("{diagnostic:?}")).collect();
            for event in events {
                if event.is_metronome {
                    prepared.push(serde_json::to_value(event).map_err(|error| error.to_string())?);
                    continue;
                }
                let zones = select_preset_zones(materialized.zones(), bank, program, event.pitch_midi, event.velocity);
                if zones.is_empty() {
                    diagnostics.push(format!("missing-zone:{}:{}:{}:{}", bank, program, event.pitch_midi, event.velocity));
                    prepared.push(serde_json::to_value(event).map_err(|error| error.to_string())?);
                    continue;
                }
                let mut prepared_layer = false;
                for (layer, zone) in zones.into_iter().enumerate() {
                    let region = &zone.region;
                    let metadata = zone.resolved_metadata();
                    let cache_key = format!("sf:{}:{}:{}:{}:{}", snapshot.checksum, region.sample_id, region.start_frame, region.end_frame, metadata.decode_channels);
                    if !samples.contains_key(&cache_key) {
                        let decoded = match metadata.decode_sample_region(&data) {
                            Ok(decoded) => decoded,
                            Err(error) => { diagnostics.push(format!("decode-failed:{}:{}", region.sample_id, error)); continue; }
                        };
                        let loop_points = decoded.loop_points.map(|points| serde_json::json!({ "start": points.start_frame, "end": points.end_frame }));
                        samples.insert(cache_key.clone(), serde_json::json!({
                            "cacheKey": cache_key,
                            "sampleRate": decoded.sample.sample_rate,
                            "channels": decoded.sample.channels,
                            "pcm": decoded.sample.pcm_i16.into_iter().map(|sample| f32::from(sample) / 32768.0).collect::<Vec<_>>(),
                            "rootMidi": region.root_key,
                            "loopStart": loop_points.as_ref().and_then(|points| points.get("start")).and_then(serde_json::Value::as_u64),
                            "loopEnd": loop_points.as_ref().and_then(|points| points.get("end")).and_then(serde_json::Value::as_u64),
                        }));
                    }
                    let mut prepared_event = serde_json::to_value(&event).map_err(|error| error.to_string())?;
                    let fields = prepared_event.as_object_mut().ok_or_else(|| "playback event is not an object".to_string())?;
                    fields.insert("soundfont_sample_key".into(), serde_json::Value::String(cache_key));
                    fields.insert("soundfont_layer".into(), serde_json::json!(layer));
                    fields.insert("resolved_zone".into(), serde_json::to_value(zone.resolved_metadata()).map_err(|error| error.to_string())?);
                    fields.insert("sample_envelope".into(), serde_json::json!({ "attack": region.attack_secs, "decay": region.decay_secs, "sustain": region.sustain_level, "release": region.release_secs }));
                    fields.insert("sample_gain".into(), serde_json::json!(10f32.powf(-region.attenuation_db / 20.0)));
                    fields.insert("sample_tuning_cents".into(), serde_json::json!(region.fine_tune_cents));
                    prepared.push(prepared_event);
                    prepared_layer = true;
                }
                if !prepared_layer {
                    prepared.push(serde_json::to_value(event).map_err(|error| error.to_string())?);
                }
            }
            Ok(serde_json::json!({
                "snapshot": snapshot,
                "events": prepared,
                "samples": samples,
                "diagnostics": diagnostics,
                "channel_layout": "host-supplied",
            }))
        }
    }
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::BufWriter::new(io::stdout().lock());
    let mut engine = None;
    for line in stdin.lock().lines() {
        let response = match line {
            Ok(line) => match serde_json::from_str::<Request>(&line) {
                Ok(request) => match handle(request, &mut engine) {
                    Ok(result) => Response {
                        ok: true,
                        result: Some(result),
                        error: None,
                    },
                    Err(error) => Response {
                        ok: false,
                        result: None,
                        error: Some(error),
                    },
                },
                Err(error) => Response {
                    ok: false,
                    result: None,
                    error: Some(format!("invalid request: {error}")),
                },
            },
            Err(error) => Response {
                ok: false,
                result: None,
                error: Some(error.to_string()),
            },
        };
        if serde_json::to_writer(&mut stdout, &response).is_err()
            || stdout.write_all(b"\n").is_err()
            || stdout.flush().is_err()
        {
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const FIXTURE: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Round trip fixture</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>480</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
    <note><rest/><duration>1440</duration><voice>1</voice><type>half</type><dot/></note>
  </measure></part>
</score-partwise>"#;

    const TWO_MEASURE_FIXTURE: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1"><attributes><divisions>480</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>1920</duration><voice>1</voice><type>whole</type></note></measure>
    <measure number="2"><note><pitch><step>G</step><octave>4</octave></pitch><duration>1920</duration><voice>1</voice><type>whole</type></note></measure>
  </part>
</score-partwise>"#;

    const MULTI_VOICE_FIXTURE: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Two voice fixture</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>480</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
    <note><pitch><step>E</step><octave>4</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
    <forward><duration>960</duration><voice>1</voice></forward>
    <backup><duration>1920</duration></backup>
    <note><pitch><step>G</step><octave>3</octave></pitch><duration>480</duration><voice>2</voice><type>quarter</type></note>
    <note><rest/><duration>1440</duration><voice>2</voice><type>half</type><dot/></note>
  </measure></part>
</score-partwise>"#;

    const ADVANCED_NOTATION_FIXTURE: &str = include_str!("../../qa/fixtures/notation-advanced.musicxml");

    fn soundfont_fixture(ogg: bool) -> Vec<u8> {
        let mut preset = vec![0u8; 38 * 2];
        preset[..6].copy_from_slice(b"Piano\0");
        preset[20..22].copy_from_slice(&0u16.to_le_bytes());
        preset[22..24].copy_from_slice(&0u16.to_le_bytes());
        preset[38..42].copy_from_slice(b"EOP\0");
        let mut phdr = b"phdr".to_vec();
        phdr.extend((preset.len() as u32).to_le_bytes());
        phdr.extend(preset);
        let mut list = b"LIST".to_vec();
        list.extend(((phdr.len() + 4) as u32).to_le_bytes());
        list.extend(b"pdta");
        list.extend(phdr);
        let mut out = b"RIFFxxxxsfbk".to_vec();
        out.extend(list);
        if ogg {
            out.extend(b"data");
            out.extend(4u32.to_le_bytes());
            out.extend(b"OggS");
        }
        out
    }

    #[test]
    fn musicxml_report_round_trip_preserves_score_identity_fields() {
        let parsed = parse_musicxml_with_report(FIXTURE).expect("fixture parses");
        assert!(parsed.diagnostics.is_empty());
        assert_eq!(parsed.score.metadata.title, "Round trip fixture");

        let exported = serialize_musicxml_with_report(&parsed.score).expect("fixture serializes");
        assert!(exported.output.contains("<score-partwise"));
        assert!(exported.output.contains("Round trip fixture"));
        let reparsed = parse_musicxml_with_report(&exported.output).expect("serialized XML reparses");
        assert_eq!(reparsed.score.metadata.title, parsed.score.metadata.title);
        assert_eq!(reparsed.score.parts.len(), parsed.score.parts.len());
        assert_eq!(reparsed.score.parts[0].staves[0].measures.len(), 1);
        let original_voice = &parsed.score.parts[0].staves[0].measures[0].voices[0];
        let round_tripped_voice = &reparsed.score.parts[0].staves[0].measures[0].voices[0];
        assert_eq!(round_tripped_voice.len(), original_voice.len());
        assert_eq!(round_tripped_voice[0].pitches, original_voice[0].pitches);
        assert_eq!(round_tripped_voice[0].duration, original_voice[0].duration);
        assert_eq!(round_tripped_voice[1].is_rest, original_voice[1].is_rest);
        assert_eq!(round_tripped_voice[1].dot_count, original_voice[1].dot_count);
    }

    #[test]
    fn abc_report_round_trip_preserves_basic_melody() {
        let source = "X:1\nT:ABC fixture\nM:4/4\nL:1/4\nQ:1/4=120\nK:C\n^C [EG] z D |\n";
        let parsed = parse_abc_with_report(source).expect("ABC fixture parses");
        assert_eq!(parsed.format, "abc");
        assert_eq!(parsed.score.metadata.title, "ABC fixture");
        let original_voice = &parsed.score.parts[0].staves[0].measures[0].voices[0];
        assert_eq!(original_voice.len(), 4);

        let exported = serialize_abc_with_report(&parsed.score).expect("ABC fixture serializes");
        assert_eq!(exported.format, "abc");
        assert!(exported.output.contains("T:ABC fixture\n"));
        let reparsed = parse_abc_with_report(&exported.output).expect("serialized ABC reparses");
        let round_tripped_voice = &reparsed.score.parts[0].staves[0].measures[0].voices[0];
        assert_eq!(round_tripped_voice.len(), original_voice.len());
        assert_eq!(round_tripped_voice[0].pitches, original_voice[0].pitches);
        assert_eq!(round_tripped_voice[0].duration, original_voice[0].duration);
        assert_eq!(round_tripped_voice[1].pitches.len(), 2);
        assert!(round_tripped_voice[2].is_rest);
    }

    #[test]
    fn midi_report_round_trip_returns_a_score_and_diagnostics() {
        let score = parse_musicxml(FIXTURE).expect("fixture parses");
        let exported = serialize_midi_with_report(&score).expect("fixture exports to MIDI");
        assert!(!exported.output.is_empty());
        let reparsed = parse_midi_with_report(&exported.output).expect("MIDI reparses");
        assert!(!reparsed.score.parts.is_empty());
        assert_eq!(reparsed.score.parts[0].staves[0].measures.len(), 1);
        assert!(!reparsed.score.parts[0].staves[0].measures[0].voices[0].is_empty());
    }

    #[test]
    fn playback_fixture_preserves_address_timing_and_measure_position() {
        let score = parse_musicxml(FIXTURE).expect("fixture parses");
        let events = to_playback_events(&score, &PlaybackOptions { bpm_override: Some(120), ..Default::default() });
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].address.as_deref(), Some("0:0:0:0:0"));
        assert_eq!(events[0].time_beats, 0.0);
        assert_eq!(events[0].time_secs, 0.0);
        assert!((events[0].duration_beats - 1.0).abs() < f64::EPSILON);
        assert!((events[0].duration_secs - 0.5).abs() < f64::EPSILON);

        let position = compute_playback_position(&score, &PlaybackOptions { bpm_override: Some(120), ..Default::default() }, 0.75)
            .expect("position exists inside the fixture");
        assert_eq!(position.measure_index, 0);
        assert!(position.beat > 1.0);
    }

    #[test]
    fn playback_fixture_preserves_measure_boundary_timing_and_order() {
        let score = parse_musicxml(TWO_MEASURE_FIXTURE).expect("two measure fixture parses");
        let events = to_playback_events(&score, &PlaybackOptions { bpm_override: Some(120), ..Default::default() });
        assert_eq!(events.len(), 2);
        assert_eq!(events[0].address.as_deref(), Some("0:0:0:0:0"));
        assert_eq!(events[1].address.as_deref(), Some("0:0:1:0:0"));
        assert_eq!(events[0].time_beats, 0.0);
        assert_eq!(events[1].time_beats, 4.0);
        assert_eq!(events[0].time_secs, 0.0);
        assert_eq!(events[1].time_secs, 2.0);
        let position = compute_playback_position(&score, &PlaybackOptions { bpm_override: Some(120), ..Default::default() }, 2.01)
            .expect("position exists just after the second measure boundary");
        assert_eq!(position.measure_index, 1);
        assert!(position.beat > 0.0);
    }

    #[test]
    fn playback_events_cross_json_ipc_boundary() {
        let score = parse_musicxml(TWO_MEASURE_FIXTURE).expect("two measure fixture parses");
        let mut engine = None;
        let value = handle(Request::PlaybackEvents { score, bpm: Some(120), loop_region: None }, &mut engine)
            .expect("PlaybackEvents request succeeds");
        let events = value.as_array().expect("PlaybackEvents response is an array");
        assert_eq!(events.len(), 2);
        assert_eq!(events[0]["address"], "0:0:0:0:0");
        assert_eq!(events[1]["address"], "0:0:1:0:0");
        assert_eq!(events[1]["time_beats"], 4.0);
        assert_eq!(events[1]["time_secs"], 2.0);
    }

    #[test]
    fn interchange_reports_cross_json_ipc_boundaries() {
        let mut engine = None;
        let musicxml = handle(Request::ParseMusicxmlReport { xml: FIXTURE.into() }, &mut engine)
            .expect("MusicXML report request succeeds");
        assert_eq!(musicxml["format"], "musicxml");
        assert!(musicxml["score"]["parts"].as_array().is_some_and(|parts| !parts.is_empty()));

        let abc = handle(Request::ParseAbcReport { text: "X:1\nT:IPC ABC\nM:4/4\nL:1/4\nK:C\nC D E F |\n".into() }, &mut engine)
            .expect("ABC report request succeeds");
        assert_eq!(abc["format"], "abc");
        assert_eq!(abc["score"]["metadata"]["title"], "IPC ABC");

        let score = parse_musicxml(FIXTURE).expect("fixture parses");
        let midi = handle(Request::SerializeMidiReport { score }, &mut engine)
            .expect("MIDI report request succeeds");
        assert_eq!(midi["format"], "midi");
        assert!(midi["output"].as_array().is_some_and(|bytes| !bytes.is_empty()));
    }

    #[test]
    fn soundfont_metadata_crosses_json_ipc_boundary() {
        let mut engine = None;
        let value = handle(Request::InspectSoundfont {
            data: soundfont_fixture(false),
            provider_version: "test-provider".into(),
            bank: Some(0),
            program: Some(0),
        }, &mut engine)
        .expect("SoundFont metadata request succeeds");
        assert_eq!(value["contract_version"], 1);
        assert_eq!(value["format"], "sf2");
        assert_eq!(value["provider_version"], "test-provider");
        assert_eq!(value["preset"]["name"], "Piano");
        assert_eq!(value["preset_count"], 1);
        assert!(value["diagnostics"].as_array().is_some_and(|items| items.is_empty()));
    }

    #[test]
    fn soundfont_missing_preset_is_a_diagnostic_not_an_ipc_failure() {
        let mut engine = None;
        let value = handle(Request::InspectSoundfont {
            data: soundfont_fixture(false),
            provider_version: "test-provider".into(),
            bank: Some(0),
            program: Some(99),
        }, &mut engine)
        .expect("missing preset remains a valid metadata response");
        assert!(value["preset"].is_null());
        assert_eq!(value["diagnostics"][0], "missing-preset:0:99");
    }

    #[test]
    fn soundfont_decoder_action_renderer_boundary_preserves_fixture_event() {
        #[derive(Debug)]
        struct FixtureError;
        impl std::fmt::Display for FixtureError { fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { f.write_str("fixture error") } }
        impl std::error::Error for FixtureError {}
        struct FixtureDecoder;
        impl SampleDecoder for FixtureDecoder {
            type Error = FixtureError;
            fn decode(&self, _region: &SampleRegion) -> Result<DecodedSample, Self::Error> { DecodedSample::new(44_100, 1, vec![0, 8_192, -8_192, 0]).map_err(|_| FixtureError) }
        }
        struct FixtureRenderer { rendered: Vec<(u64, Option<String>, usize)> }
        impl SampleRenderer for FixtureRenderer {
            type Error = FixtureError;
            fn render(&mut self, sample: &DecodedSample, action: &SampleAction) -> Result<(), Self::Error> {
                if let SampleAction::Start { voice_id, event, .. } = action { self.rendered.push((*voice_id, event.address.clone(), sample.pcm_i16.len())); }
                Ok(())
            }
        }
        let region = SampleRegion { sample_id: 7, start_frame: 0, end_frame: 4, key_min: 60, key_max: 60, velocity_min: 1, velocity_max: 127, root_key: 60, fine_tune_cents: 0, attenuation_db: 0.0, sample_rate: 44_100, compression: acorde_soundfont::SampleCompression::Pcm16, loop_points: None, attack_secs: 0.0, decay_secs: 0.0, sustain_level: 1.0, release_secs: 0.1 };
        let event = PlaybackEvent { address: Some("0:0:0:0:0".into()), source: None, source_voice_number: None, time_beats: 0.0, time_secs: 0.0, pitch_midi: 60, pitch_midi_cents: 0, pitch_bend_curve: Vec::new(), post_note_pause_beats: 0.0, articulations: Vec::new(), chord_symbol: None, guitar_technique: None, velocity: 100, duration_beats: 1.0, duration_secs: 0.5, pedal: false, part_index: 0, channel: 0, program: 0, instrument_id: None, is_metronome: false };
        let action = schedule_sample_note_on(3, event, &region, 1.0).expect("fixture region schedules");
        let sample = FixtureDecoder.decode(&region).expect("fixture decoder returns bounded PCM");
        let mut renderer = FixtureRenderer { rendered: Vec::new() };
        renderer.render(&sample, &action).expect("fixture renderer accepts provider action");
        assert_eq!(renderer.rendered, vec![(3, Some("0:0:0:0:0".into()), 4)]);
    }

    #[test]
    fn acorde_v1_1_0_preset_zone_mapping_preserves_playback_address() {
        let region = SampleRegion { sample_id: 11, start_frame: 0, end_frame: 4, key_min: 60, key_max: 72, velocity_min: 1, velocity_max: 127, root_key: 60, fine_tune_cents: 0, attenuation_db: 0.0, sample_rate: 44_100, compression: acorde_soundfont::SampleCompression::Pcm16, loop_points: None, attack_secs: 0.0, decay_secs: 0.0, sustain_level: 1.0, release_secs: 0.1 };
        let zone = SoundFontPresetZone::new(0, 0, region).expect("valid preset zone");
        let event = PlaybackEvent { address: Some("0:0:1:1:0".into()), source: None, source_voice_number: None, time_beats: 0.0, time_secs: 0.0, pitch_midi: 64, pitch_midi_cents: 0, pitch_bend_curve: Vec::new(), post_note_pause_beats: 0.0, articulations: Vec::new(), chord_symbol: None, guitar_technique: None, velocity: 96, duration_beats: 1.0, duration_secs: 0.5, pedal: false, part_index: 0, channel: 0, program: 0, instrument_id: None, is_metronome: false };
        let action = schedule_preset_note_on(7, event, &[zone], 0, 0, 1.0).expect("preset zone schedules");
        match action { SampleAction::Start { voice_id, sample_id, event, .. } => { assert_eq!(voice_id, 7); assert_eq!(sample_id, 11); assert_eq!(event.address.as_deref(), Some("0:0:1:1:0")); }, _ => panic!("expected start action") }
    }

    #[test]
    fn acorde_v1_0_7_decodes_and_renders_sf2_pcm_fixture() {
        let mut sf2 = b"RIFFxxxxsfbk".to_vec();
        sf2.extend(b"LIST".as_slice());
        sf2.extend(20u32.to_le_bytes());
        sf2.extend(b"sdta".as_slice());
        sf2.extend(b"smpl".as_slice());
        sf2.extend(8u32.to_le_bytes());
        for value in [1000i16, -1000, 2000, -2000] { sf2.extend(value.to_le_bytes()); }
        let sample = decode_sf2_pcm16(&sf2, 0, 4, 2, 1).expect("acorde decodes SF2 PCM");
        let region = SampleRegion { sample_id: 9, start_frame: 0, end_frame: 4, key_min: 60, key_max: 60, velocity_min: 1, velocity_max: 127, root_key: 60, fine_tune_cents: 0, attenuation_db: 0.0, sample_rate: 2, compression: acorde_soundfont::SampleCompression::Pcm16, loop_points: None, attack_secs: 0.0, decay_secs: 0.0, sustain_level: 1.0, release_secs: 0.0 };
        let event = PlaybackEvent { address: Some("0:0:0:1:0".into()), source: None, source_voice_number: None, time_beats: 0.0, time_secs: 0.0, pitch_midi: 60, pitch_midi_cents: 0, pitch_bend_curve: Vec::new(), post_note_pause_beats: 0.0, articulations: Vec::new(), chord_symbol: None, guitar_technique: None, velocity: 127, duration_beats: 1.0, duration_secs: 1.0, pedal: false, part_index: 0, channel: 0, program: 0, instrument_id: None, is_metronome: false };
        let action = schedule_sample_note_on(4, event, &region, 1.0).expect("acorde schedules sample action");
        let rendered = render_sample_action(&sample, &action, 2).expect("acorde renders sample action");
        assert_eq!(rendered, vec![1000, -1000]);
    }

    #[test]
    fn soundfont_decode_request_crosses_engine_json_boundary() {
        let mut sf2 = b"RIFFxxxxsfbk".to_vec();
        sf2.extend(b"LIST".as_slice());
        sf2.extend(16u32.to_le_bytes());
        sf2.extend(b"sdta".as_slice());
        sf2.extend(b"smpl".as_slice());
        sf2.extend(4u32.to_le_bytes());
        for value in [123i16, -456] { sf2.extend(value.to_le_bytes()); }
        let mut engine = None;
        let value = handle(Request::DecodeSoundfontSample { format: "sf2".into(), data: sf2, start_frame: Some(0), end_frame: Some(2), sample_rate: 2, channels: 1 }, &mut engine).expect("decode request succeeds");
        assert_eq!(value["sample_rate"], 2);
        assert_eq!(value["channels"], 1);
        assert_eq!(value["pcm_i16"], serde_json::json!([123, -456]));
    }

    #[test]
    fn soundfont_sf3_decode_request_crosses_engine_json_boundary() {
        let value = handle(Request::DecodeSoundfontSample { format: "sf3".into(), data: include_bytes!("../../../acorde/tests/fixtures/synthetic.sf3").to_vec(), start_frame: None, end_frame: None, sample_rate: 8_000, channels: 2 }, &mut None).expect("SF3 decode request succeeds");
        assert_eq!(value["sample_rate"], 8_000);
        assert_eq!(value["channels"], 2);
        assert!(value["pcm_i16"].as_array().is_some_and(|samples| !samples.is_empty()));
    }

    fn soundfont_playback_event(key: u8, velocity: u8) -> PlaybackEvent {
        PlaybackEvent { address: Some("0:0:0:0:0".into()), source: None, source_voice_number: Some(1), time_beats: 0.0, time_secs: 0.0, pitch_midi: key, pitch_midi_cents: 0, pitch_bend_curve: Vec::new(), post_note_pause_beats: 0.0, articulations: Vec::new(), chord_symbol: None, guitar_technique: None, velocity, duration_beats: 1.0, duration_secs: 0.5, pedal: false, part_index: 0, channel: 0, program: 0, instrument_id: None, is_metronome: false }
    }

    #[test]
    fn materialized_sf2_prepares_real_pcm_for_the_web_audio_boundary() {
        let data = std::fs::read(concat!(env!("CARGO_MANIFEST_DIR"), "/../../acorde/tests/fixtures/UprightPianoKW-small-20190703.sf2")).expect("real CC0 SF2 fixture");
        let materialized = load_materialized(&data, "fixture-provider").expect("real SF2 materializes");
        let preset = materialized.asset.presets.first().expect("SF2 preset");
        let zone = materialized.zones().iter().find(|zone| zone.bank == preset.bank && zone.program == preset.program).expect("SF2 zone");
        let key = zone.region.key_min;
        let velocity = zone.region.velocity_min.max(1);
        let value = handle(Request::PrepareSoundfontPlayback { data, provider_version: "fixture-provider".into(), bank: preset.bank, program: preset.program, channels: 1, events: vec![soundfont_playback_event(key, velocity)] }, &mut None).expect("SF2 playback prep");
        assert_eq!(value["snapshot"]["format"], "Sf2");
        assert!(value["events"].as_array().is_some_and(|events| !events.is_empty()));
        assert!(value["events"][0]["soundfont_sample_key"].as_str().is_some());
        assert!(value["samples"].as_object().is_some_and(|samples| samples.values().any(|sample| sample["pcm"].as_array().is_some_and(|pcm| pcm.iter().any(|value| value.as_f64().is_some_and(|sample| sample != 0.0))))));
    }

    #[test]
    fn materialized_sf3_prepares_real_pcm_with_explicit_host_channel_layout() {
        let data = std::fs::read(concat!(env!("CARGO_MANIFEST_DIR"), "/../../acorde/tests/fixtures/FluidR3Mono_GM.sf3")).expect("real SF3 fixture");
        let materialized = load_materialized(&data, "fixture-provider").expect("real SF3 materializes");
        let zone = materialized.zones().first().expect("SF3 zone");
        let value = handle(Request::PrepareSoundfontPlayback { data, provider_version: "fixture-provider".into(), bank: zone.bank, program: zone.program, channels: 1, events: vec![soundfont_playback_event(zone.region.key_min, zone.region.velocity_min.max(1))] }, &mut None).expect("SF3 playback prep");
        assert_eq!(value["snapshot"]["format"], "Sf3");
        assert_eq!(value["channel_layout"], "host-supplied");
        assert!(value["events"].as_array().is_some_and(|events| !events.is_empty()));
        assert!(value["events"][0]["soundfont_sample_key"].as_str().is_some());
        assert!(value["samples"].as_object().is_some_and(|samples| samples.values().any(|sample| sample["pcm"].as_array().is_some_and(|pcm| pcm.iter().any(|value| value.as_f64().is_some_and(|sample| sample != 0.0))))));
    }

    #[test]
    fn svg_render_and_metadata_preserve_geometry_and_accessible_text() {
        let score = parse_musicxml(FIXTURE).expect("fixture parses");
        let svg = render_svg(&score, &SvgRenderOptions { width: 900.0, ..Default::default() })
            .expect("SVG renders");
        assert!(svg.starts_with("<svg"));
        assert!(svg.contains("width=\"900"));
        assert!(svg.contains("viewBox=\""));
        assert!(svg.contains("data-acorde-kind=\"note\""));

        let layout = compute_layout(&score, &LayoutConfig::default());
        let metadata = render_svg_metadata(&score, &layout, &SvgRenderOptions { width: 900.0, ..Default::default() })
            .expect("SVG metadata renders");
        assert_eq!(metadata.note_count, 2);
        assert_eq!(metadata.measure_count, 1);
        assert!(!metadata.accessible_text.is_empty());
    }

    #[test]
    fn notation_commands_cross_json_ipc_boundary() {
        let score = parse_musicxml(FIXTURE).expect("fixture parses");
        let mut engine = None;
        handle(Request::LoadScore { score }, &mut engine).expect("score loads");
        let command: Command = serde_json::from_value(serde_json::json!({
            "type": "set_dynamic",
            "part_index": 0,
            "staff_index": 0,
            "measure_index": 0,
            "voice": 0,
            "note_index": 0,
            "dynamic": "Mf"
        }))
        .expect("Composer command schema matches acorde");
        let value = handle(Request::ApplyCommand { command, label: Some("SetDynamic".into()) }, &mut engine)
            .expect("command applies");
        assert_eq!(value["parts"][0]["staves"][0]["measures"][0]["voices"][0][0]["dynamic"], "Mf");

        let clear_repeat: Command = serde_json::from_value(serde_json::json!({
            "type": "set_barline",
            "measure_index": 0,
            "side": "left",
            "barline": "Normal"
        }))
        .expect("Composer repeat-clear schema matches acorde");
        handle(Request::ApplyCommand { command: clear_repeat, label: Some("ClearBarline".into()) }, &mut engine)
            .expect("repeat clear command applies");

        let clear_ottava: Command = serde_json::from_value(serde_json::json!({
            "type": "set_ottava",
            "part_index": 0,
            "staff_index": 0,
            "measure_index": 0,
            "voice": 0,
            "note_index": 0,
            "ottava_start": null,
            "ottava_end": false
        }))
        .expect("Composer ottava-clear schema matches acorde");
        handle(Request::ApplyCommand { command: clear_ottava, label: Some("ClearOttava".into()) }, &mut engine)
            .expect("ottava clear command applies");
    }

    #[test]
    fn multi_voice_fixture_preserves_voice_structure_and_roundtrip() {
        let parsed = parse_musicxml_with_report(MULTI_VOICE_FIXTURE).expect("multi voice fixture parses");
        assert!(parsed.diagnostics.is_empty());
        let measure = &parsed.score.parts[0].staves[0].measures[0];
        assert!(measure.voices.len() >= 2);
        assert!(measure.voices[0].len() >= 2);
        assert!(measure.voices.iter().skip(1).any(|voice| !voice.is_empty()));

        let exported = serialize_musicxml_with_report(&parsed.score).expect("multi voice fixture serializes");
        assert!(exported.output.contains("<backup>"));
        assert!(exported.output.contains("<voice>1</voice>"));
        assert!(exported.output.contains("<voice>2</voice>"));
        let reparsed = parse_musicxml_with_report(&exported.output).expect("serialized multi voice XML reparses");
        let round_tripped = &reparsed.score.parts[0].staves[0].measures[0];
        assert_eq!(round_tripped.voices.len(), measure.voices.len());
        assert!(round_tripped.voices.iter().skip(1).flatten().any(|item| item.is_rest));
    }

    #[test]
    fn multi_voice_fixture_preserves_playback_addresses() {
        let parsed = parse_musicxml_with_report(MULTI_VOICE_FIXTURE).expect("multi voice fixture parses");
        let events = to_playback_events(&parsed.score, &PlaybackOptions::default());
        assert!(events.iter().any(|event| event.address.as_deref().is_some_and(|address| address.split(':').nth(3).is_some_and(|voice| voice != "0"))));
    }

    #[test]
    fn multi_voice_edit_keeps_source_voice_numbers_timing_and_playback_identity() {
        let parsed = parse_musicxml_with_report(MULTI_VOICE_FIXTURE).expect("multi voice fixture parses");
        let mut engine = None;
        handle(Request::LoadScore { score: parsed.score }, &mut engine).expect("multi voice score loads");
        let add_note: Command = serde_json::from_value(serde_json::json!({
            "type": "add_note", "part_index": 0, "staff_index": 0, "measure_index": 0,
            "voice": 1, "position": 1, "pitch": { "step": "D", "octave": 3, "alter": 0 },
            "duration": "Quarter", "dot_count": 0, "is_rest": false, "tuplet": null
        })).expect("voice two add-note command deserializes");
        handle(Request::ApplyCommand { command: add_note, label: Some("AddNote".into()) }, &mut engine).expect("voice two note inserts");
        let exported = handle(Request::SerializeCurrent, &mut engine).expect("edited score serializes");
        let xml = exported.as_str().expect("MusicXML string");
        assert!(xml.contains("<voice>1</voice>"));
        assert!(xml.contains("<voice>2</voice>"));
        assert!(xml.contains("<backup>"));
        let reparsed = parse_musicxml_with_report(xml).expect("edited MusicXML reparses");
        let measure = &reparsed.score.parts[0].staves[0].measures[0];
        assert_eq!(measure.source_voice_numbers[0], Some(1));
        assert_eq!(measure.source_voice_numbers[1], Some(2));
        let events = to_playback_events(&reparsed.score, &PlaybackOptions::default());
        assert!(events.iter().any(|event| event.source_voice_number == Some(2) && event.source.as_ref().is_some_and(|source| source.voice == 1)));
    }

    #[test]
    fn advanced_notation_commands_roundtrip_glissando_and_cross_staff() {
        let parsed = parse_musicxml_with_report(ADVANCED_NOTATION_FIXTURE).expect("advanced fixture parses");
        assert!(parsed.diagnostics.is_empty());
        assert_eq!(parsed.score.parts[0].staves.len(), 1);
        assert_eq!(parsed.score.parts[0].staves[0].measures[0].voices[1][0].cross_staff.as_ref().map(|value| value.target_staff), Some(1));
        let mut engine = None;
        handle(Request::LoadScore { score: parsed.score.clone() }, &mut engine).expect("advanced score loads");
        let glissando: Command = serde_json::from_value(serde_json::json!({
            "type": "set_glissando", "part_index": 0, "staff_index": 0, "measure_index": 0,
            "voice": 0, "note_index": 0, "start": true, "end": false
        })).expect("glissando command deserializes");
        handle(Request::ApplyCommand { command: glissando, label: Some("SetGlissando".into()) }, &mut engine).expect("glissando applies");
        let exported = handle(Request::SerializeCurrent, &mut engine).expect("edited advanced score serializes");
        let xml = exported.as_str().expect("serialized MusicXML string");
        assert!(xml.contains("<glissando"));
        assert!(xml.contains("<staff>2</staff>"));
        let reparsed = parse_musicxml_with_report(xml).expect("advanced XML reparses");
        let notes: Vec<_> = reparsed.score.parts.iter().flat_map(|part| part.staves.iter()).flat_map(|staff| staff.measures.iter()).flat_map(|measure| measure.voices.iter()).flat_map(|voice| voice.iter()).collect();
        assert!(notes.iter().any(|note| note.glissando_start));
        assert!(notes.iter().any(|note| note.cross_staff.as_ref().map(|value| value.target_staff) == Some(1)));
    }

    #[test]
    fn typed_spanner_update_remove_and_undo_cross_the_composer_engine_boundary() {
        let parsed = parse_musicxml_with_report(ADVANCED_NOTATION_FIXTURE).expect("typed spanner fixture parses");
        let mut updated = parsed.score.spanners.first().expect("fixture has a typed spanner").clone();
        updated.text = Some("port.".into());
        updated.line_type = Some("wavy".into());
        let mut engine = None;
        handle(Request::LoadScore { score: parsed.score }, &mut engine).expect("typed spanner score loads");
        let update: Command = serde_json::from_value(serde_json::json!({ "type": "update_spanner", "spanner": updated })).expect("update spanner command deserializes");
        handle(Request::ApplyCommand { command: update, label: Some("UpdateSpanner".into()) }, &mut engine).expect("spanner update applies");
        let updated_xml = handle(Request::SerializeCurrent, &mut engine).expect("updated spanner serializes");
        assert!(updated_xml.as_str().is_some_and(|xml| xml.contains("port.") && xml.contains("line-type=\"wavy\"")));
        handle(Request::Undo, &mut engine).expect("spanner update undoes");
        let restored_xml = handle(Request::SerializeCurrent, &mut engine).expect("restored spanner serializes");
        assert!(restored_xml.as_str().is_some_and(|xml| xml.contains("gliss.") && !xml.contains("port.")));
        handle(Request::Redo, &mut engine).expect("spanner update redoes");
        let remove: Command = serde_json::from_value(serde_json::json!({ "type": "remove_spanner", "id": updated.id })).expect("remove spanner command deserializes");
        let removed = handle(Request::ApplyCommand { command: remove, label: Some("RemoveSpanner".into()) }, &mut engine).expect("spanner removal applies");
        assert!(removed["spanners"].as_array().is_some_and(Vec::is_empty));
        let restored = handle(Request::Undo, &mut engine).expect("spanner removal undoes");
        assert!(restored["spanners"].as_array().is_some_and(|spanners| spanners.len() == 1 && spanners[0]["text"] == "port."));
        let reloaded = handle(Request::SerializeCurrent, &mut engine).expect("restored updated spanner serializes");
        assert!(reloaded.as_str().is_some_and(|xml| xml.contains("port.") && xml.contains("<glissando")));
    }

    #[test]
    fn advanced_notation_svg_contains_glissando_and_accessible_geometry() {
        let parsed = parse_musicxml(ADVANCED_NOTATION_FIXTURE).expect("advanced fixture parses for SVG");
        let svg = render_svg(&parsed, &SvgRenderOptions { width: 1200.0, ..Default::default() }).expect("advanced SVG renders");
        assert!(svg.contains("acorde-glissando"));
        assert!(svg.contains("data-acorde-kind=\"note\""));
        assert!(svg.contains("viewBox=\""));
        let layout = compute_layout(&parsed, &LayoutConfig::default());
        let metadata = render_svg_metadata(&parsed, &layout, &SvgRenderOptions { width: 1200.0, ..Default::default() }).expect("advanced SVG metadata renders");
        assert!(metadata.note_count >= 3);
        assert!(!metadata.accessible_text.is_empty());
    }

    #[test]
    fn adaptive_current_render_survives_measure_growth_and_narrow_widths() {
        let score = parse_musicxml(FIXTURE).expect("adaptive render fixture parses");
        let mut engine = None;
        handle(Request::LoadScore { score }, &mut engine).expect("adaptive render fixture loads");
        for after_index in 0..99 {
            let command: Command = serde_json::from_value(serde_json::json!({
                "type": "add_measure", "after_index": after_index
            }))
            .expect("add-measure command deserializes");
            handle(Request::ApplyCommand { command, label: Some("AddMeasure".into()) }, &mut engine)
                .expect("measure growth remains valid");
            if after_index == 2 {
                let four_measures = current_engine(&engine).expect("four-measure score stays loaded");
                assert_eq!(four_measures.score.parts[0].staves[0].measures.len(), 4);
                let svg = render_current_adaptive(&four_measures.score, 560.0, 10.0, 4, true)
                    .expect("fourth measure does not trigger a width allocation failure");
                assert!(svg.contains("<svg"));
            }
        }
        let state = current_engine(&engine).expect("grown score stays loaded");
        assert_eq!(state.score.parts[0].staves[0].measures.len(), 100);
        for width in [560.0, 699.0, 700.0, 900.0, 1200.0, 1600.0] {
            let svg = render_current_adaptive(&state.score, width, 10.0, 4, true)
                .expect("adaptive density renders a 100-measure score");
            assert!(svg.contains("<svg"));
        }
        for measure_index in (50..100).rev() {
            let command: Command = serde_json::from_value(serde_json::json!({
                "type": "delete_measure", "measure_index": measure_index
            }))
            .expect("delete-measure command deserializes");
            handle(
                Request::ApplyCommand {
                    command,
                    label: Some("DeleteMeasure".into()),
                },
                &mut engine,
            )
            .expect("measure deletion remains valid");
        }
        let reduced = current_engine(&engine).expect("reduced score stays loaded");
        assert_eq!(reduced.score.parts[0].staves[0].measures.len(), 50);
        let svg = render_current_adaptive(&reduced.score, 560.0, 10.0, 4, true)
            .expect("reduced score renders at the narrow boundary");
        assert!(svg.contains("<svg"));

        handle(Request::Undo, &mut engine).expect("measure deletion undoes");
        let restored = current_engine(&engine).expect("undo keeps score loaded");
        assert_eq!(restored.score.parts[0].staves[0].measures.len(), 51);
        let svg = render_current_adaptive(&restored.score, 900.0, 10.0, 4, true)
            .expect("undone score renders without corrupting history");
        assert!(svg.contains("<svg"));
    }
}
