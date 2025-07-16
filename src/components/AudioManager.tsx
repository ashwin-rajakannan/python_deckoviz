class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.interruptedAudio = null;
    this.interruptedPosition = 0;
    this.interruptedVolume = 1;
    this.isInterrupted = false;
  }

  async hasOngoingAudio() {
    return this.currentAudio !== null;
  }

  async playAudio(source, options = {}) {
    await this.stopAudio();
    
    return new Promise((resolve, reject) => {
      this.currentAudio = new Sound(source, '', (error) => {
        if (error) {
          this.currentAudio = null;
          reject(error);
          return;
        }
        
        this.currentAudio.play((success) => {
          if (!success) {
            this.currentAudio = null;
            reject(new Error('Playback failed'));
          }
        });
        
        if (options.loop) {
          this.currentAudio.setNumberOfLoops(-1);
        }
        
        if (options.volume !== undefined) {
          this.currentAudio.setVolume(options.volume);
        }
        
        resolve(this.currentAudio);
      });
    });
  }

  async handleInterruption(type) {
    if (this.currentAudio && !this.isInterrupted) {
      this.isInterrupted = true;
      this.interruptedAudio = this.currentAudio;
      this.currentAudio = null;
      
      await new Promise((resolve) => {
        this.interruptedAudio.getCurrentTime((seconds) => {
          this.interruptedPosition = seconds;
          this.interruptedAudio.getVolume((volume) => {
            this.interruptedVolume = volume;
            resolve();
          });
        });
      });
      
      await this.fadeOut(this.interruptedAudio, 500);
    }
  }

  async resumeInterrupted() {
    if (!this.interruptedAudio) return false;
    
    try {
      this.isInterrupted = false;
      const source = this.interruptedAudio._filename;
      const audio = await this.playAudio(source, {
        loop: this.interruptedAudio._numberOfLoops === -1,
        volume: 0
      });
      
      audio.setCurrentTime(this.interruptedPosition);
      await this.fadeIn(audio, this.interruptedVolume, 500);
      
      this.interruptedAudio.release();
      this.interruptedAudio = null;
      this.interruptedPosition = 0;
      this.interruptedVolume = 1;
      
      return true;
    } catch (error) {
      console.error('Failed to resume interrupted audio:', error);
      return false;
    }
  }

  async stopAudio() {
    if (this.currentAudio) {
      await new Promise((resolve) => {
        this.currentAudio.stop(() => {
          this.currentAudio.release();
          this.currentAudio = null;
          resolve();
        });
      });
    }
  }

  async fadeOut(audio, duration) {
    if (!audio) return;
    
    const steps = 10;
    const stepTime = duration / steps;
    
    for (let i = steps; i >= 0; i--) {
      await new Promise((resolve) => {
        setTimeout(() => {
          audio.setVolume(i / steps);
          resolve();
        }, stepTime);
      });
    }
    
    await this.stopAudio();
  }

  async fadeIn(audio, targetVolume, duration) {
    if (!audio) return;
    
    const steps = 10;
    const stepTime = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => {
        setTimeout(() => {
          audio.setVolume((i / steps) * targetVolume);
          resolve();
        }, stepTime);
      });
    }
  }

  getState() {
    return {
      currentAudio: !!this.currentAudio,
      interruptedAudio: !!this.interruptedAudio,
      isInterrupted: this.isInterrupted,
      interruptedPosition: this.interruptedPosition,
      interruptedVolume: this.interruptedVolume
    };
  }

  cleanup() {
    this.stopAudio();
    if (this.interruptedAudio) {
      this.interruptedAudio.release();
      this.interruptedAudio = null;
    }
  }
}

const audioManager = new AudioManager();
export default audioManager;