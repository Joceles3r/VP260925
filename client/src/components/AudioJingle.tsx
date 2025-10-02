import { useEffect, useRef } from 'react';

export function AudioJingle() {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (hasPlayedRef.current) return;
    
    const playJingle = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const notes = [
          { freq: 523.25, time: 0, duration: 0.15 },
          { freq: 659.25, time: 0.12, duration: 0.15 },
          { freq: 783.99, time: 0.24, duration: 0.15 },
          { freq: 1046.50, time: 0.36, duration: 0.25 },
        ];
        
        const masterGain = audioContext.createGain();
        masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        masterGain.connect(audioContext.destination);
        
        notes.forEach(({ freq, time, duration }) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + time);
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + time);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + time + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + duration);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          oscillator.start(audioContext.currentTime + time);
          oscillator.stop(audioContext.currentTime + time + duration);
        });
        
        const subOscillator = audioContext.createOscillator();
        const subGain = audioContext.createGain();
        
        subOscillator.type = 'triangle';
        subOscillator.frequency.setValueAtTime(130.81, audioContext.currentTime);
        
        subGain.gain.setValueAtTime(0, audioContext.currentTime);
        subGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        subOscillator.connect(subGain);
        subGain.connect(masterGain);
        
        subOscillator.start(audioContext.currentTime);
        subOscillator.stop(audioContext.currentTime + 0.6);
        
        setTimeout(() => {
          audioContext.close();
        }, 1000);
        
        hasPlayedRef.current = true;
      } catch (error) {
        console.log('[AudioJingle] Jingle skipped (user interaction required or audio blocked)');
      }
    };
    
    const timeoutId = setTimeout(playJingle, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
