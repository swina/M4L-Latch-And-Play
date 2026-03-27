# Latch&Play Functionalities

**Latch&Play** is a powerful MIDI utility designed for Max for Live that allows you to "capture" and hold MIDI notes (latch) while providing flexible options for splitting the keyboard, replacing notes, and transposing output.

---

## Core Features

### 1. Latch Mode
The primary function of the device. When enabled, MIDI "Note On" messages are stored and held indefinitely. 
- **Active**: Notes are latched and stay on.
- **Inactive**: Notes pass through normally. A **Fade Out** duration can be applied when disabling Latch to smoothly release held notes.

### 2. Keyboard Splitting
Split your keyboard into two zones for multi-functional playing.
- **Split Point**: A user-definable MIDI note (default: 48 / C2).
- **Lower Zone**: Notes played below the split point are processed by the latching logic.
- **Upper Zone**: Notes played above the split point "Pipe Through" directly to the output without being latched.

### 3. Note Replacing (Voice Management)
Manage how the device behaves when you exceed the polyphony limit.
- **Polyphony Limit**: Set the maximum number of notes that can be latched simultaneously.
- **Note Replace**: When active, playing a new note after reaching the limit will automatically release the oldest latched note and replace it with the new one (**FIFO** - First In, First Out).
- **Replace Window**: A timing buffer (in milliseconds) that allows you to play chords without accidentally triggering the "Replace" logic for every note in the chord.

### 4. Pipe-Through Logic
Determines how non-latched notes are handled.
- **Pipe Mode**: Allows you to play "on top" of your latched notes. Notes that are not being latched (either because they are above the split point or because the latch limit is reached) will still be heard but not held.

### 5. Transposition
Adjust the pitch of all outgoing MIDI notes.
- **Transpose**: Shift notes by semitones.
- **Octave Shift**: Quick controls for jumping up or down by 12 semitones.

### 6. Visual Feedback & Monitoring
- **Kslider Highlight**: Provides real-time visual feedback on a virtual keyboard within the Max for Live device.
- **Note Name Display**: Shows the musical names (e.g., C, Eb, G) of the currently latched notes.
- **Counter**: Displays the current number of latched notes against the set limit.

---

## Advanced Settings

- **Fade Out (ms)**: When the Latch is turned off, notes can be released over a specified time rather than cut off instantly.
- **Chord-Safe Queue**: Uses an internal task queue to ensure that rapid MIDI events (like chords) are processed in the correct order without dropping notes.

---

## Technical Outlet Mapping (For Max Developers)
1. **Outlet 0**: MIDI Note Out (Pitch + Transpose, Velocity)
2. **Outlet 1**: List of currently latched MIDI pitches.
3. **Outlet 2**: Transpose value (semitones).
4. **Outlet 3**: List of musical note names currently held.
5. **Outlet 4**: Array `[Current Count, Polyphony Limit]`.
6. **Outlet 5**: Kslider highlight messages `[Pitch, State]`.
