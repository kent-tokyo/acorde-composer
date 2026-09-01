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
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
enum Request {
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

fn handle(request: Request, engine: &mut Option<ScoreEngine>) -> Result<serde_json::Value, String> {
    match request {
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
                ..Default::default()
            };
            render_svg(&score, &options)
                .map(serde_json::Value::String)
                .map_err(|error| error.to_string())
        }
        Request::RenderSvgMetadata { score, width, staff_size, measures_per_system, interactive } => {
            let options = SvgRenderOptions { width: width.unwrap_or(900.0), staff_size: staff_size.unwrap_or(10.0), measures_per_system: measures_per_system.unwrap_or(4), interactive: interactive.unwrap_or(true), ..Default::default() };
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
        Request::RenderCurrent { width } => {
            let state = current_engine(engine)?;
            let options = SvgRenderOptions {
                width: width.unwrap_or(900.0),
                ..Default::default()
            };
            render_svg(&state.score, &options)
                .map(serde_json::Value::String)
                .map_err(|error| error.to_string())
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
        serde_json::to_writer(&mut stdout, &response).expect("write response");
        stdout.write_all(b"\n").expect("write newline");
        stdout.flush().expect("flush response");
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
    <backup><duration>1920</duration></backup>
    <note><rest/><duration>1920</duration><voice>2</voice><type>whole</type></note>
  </measure></part>
</score-partwise>"#;

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
    #[ignore = "blocked by acorde issue #2: MusicXML parser currently flattens voices"]
    fn multi_voice_fixture_preserves_voice_structure_and_playback_addresses() {
        let parsed = parse_musicxml_with_report(MULTI_VOICE_FIXTURE).expect("multi voice fixture parses");
        assert!(parsed.diagnostics.is_empty());
        let measure = &parsed.score.parts[0].staves[0].measures[0];
        assert!(measure.voices.len() >= 2);
        assert!(measure.voices[0].len() >= 2);
        assert!(measure.voices.iter().skip(1).any(|voice| !voice.is_empty()));

        let exported = serialize_musicxml_with_report(&parsed.score).expect("multi voice fixture serializes");
        let reparsed = parse_musicxml_with_report(&exported.output).expect("serialized multi voice XML reparses");
        let round_tripped = &reparsed.score.parts[0].staves[0].measures[0];
        assert_eq!(round_tripped.voices.len(), measure.voices.len());
        assert!(round_tripped.voices.iter().skip(1).flatten().any(|item| item.is_rest));

        let events = to_playback_events(&parsed.score, &PlaybackOptions::default());
        assert!(events.iter().any(|event| event.address.as_deref().is_some_and(|address| address.split(':').nth(3).is_some_and(|voice| voice != "0"))));
    }
}
