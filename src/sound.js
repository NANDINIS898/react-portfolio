import { useEffect, useState } from "react";

/**
 * Tiny synthesised sound effects — an old-computer click and a typewriter
 * key — made with the Web Audio API, so there are no audio files to load.
 *
 * Browsers only allow sound after the visitor has interacted with the page,
 * so the audio context is created on the first pointer or key press; anything
 * asked to play before that is silently skipped. The on/off choice is
 * remembered in localStorage and every function is a no-op when sound is off
 * or Web Audio is missing.
 */

const STORAGE_KEY = "ng-sound";
const listeners = new Set();

let ctx = null;
let noise = null;
let unlocked = false;
let lastKeyAt = 0;
let enabled = readPreference();

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch (e) {
    return true;
  }
}

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(value) {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch (e) {
    // private mode: the choice just lasts for this visit
  }
  listeners.forEach((fn) => fn(value));
}

function audio() {
  if (!enabled || !unlocked) return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    // a short strip of white noise, reused for every key and click
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function burst(ac, { at, freq, q, peak, length }) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(at);
  src.stop(at + length + 0.01);
}

function tone(ac, { at, type, from, to, peak, length }) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + length + 0.01);
}

/** A soft two-part mouse click: a falling blip with a little grit. */
export function playClick() {
  const ac = audio();
  if (!ac) return;
  const at = ac.currentTime;
  tone(ac, { at, type: "square", from: 1150, to: 480, peak: 0.045, length: 0.05 });
  burst(ac, { at, freq: 2600, q: 0.9, peak: 0.05, length: 0.025 });
}

/** One typewriter key. Pitch varies a little so a run doesn't sound looped. */
export function playKey() {
  const ac = audio();
  if (!ac) return;
  const now = performance.now();
  if (now - lastKeyAt < 38) return;
  lastKeyAt = now;
  const at = ac.currentTime;
  burst(ac, { at, freq: 1900 + Math.random() * 1500, q: 1.3, peak: 0.07, length: 0.03 });
  tone(ac, { at, type: "triangle", from: 210 + Math.random() * 40, to: 120, peak: 0.035, length: 0.028 });
}

/** Typewriter keys for `ms` milliseconds; returns a function that stops it. */
export function typeBurst(ms) {
  if (!enabled || !unlocked) return () => {};
  playKey();
  const id = setInterval(playKey, 58);
  const end = setTimeout(() => clearInterval(id), ms);
  return () => {
    clearInterval(id);
    clearTimeout(end);
  };
}

/** React state for the nav's sound switch. */
export function useSoundSetting() {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    listeners.add(setOn);
    return () => listeners.delete(setOn);
  }, []);
  return [on, setSoundOn];
}

/**
 * Click sounds for the whole page: one delegated listener, so every link,
 * button and pokeable object clicks without each component wiring it up.
 */
export function useClickSounds() {
  useEffect(() => {
    function onDown(e) {
      unlocked = true;
      if (e.target.closest && e.target.closest("a, button, [tabindex]")) playClick();
    }
    function onKey() {
      unlocked = true;
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
}
