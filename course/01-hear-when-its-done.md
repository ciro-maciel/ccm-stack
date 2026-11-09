# 01 · Hear when it's done

**Module 0 · Start** · 10 minutes · [Previous](00-start.md) · [Next: Start from the person](02-start-from-the-person.md)

## The mistake

You leave the agent on a long task and switch to something else. It finished twenty minutes ago and has been waiting for a decision ever since. Or you read a three-screen report to find the one sentence that mattered.

## The rule

A finished task ends with a spoken summary: one to three sentences, in your language, said out loud by your computer.

## Make it stick

At the start of each session, CCM Stack tells the agent to end finished work with a hidden comment:

```html
<!-- voice: The login bug is fixed and the test that reproduces it now passes. Nothing is waiting on you. -->
```

When the agent stops, a hook reads that comment and speaks it in the background. No comment, no sound: short chat replies stay silent.

Engines:

| Engine | Where it runs | Cost | License |
|---|---|---|---|
| Phonon (default) | On your machine, offline after the first download | Free | English: Apache-2.0, any use. Portuguese, Spanish, French, German: **CC BY-NC 4.0, non-commercial only** |
| System voice | On your machine | Free | Any use |
| Fish Audio | Cloud | Your own `FISH_API_KEY` | Fish's terms |

If the chosen engine fails, the system voice speaks instead.

## Try it

```
/ccm-stack:setup
```

Turn the spoken summary on and pick Phonon. The setup runs `ccm voice install`, which downloads Gradium's official binary for your system and checks its SHA-256.

For a non-English model: accept its license on Hugging Face, create a read token, and set it as `HF_TOKEN` for the first download.

- macOS / Linux: `export HF_TOKEN=hf_...`
- Windows (PowerShell): `$env:HF_TOKEN = "hf_..."`

Then:

```
ccm voice test
```

What each system needs:

- **macOS:** nothing extra. `afplay` plays and speeds up the audio.
- **Linux:** `paplay` or `aplay` to play; `ffmpeg` for speed-up; `speech-dispatcher` or `espeak-ng` for the fallback voice.
- **Windows:** nothing extra for playback and the fallback voice; `ffmpeg` for speed-up.

`ccm doctor` says what is missing on yours.

## Checkpoint

Ask your agent to do a small task. When it finishes, you hear what it did without reading a word.
