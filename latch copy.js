autowatch = 1;
inlets = 1;
outlets = 6;
// 0 = note out 
// 1 = latched notes list 
// 2 = transpose
// 3 = note names
// 4 = count + limit
// 5 = kslider highlight (pitch, state)

// --------------- GLOBALS ---------------- //

var latch = 0;
var split = 1;
var splitPoint = 48;
var pipe = 1;
var noteReplace = 1;
var transpose = 0;
var limit = 2;

// TIMED REPLACE (ms)
var replaceWindowMs = 0;
var noteTimes = {};    // pitch → timestamp

// FADE OUT (ms)
var fadeOutMs = 1000;
var pendingFades = [];
var fadeTask = new Task(processFades, this);

// LATCH DATA
var notes = [];        // FIFO latched pitches
var velocities = [];   // stored velocities

// CHORD-SAFE QUEUE
var noteQueue = [];
var queuePending = false;
var queueTask = new Task(processQueueTask, this);

// NOTE NAMES
var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


// --------------- MODE / SETTINGS ---------------- //

function setLatch(f) {
    latch = f;

    if (f == 0) {
        if (fadeOutMs > 0 && notes.length > 0) {
            var now = Date.now();
            for (var i = 0; i < notes.length; i++) {
                pendingFades.push({ pitch: notes[i], time: now + fadeOutMs });
            }
            fadeTask.schedule(20);
        } else {
            // Note-offs + remove highlight
            for (var i = 0; i < notes.length; i++) {
                outlet(0, [notes[i] + transpose, 0]);
                outlet(5, [notes[i], 0]);
            }
        }
        notes = [];
        velocities = [];
        noteTimes = {};
        outlet(4, [0, limit]);
    }
}

function setSplit(n) {
    split = n;
}

function setSplitPoint(n) {
    splitPoint = n;
}

function setNoteReplace(n) {
    noteReplace = n;
}

function setPipe(n) {
    pipe = n;
}

function setMode(n) {
    switch (n) {
        case 1:
            pipe = 1;
            noteReplace = 0;
            break;

        case 2:
            pipe = 0;
            noteReplace = 1;
            break;

        default:
            pipe = 0;
            noteReplace = 0;
            break;
    }
}

function setLimit(n) { limit = n; }
function transposeNote(n) { transpose = n; }
function setReplaceWindow(ms) { replaceWindowMs = ms; }
function setFadeOut(ms) { fadeOutMs = Math.max(0, ms); }


// --------------- NOTE INPUT (QUEUED) ---------------- //

function note() {
    var pitch = arguments[0];
    var vel = arguments[1];

    noteQueue.push({ p: pitch, v: vel, t: Date.now() });

    if (!queuePending) {
        queuePending = true;
        queueTask.schedule(0);
    }
}

function processQueueTask() {
    queuePending = false;

    while (noteQueue.length) {
        var ev = noteQueue.shift();
        handleNote(ev.p, ev.v, ev.t);
    }
}

function processFades() {
    var now = Date.now();
    var remaining = [];
    for (var i = 0; i < pendingFades.length; i++) {
        var ev = pendingFades[i];
        if (now >= ev.time) {
            // Only kill if it hasn't been re-latched
            if (notes.indexOf(ev.pitch) === -1) {
                outlet(0, [ev.pitch + transpose, 0]);
                outlet(5, [ev.pitch, 0]);
            }
        } else {
            remaining.push(ev);
        }
    }
    pendingFades = remaining;
    if (pendingFades.length > 0) {
        fadeTask.schedule(20);
    }
}


// --------------- MAIN NOTE LOGIC ---------------- //

function handleNote(pitch, velocity, timestamp) {

    // -------------- NORMAL MODE -------------- //
    if (!latch) {
        outlet(0, [pitch + transpose, velocity]);
        return;
    }

    // -------------- LATCH MODE -------------- //

    var currentPipe = pipe;

    if (split) {
        if (pitch >= splitPoint) {
            // Upper half: Pipe ONLY if pipe is on
            if (pipe) {
                if (velocity > 0) {
                    outlet(0, [pitch + transpose, velocity]);
                } else {
                    if (!exists) {
                        outlet(0, [pitch + transpose, 0]);
                    }
                }
            }
            return;
        } else {
            // Lower half: Latch ONLY
            currentPipe = 0;
        }
    }

    var exists = notes.indexOf(pitch) >= 0;

    // ===== NOTE ON =====
    if (velocity > 0) {

        // A) Add new note if space available
        if (!exists && notes.length < limit) {
            addLatched(pitch, velocity, timestamp);
            return;
        }

        // B) Replace mode active
        if (noteReplace && notes.length == limit && !currentPipe) {

            var oldestPitch = notes[0];
            var oldestTime = noteTimes[oldestPitch];
            var dt = timestamp - oldestTime;

            if (replaceWindowMs == 0 || dt >= replaceWindowMs) {
                replaceOldest(pitch, velocity, timestamp);
                return;
            }

            // too soon → pipe if allowed
            if (currentPipe) {
                outlet(0, [pitch + transpose, velocity]);
            }
            return;
        }

        // C) Pipe-through mode only
        if (!exists && currentPipe) { // && !noteReplace){
            outlet(0, [pitch + transpose, velocity]);
        }
    }

    // ===== NOTE OFF =====
    if (velocity == 0) {
        // Only pipe note-off if note was not latched
        if (currentPipe && !exists) {
            outlet(0, [pitch + transpose, 0]);
        }
        // latched notes do not get removed
    }

    updateOutputs();
}


// --------------- HELPERS ---------------- //

function addLatched(pitch, velocity, timestamp) {
    notes.push(pitch);
    velocities.push(velocity);
    noteTimes[pitch] = timestamp;

    outlet(0, [pitch + transpose, velocity]);
    outlet(5, [pitch, 1]); // kslider highlight ON

    updateOutputs();
}

function replaceOldest(newPitch, velocity, timestamp) {
    var old = notes.shift();
    velocities.shift();

    outlet(0, [old + transpose, 0]);   // send note-off
    outlet(5, [old, 0]);               // highlight OFF
    delete noteTimes[old];

    // Remove any existing instance to prevent duplicates and allow retrigger
    var existingIdx = notes.indexOf(newPitch);
    if (existingIdx >= 0) {
        notes.splice(existingIdx, 1);
        velocities.splice(existingIdx, 1);
        outlet(0, [newPitch + transpose, 0]);
    }

    notes.push(newPitch);
    velocities.push(velocity);
    noteTimes[newPitch] = timestamp;

    outlet(0, [newPitch + transpose, velocity]);
    outlet(5, [newPitch, 1]);

    updateOutputs();
}


// --------------- OUTPUT UPDATES ---------------- //

function updateOutputs() {
    outlet(1, notes);
    outlet(4, [notes.length, limit]);

    var names = [];
    var sorted = notes.slice().sort(function (a, b) { return a - b });
    for (var i = 0; i < sorted.length; i++) {
        names.push(NOTE_NAMES[sorted[i] % 12]);
    }
    outlet(3, names);
}


// --------------- RESET ---------------- //

function latchEnd() {
    for (var i = 0; i < notes.length; i++) {
        outlet(0, [notes[i] + transpose, 0]);
        outlet(5, [notes[i], 0]);
    }
    notes = [];
    velocities = [];
    noteTimes = {};
    pendingFades = [];
}

function init() {
    notes = [];
    velocities = [];
    noteTimes = {};
    pendingFades = [];
}

function highlightRange(low, high, r, g, b) {
    for (var i = low; i <= high; i++) {
        // outlet 1 is connected to kslider
        outlet(2, ["set", i, 127, r, g, b]);
    }
}


function transposeNote(n) {
    transpose = n
}

function transposeAdd(n) {
    outlet(2, transpose + 12)
}

function transposeDown(n) {
    outlet(2, transpose - 12)
}

