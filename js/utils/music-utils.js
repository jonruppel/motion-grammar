/**
 * Music Utilities
 * Helper functions for converting music notation to wire indices and frequencies
 */

// Note name to frequency mapping (in Hz)
const NOTE_FREQUENCIES = {
    // C octaves
    'C3': 130.81, 'C4': 261.63, 'C5': 523.25, 'C6': 1046.50,
    // D octaves
    'D3': 146.83, 'D4': 293.66, 'D5': 587.33, 'D6': 1174.66,
    // E octaves
    'E3': 164.81, 'E4': 329.63, 'E5': 659.25, 'E6': 1318.51,
    // F octaves
    'F3': 174.61, 'F4': 349.23, 'F5': 698.46, 'F6': 1396.91,
    // G octaves
    'G3': 196.00, 'G4': 392.00, 'G5': 783.99, 'G6': 1567.98,
    // A octaves
    'A3': 220.00, 'A4': 440.00, 'A5': 880.00, 'A6': 1760.00,
    // B octaves
    'B3': 246.94, 'B4': 493.88, 'B5': 987.77, 'B6': 1975.53,
    // Sharps/Flats (using enharmonic equivalents)
    'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37, 'C#6': 1108.73,
    'D#3': 155.56, 'D#4': 311.13, 'D#5': 622.25, 'D#6': 1244.51,
    'F#3': 185.00, 'F#4': 369.99, 'F#5': 739.99, 'F#6': 1479.98,
    'G#3': 207.65, 'G#4': 415.30, 'G#5': 830.61, 'G#6': 1661.22,
    'A#3': 233.08, 'A#4': 466.16, 'A#5': 932.33, 'A#6': 1864.66,
    // Flats
    'Db3': 138.59, 'Db4': 277.18, 'Db5': 554.37, 'Db6': 1108.73,
    'Eb3': 155.56, 'Eb4': 311.13, 'Eb5': 622.25, 'Eb6': 1244.51,
    'Gb3': 185.00, 'Gb4': 369.99, 'Gb5': 739.99, 'Gb6': 1479.98,
    'Ab3': 207.65, 'Ab4': 415.30, 'Ab5': 830.61, 'Ab6': 1661.22,
    'Bb3': 233.08, 'Bb4': 466.16, 'Bb5': 932.33, 'Bb6': 1864.66,
};

/**
 * Map a note name (e.g., "C5", "E4") to a wire index (0-3)
 * Wires are mapped to pitch ranges:
 * Wire 0 = Highest notes (typically B5, A5, etc.)
 * Wire 1 = Upper mid (C5, D5)
 * Wire 2 = Lower mid (E5, F5, G5)
 * Wire 3 = Lower notes (A4, B4, C4, etc.)
 */
export function noteToWireIndex(noteName) {
    if (!noteName || typeof noteName !== 'string') {
        return 2; // Default to middle wire
    }
    
    // Extract note letter and octave
    const match = noteName.match(/^([A-G]#?b?)(\d+)$/i);
    if (!match) {
        return 2;
    }
    
    const note = match[1].toUpperCase();
    const octave = parseInt(match[2], 10);
    
    // Map notes to wire indices based on pitch
    // Higher octaves and higher notes go to lower wire indices (wire 0 = highest)
    if (octave >= 6 || (octave === 5 && ['B', 'A#', 'Bb'].includes(note))) {
        return 0; // Highest notes
    } else if (octave === 5 && ['C', 'C#', 'Db', 'D', 'D#', 'Eb'].includes(note)) {
        return 1; // Upper mid
    } else if (octave === 5 && ['E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'].includes(note)) {
        return 2; // Lower mid
    } else if (octave <= 4 || (octave === 5 && ['A', 'A#', 'Bb'].includes(note) && octave === 5)) {
        return 3; // Lower notes
    }
    
    return 2; // Default
}

/**
 * Get frequency for a note name
 */
export function getNoteFrequency(noteName) {
    if (!noteName || typeof noteName !== 'string') {
        return 440; // A4 default
    }
    
    // Try exact match first
    if (NOTE_FREQUENCIES[noteName]) {
        return NOTE_FREQUENCIES[noteName];
    }
    
    // Try case-insensitive
    const upper = noteName.toUpperCase();
    if (NOTE_FREQUENCIES[upper]) {
        return NOTE_FREQUENCIES[upper];
    }
    
    return 440; // Default to A4
}

/**
 * Convert music data from Musescore-like format to our internal format
 * Expected input format:
 * {
 *   melody: [
 *     { bar: 0, notes: [{ note: "E5", timing: 0.0 }, { note: "E5", timing: 0.2 }, ...] },
 *     ...
 *   ],
 *   bass: [
 *     { bar: 0, notes: [{ note: "C4", timing: 0.0 }] },
 *     ...
 *   ]
 * }
 */
export function convertMusicData(musicData) {
    const converted = {
        melody: [],
        bass: []
    };
    
    if (musicData.melody) {
        converted.melody = musicData.melody.map(bar => ({
            bar: bar.bar,
            notes: bar.notes.map(note => {
                const noteName = note.note || note.noteName;
                return {
                    note: noteName, // Preserve original note field
                    wire: note.wire !== undefined ? note.wire : noteToWireIndex(noteName),
                    timing: note.timing,
                    frequency: note.frequency || (noteName ? getNoteFrequency(noteName) : null),
                    noteName: noteName // Also store as noteName for compatibility
                };
            })
        }));
    }
    
    if (musicData.bass) {
        converted.bass = musicData.bass.map(bar => ({
            bar: bar.bar,
            notes: bar.notes.map(note => {
                const noteName = note.note || note.noteName;
                return {
                    note: noteName, // Preserve original note field
                    wire: note.wire !== undefined ? note.wire : noteToWireIndex(noteName),
                    timing: note.timing,
                    frequency: note.frequency || (noteName ? getNoteFrequency(noteName) : null),
                    noteName: noteName // Also store as noteName for compatibility
                };
            })
        }));
    }
    
    return converted;
}

/**
 * Load music data from a JSON file
 */
export async function loadMusicData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load music data: ${response.statusText}`);
        }
        const data = await response.json();
        return convertMusicData(data);
    } catch (error) {
        throw error;
    }
}

