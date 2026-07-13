export function soundEnabled(): boolean {
  return (
    typeof window !== 'undefined' && localStorage.getItem('sound') === '1'
  );
}

export function setSoundEnabled(on: boolean): void {
  localStorage.setItem('sound', on ? '1' : '0');
}

// Short synthesized paper/wax crack — no audio assets to load.
export function playSealCrack(): void {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  const ctx = new AudioContext();
  const dur = 0.18;

  const buffer = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * dur),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp((-6 * i) / data.length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.25;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);

  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(140, ctx.currentTime);
  thump.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.3, ctx.currentTime);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  thump.connect(thumpGain).connect(ctx.destination);

  noise.start();
  thump.start();
  thump.stop(ctx.currentTime + 0.16);
  noise.onended = () => void ctx.close();
}
