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

