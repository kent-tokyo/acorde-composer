/**
 * JavaScript-visible wrapper around `acorde_core::ScoreEngine`.
 *
 * All Score and Command values are passed as JSON strings.
 */
export class ScoreEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScoreEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scoreengine_free(ptr, 0);
    }
    /**
     * Add a new staff to an existing part. Returns a [`ChangeHint`] JSON string.
     *
     * `clef`: `"Treble"` / `"Bass"` / `"Alto"` / `"Tenor"` / `"Percussion"`.
     * @param {number} part_index
     * @param {string} clef
     * @returns {string}
     */
    add_staff(part_index, clef) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(clef, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_add_staff(this.__wbg_ptr, part_index, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Apply a command (JSON string). Returns a [`ChangeHint`] JSON string on success.
     * @param {string} cmd_json
     * @returns {string}
     */
    apply(cmd_json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(cmd_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_apply(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Apply multiple commands as a single undoable batch. Returns a [`ChangeHint`] JSON string.
     * @param {string} cmds_json
     * @returns {string}
     */
    apply_batch(cmds_json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(cmds_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_apply_batch(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Apply multiple commands as a single undoable batch with an explicit label.
     *
     * The `label` is used as the undo/redo key (e.g. `"ApplyAI"`, `"PasteSelection"`).
     * @param {string} cmds_json
     * @param {string} label
     * @returns {string}
     */
    apply_batch_labeled(cmds_json, label) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(cmds_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_apply_batch_labeled(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Begin a slur at `start`. Must be followed by `end_slur` to complete it.
     *
     * `start_json`: JSON-encoded `NoteAddr`.
     * @param {string} start_json
     */
    begin_slur(start_json) {
        const ptr0 = passStringToWasm0(start_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.scoreengine_begin_slur(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Copy a range of voice measures into the range clipboard.
     *
     * `start_json` / `end_json` are JSON-encoded `NoteAddr` objects.
     * `start` and `end` must share the same `part`, `staff`, and `voice`.
     * @param {string} start_json
     * @param {string} end_json
     */
    copy_range(start_json, end_json) {
        const ptr0 = passStringToWasm0(start_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(end_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.scoreengine_copy_range(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Copy a voice into the engine's clipboard.
     * @param {number} part_index
     * @param {number} staff_index
     * @param {number} measure_index
     * @param {number} voice_index
     */
    copy_voice(part_index, staff_index, measure_index, voice_index) {
        const ret = wasm.scoreengine_copy_voice(this.__wbg_ptr, part_index, staff_index, measure_index, voice_index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Delete a staff from a part. Fails if it is the last remaining staff.
     * Returns a [`ChangeHint`] JSON string.
     * @param {number} part_index
     * @param {number} staff_index
     * @returns {string}
     */
    delete_staff(part_index, staff_index) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_delete_staff(this.__wbg_ptr, part_index, staff_index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Complete a slur that was started with `begin_slur`. Returns a [`ChangeHint`] JSON string.
     *
     * `end_json`: JSON-encoded `NoteAddr`. Returns an error if `begin_slur` was not called first.
     * @param {string} end_json
     * @returns {string}
     */
    end_slur(end_json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(end_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_end_slur(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Export the command history as a JSON string for crash recovery or replay.
     *
     * The result can be stored and later restored with [`restore_history`].
     * @returns {string}
     */
    export_history() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_export_history(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * i18n key of the next redoable command, or `undefined`.
     * @returns {string | undefined}
     */
    get_redo_key() {
        const ret = wasm.scoreengine_get_redo_key(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Label of the next redoable command, or `undefined` if nothing to redo.
     * @returns {string | undefined}
     */
    get_redo_label() {
        const ret = wasm.scoreengine_get_redo_label(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Return the current score as a JSON string.
     * @returns {string}
     */
    get_score() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_get_score(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * i18n key of the next undoable command (e.g. `"SetTempo"`), or `undefined`.
     * @returns {string | undefined}
     */
    get_undo_key() {
        const ret = wasm.scoreengine_get_undo_key(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Label of the next undoable command, or `undefined` if nothing to undo.
     * @returns {string | undefined}
     */
    get_undo_label() {
        const ret = wasm.scoreengine_get_undo_label(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Return the current undo/redo version counter.
     * @returns {bigint}
     */
    get_version() {
        const ret = wasm.scoreengine_get_version(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Create a new engine with a default score.
     */
    constructor() {
        const ret = wasm.scoreengine_new();
        this.__wbg_ptr = ret;
        ScoreEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Paste the range clipboard at `target` (undo-able). Returns a [`ChangeHint`] JSON string.
     * @param {string} target_json
     * @returns {string}
     */
    paste_range(target_json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(target_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_paste_range(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Paste the clipboard into a voice (undo-able). Returns a [`ChangeHint`] JSON string.
     * @param {number} part_index
     * @param {number} staff_index
     * @param {number} measure_index
     * @param {number} voice_index
     * @returns {string}
     */
    paste_voice(part_index, staff_index, measure_index, voice_index) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_paste_voice(this.__wbg_ptr, part_index, staff_index, measure_index, voice_index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Redo the last undone command. Returns a [`ChangeHint`] JSON string on success.
     * @returns {string}
     */
    redo() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_redo(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Replace the entire score (JSON string).
     * @param {string} score_json
     */
    replace_score(score_json) {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.scoreengine_replace_score(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Respell all pitches in the score (undo-able). Returns a [`ChangeHint`] JSON string.
     *
     * `prefer_flat`: when `true` uses flat spellings (e.g. Db instead of C#).
     * @param {boolean} prefer_flat
     * @returns {string}
     */
    respell_score(prefer_flat) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_respell_score(this.__wbg_ptr, prefer_flat);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Respell all pitches to match the key signature (undo-able). Returns a [`ChangeHint`] JSON string.
     * @returns {string}
     */
    respell_score_to_key() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_respell_score_to_key(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Restore an engine from a previously exported history JSON string.
     *
     * Replays all commands against the initial score. Returns an error if replay fails.
     * @param {string} json
     */
    restore_history(json) {
        const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.scoreengine_restore_history(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set or clear the arpeggio direction on a note (undo-able). Returns a [`ChangeHint`] JSON string.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `direction_json`: `"true"` (up) | `"false"` (down) | `"null"` (clear).
     * @param {string} addr_json
     * @param {string} direction_json
     * @returns {string}
     */
    set_arpeggio(addr_json, direction_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(direction_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_arpeggio(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Set or clear the cue flag on a note. Cue notes have zero beats.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `is_cue`: `true` to mark as cue, `false` to clear.
     * @param {string} addr_json
     * @param {boolean} is_cue
     * @returns {string}
     */
    set_cue(addr_json, is_cue) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_cue(this.__wbg_ptr, ptr0, len0, is_cue);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Set the duration and dot count on a note (undo-able). Returns a [`ChangeHint`] JSON string.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `duration_json`: JSON-encoded `Duration` such as `"Quarter"`.
     * @param {string} addr_json
     * @param {string} duration_json
     * @param {number} dot_count
     * @returns {string}
     */
    set_duration(addr_json, duration_json, dot_count) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(duration_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_duration(this.__wbg_ptr, ptr0, len0, ptr1, len1, dot_count);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Set the note head shape on a note.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `note_head_json`: JSON-encoded `NoteHead` (e.g. `"\"Diamond\""`, `"\"Normal\""`).
     * @param {string} addr_json
     * @param {string} note_head_json
     * @returns {string}
     */
    set_note_head(addr_json, note_head_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(note_head_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_note_head(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Set or clear the stem direction on a note (undo-able). Returns a [`ChangeHint`] JSON string.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `stem_up_json`: `"true"` (up) | `"false"` (down) | `"null"` (auto).
     * @param {string} addr_json
     * @param {string} stem_up_json
     * @returns {string}
     */
    set_stem(addr_json, stem_up_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(stem_up_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_stem(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Set or clear the tuplet on a note (undo-able). Returns a [`ChangeHint`] JSON string.
     *
     * `addr_json`: JSON-encoded `NoteAddr`.
     * `tuplet_json`: JSON-encoded `TupletInfo`, or `"null"` to clear.
     * @param {string} addr_json
     * @param {string} tuplet_json
     * @returns {string}
     */
    set_tuplet(addr_json, tuplet_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(tuplet_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_tuplet(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Set or clear the unpitched flag while retaining display placement.
     * @param {string} addr_json
     * @param {boolean} is_unpitched
     * @returns {string}
     */
    set_unpitched(addr_json, is_unpitched) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(addr_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_set_unpitched(this.__wbg_ptr, ptr0, len0, is_unpitched);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Toggle slur between two notes. Returns a [`ChangeHint`] JSON string.
     *
     * `start_json` and `end_json` are JSON-encoded `NoteAddr` objects.
     * @param {string} start_json
     * @param {string} end_json
     * @returns {string}
     */
    toggle_slur(start_json, end_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(start_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(end_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_toggle_slur(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Toggle a trill line span between two notes.
     *
     * `start_json` / `end_json`: JSON-encoded `NoteAddr`.
     * @param {string} start_json
     * @param {string} end_json
     * @returns {string}
     */
    toggle_trill_line(start_json, end_json) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(start_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(end_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.scoreengine_toggle_trill_line(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Undo the last command. Returns a [`ChangeHint`] JSON string on success.
     * @returns {string}
     */
    undo() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.scoreengine_undo(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
if (Symbol.dispose) ScoreEngine.prototype[Symbol.dispose] = ScoreEngine.prototype.free;

/**
 * Return the schema-versioned analysis cache key for a score JSON string.
 * @param {string} score_json
 * @returns {string}
 */
export function analysis_cache_key(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.analysis_cache_key(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Rank a score's non-percussion parts by mean pitch for accordion arrangement.
 * Returns JSON `{ candidates: [{part_index, name, mean_pitch}], ambiguous }`.
 * `ambiguous` is true when the top two candidates' mean pitch is within 3
 * semitones — the caller should offer a right-hand-part picker.
 * @param {string} score_json
 * @returns {string}
 */
export function analyze_for_accordion(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.analyze_for_accordion(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Analyze chord labels, adjacent melodic intervals, and major/minor key candidates.
 *
 * Every result includes stable `NoteAddr` evidence and a rule identifier. Key estimation
 * preserves all tied best candidates rather than inventing a single answer.
 * @param {string} score_json
 * @returns {string}
 */
export function analyze_score(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.analyze_score(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Apply a JSON array produced by [`score_patch`] to a score and return the patched score JSON.
 * The input score is never modified.
 * @param {string} score_json
 * @param {string} patches_json
 * @returns {string}
 */
export function apply_score_patch(score_json, patches_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(patches_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.apply_score_patch(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Arrange a score onto a 2-staff accordion part (treble = right hand,
 * bass = left hand), reassigned to the Accordion GM program and
 * octave-fit to its practical range. Returns JSON `{ score, notes }`
 * where `notes` are human-readable messages about choices made.
 *
 * `right_hand_part_index`: pass a non-negative index to force that part
 * onto the treble staff, or `-1` for the automatic mean-pitch ranking
 * from [`analyze_for_accordion`].
 * @param {string} score_json
 * @param {number} right_hand_part_index
 * @returns {string}
 */
export function arrange_for_accordion(score_json, right_hand_part_index) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.arrange_for_accordion(ptr0, len0, right_hand_part_index);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Assign deterministic string/fret positions to eligible tablature notes.
 *
 * Existing positions, rests, chords, and notes outside the configured 0–24 fret
 * range are preserved unchanged. Returns the updated score JSON.
 * @param {string} score_json
 * @returns {string}
 */
export function assign_tablature_positions(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.assign_tablature_positions(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Find the scale that best fits a set of pitches.
 *
 * `pitches_json`: JSON array of `Pitch` objects.
 * Returns a JSON `Scale` object (`{"root":{…},"kind":"Major"}`) or JSON `null` if the array
 * is empty.
 * @param {string} pitches_json
 * @returns {string}
 */
export function best_fit_scale(pitches_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(pitches_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.best_fit_scale(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * MIDI note number of the middle staff line for a `Clef` JSON value.
 *
 * Used for stem direction heuristics. Treble=71 (B4), Bass=50 (D3), Alto=60 (C4),
 * Tenor=57 (A3), Percussion=71.
 * @param {string} clef_json
 * @returns {number}
 */
export function clef_middle_line_midi(clef_json) {
    const ptr0 = passStringToWasm0(clef_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.clef_middle_line_midi(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Return the stable i18n key for a JSON-encoded `Command`.
 *
 * Returns strings like `"AddNote"`, `"SetTempo"`, etc.
 * Use this to look up translations without hard-coding English labels.
 * @param {string} cmd_json
 * @returns {string}
 */
export function command_key_from_json(cmd_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(cmd_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.command_key_from_json(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Compute recommended `BeamState` values for a voice's notes.
 *
 * Groups beamable notes (eighth or shorter, non-rest) within beat boundaries
 * derived from the time signature. Returns a JSON array of `BeamState` strings.
 *
 * `notes_json`: JSON array of `Note` objects (a full voice).
 * `time_sig_json`: JSON-encoded `TimeSignature`.
 * @param {string} notes_json
 * @param {string} time_sig_json
 * @returns {string}
 */
export function compute_beams(notes_json, time_sig_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(notes_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(time_sig_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.compute_beams(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Compute layout for a score (JSON string) and return the result as a JSON string.
 *
 * `measures_per_row` defaults to 4 when 0 is passed.
 * `concert_pitch` when true populates `concert_key_overrides` in the result.
 * @param {string} score_json
 * @param {number} measures_per_row
 * @param {boolean} concert_pitch
 * @returns {string}
 */
export function compute_layout(score_json, measures_per_row, concert_pitch) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.compute_layout(ptr0, len0, measures_per_row, concert_pitch);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Compute layout with a full JSON [`LayoutConfig`].
 *
 * Config example: `{"measures_per_row":4,"concert_pitch":false,"first_row_measures":3}`
 * Use this instead of `compute_layout` when you need `first_row_measures`.
 * @param {string} score_json
 * @param {string} config_json
 * @returns {string}
 */
export function compute_layout_ex(score_json, config_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.compute_layout_ex(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Map `elapsed_secs` to a `PlaybackPosition` JSON object (`{measure_index, beat}`).
 *
 * Returns JSON `null` when `elapsed_secs` is negative or past the end of the score.
 * Pass the same `options_json` used for `to_playback_events_ex` for consistency.
 * @param {string} score_json
 * @param {string} options_json
 * @param {number} elapsed_secs
 * @returns {string}
 */
export function compute_playback_position(score_json, options_json, elapsed_secs) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.compute_playback_position(ptr0, len0, ptr1, len1, elapsed_secs);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Detect the chord name from a JSON array of `Pitch` objects.
 *
 * Returns a `ChordSymbol` JSON object, or JSON `null` if fewer than 2 pitches are
 * provided or no template matches.
 * Inversions are detected automatically; slash-chord bass is set when applicable.
 * @param {string} pitches_json
 * @returns {string}
 */
export function detect_chord(pitches_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(pitches_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.detect_chord(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Compute the diff between two scores. Returns a JSON array of `ScoreChange` objects.
 * @param {string} score_a_json
 * @param {string} score_b_json
 * @returns {string}
 */
export function diff_scores(score_a_json, score_b_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_a_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(score_b_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.diff_scores(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Extract a single part (0-based) from a score.
 * @param {string} score_json
 * @param {number} part_index
 * @returns {string}
 */
export function extract_part(score_json, part_index) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.extract_part(ptr0, len0, part_index);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Return the General MIDI percussion instrument name for a MIDI note number (35–81).
 * Returns `"Unknown Drum"` outside the standard range.
 * @param {number} note
 * @returns {string}
 */
export function gm_drum_name(note) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.gm_drum_name(note);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Return the General MIDI Level 1 program name for a 0-based program number.
 * Returns `"Unknown"` for values >= 128.
 * @param {number} program
 * @returns {string}
 */
export function gm_program_name(program) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.gm_program_name(program);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Compute the signed chromatic interval from `pitch1` to `pitch2`.
 *
 * Returns an `Interval` JSON object with fields `semitones` (signed i16) and a
 * `display` string such as `"P5"`, `"M3"`, `"m7"`.
 * @param {string} pitch1_json
 * @param {string} pitch2_json
 * @returns {string}
 */
export function interval_between(pitch1_json, pitch2_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(pitch1_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(pitch2_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.interval_between(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Return the accidental alter (`-1`, `0`, or `+1`) for a diatonic step in a key signature.
 *
 * `step_char`: single letter `"C"`, `"D"`, `"E"`, `"F"`, `"G"`, `"A"`, or `"B"` (case-insensitive).
 * @param {string} key_json
 * @param {string} step_char
 * @returns {number}
 */
export function key_alter_for_step(key_json, step_char) {
    const ptr0 = passStringToWasm0(key_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(step_char, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.key_alter_for_step(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * True if `pitch` is diatonic to the given key signature (octave-independent).
 * @param {string} key_json
 * @param {string} pitch_json
 * @returns {boolean}
 */
export function key_contains_pitch(key_json, pitch_json) {
    const ptr0 = passStringToWasm0(key_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(pitch_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.key_contains_pitch(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Human-readable key name: `"C major"`, `"G major"`, `"F# minor"`, `"Bb major"` etc.
 * @param {string} key_json
 * @returns {string}
 */
export function key_display_name(key_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(key_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.key_display_name(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Return the number of beats available in a voice before the measure is full (≥ 0.0).
 *
 * Correctly accounts for tuplet scaling via `Note::beats()`.
 * Returns an error if any index is out of range.
 * @param {string} score_json
 * @param {number} part_index
 * @param {number} staff_index
 * @param {number} measure_index
 * @param {number} voice_index
 * @returns {number}
 */
export function measure_beats_remaining(score_json, part_index, staff_index, measure_index, voice_index) {
    const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.measure_beats_remaining(ptr0, len0, part_index, staff_index, measure_index, voice_index);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Merge two scores: append parts of `score_b` into `score_a`.
 * @param {string} score_a_json
 * @param {string} score_b_json
 * @returns {string}
 */
export function merge_scores(score_a_json, score_b_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_a_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(score_b_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.merge_scores(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Parse an ABC Notation string and return the score as JSON.
 * @param {string} text
 * @returns {string}
 */
export function parse_abc(text) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_abc(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse ABC Notation and return an ImportReport JSON string.
 * @param {string} text
 * @returns {string}
 */
export function parse_abc_report(text) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_abc_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse the documented MEI subset and return the score as a JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_mei(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mei(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse the documented MEI subset and return an ImportReport JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_mei_report(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mei_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MIDI file (byte array) and return the score as a JSON string.
 * @param {Uint8Array} data
 * @returns {string}
 */
export function parse_midi(data) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_midi(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse MIDI and return an ImportReport JSON string.
 * @param {Uint8Array} data
 * @returns {string}
 */
export function parse_midi_report(data) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_midi_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MuseScore .mscx XML string and return the score as a JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_mscx(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mscx(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MuseScore .mscx XML document and return an ImportReport JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_mscx_report(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mscx_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MuseScore .mscz ZIP file (byte array) and return the score as a JSON string.
 * @param {Uint8Array} data
 * @returns {string}
 */
export function parse_mscz(data) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mscz(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MuseScore .mscz archive and return an ImportReport JSON string.
 * @param {Uint8Array} data
 * @returns {string}
 */
export function parse_mscz_report(data) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mscz_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a MusicXML string and return the score as a JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_musicxml(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_musicxml(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse MusicXML and return an [`acorde_io::ImportReport`] JSON string.
 * @param {string} xml
 * @returns {string}
 */
export function parse_musicxml_report(xml) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(xml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_musicxml_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Parse a compressed MXL file (byte array) and return the score as a JSON string.
 * @param {Uint8Array} data
 * @returns {string}
 */
export function parse_mxl(data) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parse_mxl(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Convert a MIDI note number (0–127) to a `Pitch` JSON object.
 *
 * `prefer_flat`: `true` = Db/Eb/Gb/Ab/Bb spelling; `false` = C#/D#/F#/G#/A#.
 * @param {number} midi
 * @param {boolean} prefer_flat
 * @returns {string}
 */
export function pitch_from_midi(midi, prefer_flat) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ret = wasm.pitch_from_midi(midi, prefer_flat);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Parse scientific pitch notation (`"C4"`, `"F#5"`, `"Bb3"`) into a `Pitch` JSON object.
 *
 * Returns an error if the string cannot be parsed.
 * @param {string} s
 * @returns {string}
 */
export function pitch_from_str(s) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pitch_from_str(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Return deterministic SVG dimensions and NoteAddr-keyed hit-test bounds.
 * @param {string} score_json
 * @param {string} layout_json
 * @param {string} options_json
 * @returns {string}
 */
export function render_score_metadata(score_json, layout_json, options_json) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(layout_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.render_score_metadata(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Render a score (JSON string) to an SVG string.
 *
 * `options_json` is a (partial) [`acorde_render_svg::SvgRenderOptions`] JSON object, e.g.
 * `{"width":900,"staff_size":24,"measures_per_system":4,"interactive":true}` — every field
 * has a default, so `"{}"` renders with defaults. This calls the exact same
 * `acorde_render_svg::render_svg` used natively — no browser/DOM-specific code path.
 * @param {string} score_json
 * @param {string} options_json
 * @returns {string}
 */
export function render_score_svg(score_json, options_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.render_score_svg(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Render one system row from a precomputed layout. `row` is zero-based.
 * @param {string} score_json
 * @param {string} layout_json
 * @param {number} row
 * @param {string} options_json
 * @returns {string}
 */
export function render_score_svg_row(score_json, layout_json, row, options_json) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(layout_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.render_score_svg_row(ptr0, len0, ptr1, len1, row, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Render a score using a layout computed by [`compute_layout_ex`].
 * @param {string} score_json
 * @param {string} layout_json
 * @param {string} options_json
 * @returns {string}
 */
export function render_score_svg_with_layout(score_json, layout_json, options_json) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(layout_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.render_score_svg_with_layout(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * Respell all pitches in a score (no undo). Returns the modified score as a JSON string.
 *
 * `prefer_flat`: when `true` uses flat spellings (e.g. Db instead of C#).
 * @param {string} score_json
 * @param {boolean} prefer_flat
 * @returns {string}
 */
export function respell_score(score_json, prefer_flat) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.respell_score(ptr0, len0, prefer_flat);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Respell all pitches to match the score's key signature (no undo).
 *
 * Flat-key signatures use flat spellings; sharp-key and C major use sharps.
 * @param {string} score_json
 * @returns {string}
 */
export function respell_score_to_key(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.respell_score_to_key(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Return the Roman numeral analysis of a chord in the context of a key.
 *
 * `chord_json`: JSON-encoded `ChordSymbol` (e.g. `{"root":"G","kind":"dominant","bass":null}`).
 * `key_json`: JSON-encoded `KeySignature` (e.g. `{"fifths":0,"mode":"major"}`).
 * Returns a JSON string such as `"V7"`, `"ii"`, `"viio"`, or JSON `null` if the chord root
 * falls outside the key's scale.
 * @param {string} chord_json
 * @param {string} key_json
 * @returns {string}
 */
export function roman_numeral(chord_json, key_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(chord_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(key_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.roman_numeral(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Return the total duration of a score in seconds (uses score tempo and repeat structure).
 * @param {string} score_json
 * @returns {number}
 */
export function score_duration_secs(score_json) {
    const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.score_duration_secs(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Duration in seconds for measures `start_measure..=end_measure` (0-based, inclusive).
 *
 * Useful for computing progress-bar lengths when `loop_region` is active.
 * @param {string} score_json
 * @param {number} start_measure
 * @param {number} end_measure
 * @returns {number}
 */
export function score_duration_secs_region(score_json, start_measure, end_measure) {
    const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.score_duration_secs_region(ptr0, len0, start_measure, end_measure);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Compute portable patch operations between two scores. The returned JSON array can be stored,
 * transmitted, and applied later with [`apply_score_patch`].
 * @param {string} score_a_json
 * @param {string} score_b_json
 * @returns {string}
 */
export function score_patch(score_a_json, score_b_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_a_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(score_b_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.score_patch(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Compute statistics for a score (JSON string).
 *
 * Returns a `ScoreStats` JSON object with fields:
 * `measure_count`, `note_count`, `rest_count`, `part_count`, `estimated_duration_secs`.
 * @param {string} score_json
 * @returns {string}
 */
export function score_statistics(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.score_statistics(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Select one authored fingering candidate without modifying the score.
 *
 * `policy` accepts `source-order`, `lowest`, or `highest`. The result is a
 * JSON number, or `null` when the addressed note has no fingering candidates.
 * @param {string} score_json
 * @param {number} part
 * @param {number} staff
 * @param {number} measure
 * @param {number} voice
 * @param {number} note
 * @param {string} policy
 * @returns {string}
 */
export function select_fingering(score_json, part, staff, measure, voice, note, policy) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(policy, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.select_fingering(ptr0, len0, part, staff, measure, voice, note, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Serialize a score (JSON string) to ABC Notation.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_abc(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_abc(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score to ABC Notation and return an ExportReport JSON string.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_abc_report(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_abc_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score to the documented MEI subset.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_mei(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_mei(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score to MEI and return an ExportReport JSON string.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_mei_report(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_mei_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score (JSON string) to MIDI bytes (`Uint8Array` in JS).
 * @param {string} score_json
 * @returns {Uint8Array}
 */
export function serialize_midi(score_json) {
    const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.serialize_midi(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * Serialize a region of a score to MIDI bytes.
 *
 * Only measures with physical index in `[start_measure, end_measure]` are exported.
 * The MIDI file starts at tick 0 regardless of the region offset.
 * @param {string} score_json
 * @param {number} start_measure
 * @param {number} end_measure
 * @returns {Uint8Array}
 */
export function serialize_midi_region(score_json, start_measure, end_measure) {
    const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.serialize_midi_region(ptr0, len0, start_measure, end_measure);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * Serialize a score to MIDI and return an ExportReport JSON string.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_midi_report(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_midi_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score (JSON string) to MusicXML.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_musicxml(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_musicxml(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Serialize a score to MusicXML and return an [`acorde_io::ExportReport`] JSON string.
 * @param {string} score_json
 * @returns {string}
 */
export function serialize_musicxml_report(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.serialize_musicxml_report(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Suggest stem direction for a set of pitches in a given clef.
 *
 * Returns `true` if the stem should point up (average MIDI < middle line),
 * `false` for stem down. Empty pitch arrays (rests) always return `true`.
 *
 * `pitches_json`: JSON array of `Pitch` objects.
 * `clef_json`: JSON-encoded `Clef` value (e.g. `"\"Treble\""`).
 * @param {string} pitches_json
 * @param {string} clef_json
 * @returns {boolean}
 */
export function suggested_stem_up(pitches_json, clef_json) {
    const ptr0 = passStringToWasm0(pitches_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(clef_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.suggested_stem_up(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Compute playback events for a score (JSON string).
 *
 * Returns a JSON array of `PlaybackEvent` objects, sorted by `time_beats`.
 * Each event includes: `time_beats`, `time_secs`, `pitch_midi`, `velocity`,
 * `duration_beats`, `duration_secs`, `pedal`, `part_index`.
 *
 * `bpm`: override tempo in BPM. Pass `0` to use the score's own tempo.
 * `muted_parts_json`: JSON array of part indices to silence, e.g. `"[0,2]"` or `"[]"`.
 * @param {string} score_json
 * @param {number} bpm
 * @param {string} muted_parts_json
 * @returns {string}
 */
export function to_playback_events(score_json, bpm, muted_parts_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(muted_parts_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.to_playback_events(ptr0, len0, bpm, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Extended playback event generator accepting a full `PlaybackOptions` JSON.
 *
 * Use this instead of [`to_playback_events`] when you need `loop_region` or other
 * options that cannot be expressed via positional parameters.
 *
 * `options_json` example: `{"bpm_override":null,"muted_parts":[],"loop_region":[2,5]}`
 * @param {string} score_json
 * @param {string} options_json
 * @returns {string}
 */
export function to_playback_events_ex(score_json, options_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(options_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.to_playback_events_ex(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Transpose all notes in a score by `semitones` (positive = up).
 * @param {string} score_json
 * @param {number} semitones
 * @returns {string}
 */
export function transpose_score(score_json, semitones) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transpose_score(ptr0, len0, semitones);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Validate a score. Returns a JSON `ValidationReport` with `errors` and `warnings` arrays.
 * @param {string} score_json
 * @returns {string}
 */
export function validate_score(score_json) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(score_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.validate_score(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_9c31b086c2b26051: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_getRandomValues_ef12552bf5acd2fe: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./acorde_wasm_bg.js": import0,
    };
}

const ScoreEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scoreengine_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('acorde_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
