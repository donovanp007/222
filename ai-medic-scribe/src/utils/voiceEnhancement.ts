/**
 * Advanced Voice Enhancement and Processing Utilities
 * Features: Noise filtering, speaker identification, voice commands, automatic punctuation
 */

export interface VoiceEnhancementSettings {
  noiseReduction: boolean;
  noiseReductionLevel: 'light' | 'medium' | 'aggressive';
  speakerIdentification: boolean;
  voiceCommands: boolean;
  automaticPunctuation: boolean;
  voiceActivityDetection: boolean;
  echoReduction: boolean;
  gainControl: boolean;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  role: 'doctor' | 'patient' | 'nurse' | 'other';
  voiceCharacteristics: {
    pitch: number;
    tempo: number;
    formants: number[];
    mfcc: number[];
  };
  confidence: number;
}

export interface VoiceCommand {
  command: string;
  pattern: RegExp;
  action: string;
  parameters?: Record<string, string>;
}

export interface ProcessedAudioSegment {
  timestamp: number;
  duration: number;
  text: string;
  speaker: SpeakerProfile | null;
  confidence: number;
  noiseLevel: number;
  voiceCommands: VoiceCommand[];
  enhanced: boolean;
}

class VoiceEnhancementProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseGate: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private settings: VoiceEnhancementSettings;
  private speakerProfiles: SpeakerProfile[] = [];
  private voiceCommands: VoiceCommand[] = [];

  constructor(settings: VoiceEnhancementSettings) {
    this.settings = settings;
    this.initializeVoiceCommands();
  }

  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      await this.setupAudioProcessingChain();
      this.loadSpeakerProfiles();
    } catch (error) {
      console.error('Failed to initialize voice enhancement:', error);
      throw error;
    }
  }

  private async setupAudioProcessingChain(): Promise<void> {
    if (!this.audioContext) return;

    // Create analyser for voice activity detection
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // High-pass filter for removing low-frequency noise
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.setValueAtTime(85, this.audioContext.currentTime); // Remove below human voice range

    // Low-pass filter for removing high-frequency noise
    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.setValueAtTime(8000, this.audioContext.currentTime); // Remove above speech range

    // Compressor for dynamic range control
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(20, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // Noise gate for background noise reduction
    this.noiseGate = this.audioContext.createGain();
  }

  async processAudioStream(stream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext || !this.settings.noiseReduction) {
      return stream;
    }

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const destination = this.audioContext.createMediaStreamDestination();

      // Build processing chain
      let currentNode: AudioNode = source;

      if (this.highPassFilter) {
        currentNode.connect(this.highPassFilter);
        currentNode = this.highPassFilter;
      }

      if (this.lowPassFilter) {
        currentNode.connect(this.lowPassFilter);
        currentNode = this.lowPassFilter;
      }

      if (this.compressor) {
        currentNode.connect(this.compressor);
        currentNode = this.compressor;
      }

      if (this.noiseGate) {
        currentNode.connect(this.noiseGate);
        currentNode = this.noiseGate;
      }

      if (this.analyser) {
        currentNode.connect(this.analyser);
      }

      currentNode.connect(destination);

      // Apply noise reduction settings
      this.applyNoiseReductionSettings();

      return destination.stream;
    } catch (error) {
      console.error('Error processing audio stream:', error);
      return stream;
    }
  }

  private applyNoiseReductionSettings(): void {
    if (!this.noiseGate || !this.audioContext) return;

    const reductionLevels = {
      light: -30,    // -30dB threshold
      medium: -25,   // -25dB threshold  
      aggressive: -20 // -20dB threshold
    };

    const threshold = reductionLevels[this.settings.noiseReductionLevel];
    this.noiseGate.gain.setValueAtTime(
      this.dbToGain(threshold),
      this.audioContext.currentTime
    );
  }

  private dbToGain(db: number): number {
    return Math.pow(10, db / 20);
  }

  detectVoiceActivity(): boolean {
    if (!this.analyser || !this.settings.voiceActivityDetection) return true;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate energy in speech frequency range (300Hz - 3400Hz)
    const speechBinStart = Math.floor((300 / (this.audioContext?.sampleRate || 44100)) * dataArray.length * 2);
    const speechBinEnd = Math.floor((3400 / (this.audioContext?.sampleRate || 44100)) * dataArray.length * 2);

    let speechEnergy = 0;
    for (let i = speechBinStart; i < speechBinEnd && i < dataArray.length; i++) {
      speechEnergy += dataArray[i];
    }

    const averageEnergy = speechEnergy / (speechBinEnd - speechBinStart);
    return averageEnergy > 50; // Threshold for voice activity
  }

  identifySpeaker(audioData: Float32Array): SpeakerProfile | null {
    if (!this.settings.speakerIdentification || this.speakerProfiles.length === 0) {
      return null;
    }

    // Extract voice characteristics
    const characteristics = this.extractVoiceCharacteristics(audioData);
    
    // Find best matching speaker
    let bestMatch: SpeakerProfile | null = null;
    let highestConfidence = 0;

    for (const profile of this.speakerProfiles) {
      const confidence = this.calculateSpeakerConfidence(characteristics, profile.voiceCharacteristics);
      if (confidence > highestConfidence && confidence > 0.6) {
        highestConfidence = confidence;
        bestMatch = { ...profile, confidence };
      }
    }

    return bestMatch;
  }

  private extractVoiceCharacteristics(audioData: Float32Array): SpeakerProfile['voiceCharacteristics'] {
    // Simplified voice characteristic extraction
    // In a real implementation, this would use more sophisticated algorithms like MFCC
    
    const pitch = this.estimatePitch(audioData);
    const tempo = this.estimateTempo(audioData);
    const formants = this.estimateFormants(audioData);
    const mfcc = this.calculateMFCC(audioData);

    return { pitch, tempo, formants, mfcc };
  }

  private estimatePitch(audioData: Float32Array): number {
    // Autocorrelation method for pitch detection
    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = 20; period < 400; period++) {
      let correlation = 0;
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return (this.audioContext?.sampleRate || 44100) / bestPeriod;
  }

  private estimateTempo(audioData: Float32Array): number {
    // Simplified tempo estimation based on energy fluctuations
    let energyChanges = 0;
    const windowSize = 1024;
    
    for (let i = windowSize; i < audioData.length - windowSize; i += windowSize) {
      const energy1 = this.calculateRMS(audioData.slice(i - windowSize, i));
      const energy2 = this.calculateRMS(audioData.slice(i, i + windowSize));
      
      if (Math.abs(energy2 - energy1) > 0.1) {
        energyChanges++;
      }
    }

    return energyChanges / (audioData.length / windowSize) * 60; // BPM estimate
  }

  private estimateFormants(audioData: Float32Array): number[] {
    // Simplified formant estimation using FFT peaks
    if (!this.audioContext) return [800, 1200, 2400];

    const fftSize = 2048;
    const fft = new Float32Array(fftSize);
    
    // Copy audio data for FFT (simplified)
    for (let i = 0; i < Math.min(audioData.length, fftSize); i++) {
      fft[i] = audioData[i];
    }

    // Find peaks in frequency domain (simplified)
    const formants = [800, 1200, 2400]; // Default formant frequencies
    return formants;
  }

  private calculateMFCC(audioData: Float32Array): number[] {
    // Simplified MFCC calculation
    // In practice, this would involve mel-scale filtering and DCT
    const mfcc = new Array(13).fill(0);
    
    for (let i = 0; i < 13; i++) {
      mfcc[i] = Math.random() * 2 - 1; // Placeholder
    }
    
    return mfcc;
  }

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  private calculateSpeakerConfidence(
    characteristics1: SpeakerProfile['voiceCharacteristics'],
    characteristics2: SpeakerProfile['voiceCharacteristics']
  ): number {
    // Calculate similarity between voice characteristics
    const pitchSimilarity = 1 - Math.abs(characteristics1.pitch - characteristics2.pitch) / 500;
    const tempoSimilarity = 1 - Math.abs(characteristics1.tempo - characteristics2.tempo) / 200;
    
    // Simplified confidence calculation
    return Math.max(0, (pitchSimilarity + tempoSimilarity) / 2);
  }

  private initializeVoiceCommands(): void {
    this.voiceCommands = [
      {
        command: 'add_followup',
        pattern: /add follow[- ]?up in (\d+) (days?|weeks?|months?)/i,
        action: 'schedule_followup',
        parameters: { timeframe: '$1 $2' }
      },
      {
        command: 'mark_urgent',
        pattern: /mark (as )?urgent/i,
        action: 'set_urgency',
        parameters: { level: 'urgent' }
      },
      {
        command: 'send_pharmacy',
        pattern: /send to pharmacy/i,
        action: 'send_prescription',
        parameters: { destination: 'pharmacy' }
      },
      {
        command: 'schedule_bloodwork',
        pattern: /schedule (blood ?work|lab tests?)/i,
        action: 'schedule_lab',
        parameters: { type: 'bloodwork' }
      },
      {
        command: 'new_section',
        pattern: /new section|next section/i,
        action: 'create_section',
        parameters: {}
      },
      {
        command: 'save_note',
        pattern: /save (the )?note/i,
        action: 'save_document',
        parameters: {}
      }
    ];
  }

  detectVoiceCommands(text: string): VoiceCommand[] {
    if (!this.settings.voiceCommands) return [];

    const detectedCommands: VoiceCommand[] = [];

    for (const command of this.voiceCommands) {
      const match = text.match(command.pattern);
      if (match) {
        const processedCommand = { ...command };
        
        // Replace parameter placeholders with actual values
        if (command.parameters) {
          for (const [key, value] of Object.entries(command.parameters)) {
            if (typeof value === 'string' && value.includes('$')) {
              processedCommand.parameters![key] = value.replace(/\$(\d+)/g, (_, index) => match[parseInt(index)] || '');
            }
          }
        }
        
        detectedCommands.push(processedCommand);
      }
    }

    return detectedCommands;
  }

  enhanceTextWithPunctuation(text: string): string {
    if (!this.settings.automaticPunctuation) return text;

    let enhanced = text;

    // Add periods after sentences
    enhanced = enhanced.replace(/\b(and then|so then|after that|next|finally)\s+([a-z])/g, '. $1 $2');
    enhanced = enhanced.replace(/([.!?])\s*([a-z])/g, '$1 $2');

    // Add commas for natural pauses
    enhanced = enhanced.replace(/\b(however|therefore|meanwhile|furthermore|moreover|nevertheless)\s+/g, ', $1 ');
    enhanced = enhanced.replace(/\b(and|but|or|so)\s+([a-z])/g, ', $1 $2');

    // Medical-specific punctuation
    enhanced = enhanced.replace(/\b(patient|pt)\s+(reports|states|mentions|complains of|presents with)/gi, 'Patient $2');
    enhanced = enhanced.replace(/\b(diagnosis|dx)\s*:?\s*/gi, 'Diagnosis: ');
    enhanced = enhanced.replace(/\b(treatment|tx|plan)\s*:?\s*/gi, 'Treatment: ');

    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

    return enhanced;
  }

  addSpeakerProfile(profile: Omit<SpeakerProfile, 'id'>): string {
    const id = `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: SpeakerProfile = { ...profile, id };
    this.speakerProfiles.push(newProfile);
    this.saveSpeakerProfiles();
    return id;
  }

  private loadSpeakerProfiles(): void {
    try {
      const stored = localStorage.getItem('voiceEnhancement_speakerProfiles');
      if (stored) {
        this.speakerProfiles = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load speaker profiles:', error);
    }
  }

  private saveSpeakerProfiles(): void {
    try {
      localStorage.setItem('voiceEnhancement_speakerProfiles', JSON.stringify(this.speakerProfiles));
    } catch (error) {
      console.error('Failed to save speaker profiles:', error);
    }
  }

  updateSettings(newSettings: Partial<VoiceEnhancementSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (newSettings.noiseReductionLevel) {
      this.applyNoiseReductionSettings();
    }
  }

  getSettings(): VoiceEnhancementSettings {
    return { ...this.settings };
  }

  getSpeakerProfiles(): SpeakerProfile[] {
    return [...this.speakerProfiles];
  }

  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Default settings
export const defaultVoiceEnhancementSettings: VoiceEnhancementSettings = {
  noiseReduction: true,
  noiseReductionLevel: 'medium',
  speakerIdentification: true,
  voiceCommands: true,
  automaticPunctuation: true,
  voiceActivityDetection: true,
  echoReduction: true,
  gainControl: true
};

// Export the main class
export { VoiceEnhancementProcessor };

// Utility functions
export function createVoiceEnhancementProcessor(
  settings: Partial<VoiceEnhancementSettings> = {}
): VoiceEnhancementProcessor {
  const finalSettings = { ...defaultVoiceEnhancementSettings, ...settings };
  return new VoiceEnhancementProcessor(finalSettings);
}

export function isVoiceEnhancementSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}