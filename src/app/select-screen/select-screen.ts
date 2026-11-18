
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  output,
  signal
} from '@angular/core';

import gsap from 'gsap';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-select-screen',
  templateUrl: './select-screen.html',
  styleUrl: './select-screen.scss',
  standalone: true
})
export class SelectScreen implements OnInit, OnDestroy {

  @ViewChild('doorsGrid')
  private doorsGrid?: ElementRef<HTMLDivElement>;

  selectGame = output<string>();
  goHome = output<void>();

  isMuted = signal<boolean>(false);
  activeDoor = signal<string | null>(null);

  // =====================================================
  // AUDIO
  // =====================================================

  private promptAudio: HTMLAudioElement | null = null;

  private selectionAudio: HTMLAudioElement | null = null;

  private doorAudioCache = new Map<string, HTMLAudioElement>();

  private finishSelectionAudio: (() => void) | null = null;

  // =====================================================
  // ANIMATION
  // =====================================================

  private selectionTimeline: gsap.core.Timeline | null = null;

  private particleTimer: ReturnType<typeof setTimeout> | null = null;

  private destroyed = false;

  // =====================================================
  // DOORS DATA
  // =====================================================

  doors = [
    {
      id: 'game-3a',
      title: 'TÌM ĐỒ VẬT',
      img: '/images/balloon-door.png',
      alt: 'Cửa tìm đồ vật',
      audio: '/audio/select-game-3a.mp3'
    },
    {
      id: 'game-3b',
      title: 'TÌM CON VẬT',
      img: '/images/animal-door.png',
      alt: 'Cửa tìm con vật',
      audio: '/audio/select-game-3b.mp3'
    },
    {
      id: 'game-3c',
      title: 'TÌM MÀU ĐỎ',
      img: '/images/apple-door.png',
      alt: 'Cửa tìm màu đỏ',
      audio: '/audio/select-game-3c.mp3'
    }
  ];

  // =====================================================
  // MAGIC COLORS
  // =====================================================

  private readonly magicColors: Record<string, string[]> = {

    'game-3a': [
      '#FDE047',
      '#F59E0B',
      '#FB923C',
      '#FFFFFF',
      '#FBBF24'
    ],

    'game-3b': [
      '#F9A8D4',
      '#EC4899',
      '#FBCFE8',
      '#FFFFFF',
      '#F472B6'
    ],

    'game-3c': [
      '#D8B4FE',
      '#A855F7',
      '#C084FC',
      '#FFFFFF',
      '#7C3AED'
    ]

  };

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (typeof Audio === 'undefined') return;

    // MP3 giới thiệu màn chọn trò chơi
    this.promptAudio = new Audio('/audio/select-screen.mp3');

    this.promptAudio.preload = 'auto';
    this.promptAudio.volume = 1;

    // Chuẩn bị trước MP3 của từng cửa
    this.preloadDoorAudios();

    // Phát lời giới thiệu khi vào màn
    void this.playPromptAudio();
  }

  // =====================================================
  // PRELOAD DOOR AUDIO
  // =====================================================

  private preloadDoorAudios(): void {

    this.doors.forEach(door => {

      const audio = new Audio(door.audio);

      audio.preload = 'auto';
      audio.volume = 1;

      this.doorAudioCache.set(door.id, audio);

    });

  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.destroyed = true;

    // Dừng GSAP
    this.selectionTimeline?.kill();
    this.selectionTimeline = null;

    // Dừng timer
    if (this.particleTimer !== null) {
      clearTimeout(this.particleTimer);
      this.particleTimer = null;
    }

    // Dừng toàn bộ âm thanh
    this.stopPromptAudio();
    this.stopSelectionAudio();

    this.doorAudioCache.forEach(audio => {

      audio.pause();
      audio.currentTime = 0;

    });

    this.doorAudioCache.clear();

    // Xóa particle còn lại
    confetti.reset();

  }

  // =====================================================
  // PROMPT AUDIO
  // =====================================================

  async playPromptAudio(): Promise<void> {

    if (this.isMuted() || !this.promptAudio) return;

    try {

      this.promptAudio.currentTime = 0;

      await this.promptAudio.play();

    } catch {

      // Autoplay có thể bị trình duyệt chặn.
      // Bé có thể chạm vào banner để phát lại.

    }

  }

  replayPromptAudio(): void {

    void this.playPromptAudio();

  }

  private stopPromptAudio(): void {

    if (!this.promptAudio) return;

    this.promptAudio.pause();
    this.promptAudio.currentTime = 0;

  }

  // =====================================================
  // TOGGLE AUDIO
  // =====================================================

  toggleAudio(event: Event): void {

    event.stopPropagation();

    this.isMuted.update(m => !m);

    if (this.isMuted()) {

      this.stopPromptAudio();

    } else {

      void this.playPromptAudio();

    }

  }

  // =====================================================
  // SELECT DOOR
  // =====================================================

  onSelectDoor(gameId: string): void {

    // Không cho chọn nhiều cửa liên tiếp
    if (this.activeDoor() !== null) return;

    this.activeDoor.set(gameId);

    // Dừng âm thanh giới thiệu
    this.stopPromptAudio();

    // Bắt đầu phát MP3 của cửa được chọn
    // Promise chỉ hoàn thành khi MP3 phát xong hoặc bị lỗi
    const audioFinished = this.playDoorAudio(gameId);

    // Lấy danh sách các cửa
    const cards = Array.from(
      this.doorsGrid?.nativeElement.querySelectorAll<HTMLElement>(
        '.door-card'
      ) ?? []
    );

    const selectedCard = cards.find(
      card => card.dataset['doorId'] === gameId
    );

    // Hạt phép thuật
    if (selectedCard) {
      this.fireDoorParticles(gameId, selectedCard);
    }

    // Animation hoàn thành riêng biệt với âm thanh
    let animationFinished: Promise<void>;

    if (this.prefersReducedMotion()) {

      animationFinished = Promise.resolve();

    } else if (selectedCard) {

      animationFinished = this.playMagicalDoorAnimation(
        selectedCard,
        cards.filter(card => card !== selectedCard)
      );

    } else {

      animationFinished = Promise.resolve();

    }

    // Chỉ chuyển màn khi cả animation và MP3 đã xong
    void Promise.all([
      audioFinished,
      animationFinished
    ]).then(() => {

      if (this.destroyed) return;

      if (this.activeDoor() !== gameId) return;

      this.selectGame.emit(gameId);

    });

  }

  // =====================================================
  // PLAY DOOR MP3
  // =====================================================

  private playDoorAudio(gameId: string): Promise<void> {

    // Dừng âm thanh chọn cửa cũ nếu có
    this.stopSelectionAudio();

    if (this.isMuted()) {
      return Promise.resolve();
    }

    const audio = this.doorAudioCache.get(gameId);

    if (!audio) {
      console.warn('Không tìm thấy MP3 cho cửa:', gameId);
      return Promise.resolve();
    }

    this.selectionAudio = audio;

    audio.volume = 1;

    audio.currentTime = 0;

    return new Promise<void>(resolve => {

      let finished = false;

      let timeoutId: ReturnType<typeof setTimeout>;

      // Hoàn thành phát âm thanh
      const finish = (): void => {

        if (finished) return;

        finished = true;

        clearTimeout(timeoutId);

        audio.removeEventListener('ended', finish);
        audio.removeEventListener('error', finish);
        audio.removeEventListener('abort', finish);

        if (this.selectionAudio === audio) {
          this.selectionAudio = null;
        }

        if (this.finishSelectionAudio === finish) {
          this.finishSelectionAudio = null;
        }

        resolve();

      };

      audio.addEventListener('ended', finish);
      audio.addEventListener('error', finish);
      audio.addEventListener('abort', finish);

      // Có giới hạn để tránh bị treo nếu file lỗi hoặc không kết thúc
      timeoutId = setTimeout(finish, 12000);

      this.finishSelectionAudio = finish;

      // Bắt đầu phát MP3 ngay trong thao tác click
      void audio.play().catch(error => {

        console.warn('Không thể phát MP3:', error);

        finish();

      });

    });

  }

  // =====================================================
  // STOP DOOR AUDIO
  // =====================================================

  private stopSelectionAudio(): void {

    const audio = this.selectionAudio;

    // Giải phóng Promise đang chờ
    this.finishSelectionAudio?.();

    if (audio) {

      audio.pause();
      audio.currentTime = 0;

    }

    this.selectionAudio = null;
    this.finishSelectionAudio = null;

  }

  // =====================================================
  // MAGICAL DOOR REVEAL - GSAP
  // =====================================================

  private playMagicalDoorAnimation(
    selectedCard: HTMLElement,
    otherCards: HTMLElement[]
  ): Promise<void> {

    return new Promise<void>(resolve => {

      const image = selectedCard.querySelector<HTMLElement>(
        '.door-image-wrapper'
      );

      const glow = selectedCard.querySelector<HTMLElement>(
        '.door-magic-glow'
      );

      const rays = selectedCard.querySelector<HTMLElement>(
        '.sunburst-rays'
      );

      const badge = selectedCard.querySelector<HTMLElement>(
        '.door-label-badge'
      );

      if (!image || !glow || !rays || !badge) {

        resolve();
        return;

      }

      this.selectionTimeline?.kill();

      // Nâng cửa được chọn lên lớp trên cùng
      gsap.set(selectedCard, {

        zIndex: 50,

        transformPerspective: 1200,

        transformOrigin: '50% 65%'

      });

      const tl = gsap.timeline({

        onComplete: () => {

          this.selectionTimeline = null;

          resolve();

        }

      });

      this.selectionTimeline = tl;

      // -------------------------------------------------
      // PHASE 1: OTHER DOORS FADE OUT
      // -------------------------------------------------

      tl.to(
        otherCards,
        {
          autoAlpha: 0,

          scale: 0.78,

          y: 14,

          filter: 'blur(3px)',

          duration: 0.34,

          ease: 'power2.inOut'

        },
        0
      );

      // -------------------------------------------------
      // PHASE 2: SELECTED DOOR BOUNCE
      // -------------------------------------------------

      tl.fromTo(
        selectedCard,
        {
          scale: 0.90,
          y: 10,
          rotationY: -16,
          rotationZ: -2
        },
        {
          scale: 1.12,
          y: -12,
          rotationY: 8,
          rotationZ: 2,
          duration: 0.38,
          ease: 'back.out(2)'
        },
        0
      );

      tl.to(
        selectedCard,
        {
          scale: 1.08,
          y: -9,
          rotationY: 0,
          rotationZ: 0,
          duration: 0.23,
          ease: 'power2.out'
        },
        0.38
      );

      // -------------------------------------------------
      // PHASE 3: MAGIC GLOW
      // -------------------------------------------------

      tl.fromTo(
        glow,
        {
          autoAlpha: 0,
          scale: 0.5
        },
        {
          autoAlpha: 1,
          scale: 1.35,
          duration: 0.55,
          ease: 'power2.out'
        },
        0.02
      );

      // -------------------------------------------------
      // PHASE 4: SUNBURST
      // -------------------------------------------------

      tl.fromTo(
        rays,
        {
          autoAlpha: 0,
          scale: 0.25,
          rotation: -25
        },
        {
          autoAlpha: 0.95,
          scale: 1.08,
          rotation: 75,
          duration: 0.72,
          ease: 'power2.out'
        },
        0
      );

      // -------------------------------------------------
      // PHASE 5: IMAGE BOUNCE
      // -------------------------------------------------

      tl.fromTo(
        image,
        {
          y: 12,
          scale: 0.96
        },
        {
          y: -5,
          scale: 1.04,
          duration: 0.4,
          ease: 'back.out(1.8)'
        },
        0.08
      );

      // -------------------------------------------------
      // PHASE 6: BADGE BOUNCE
      // -------------------------------------------------

      tl.fromTo(
        badge,
        {
          scale: 0.82,
          y: 7
        },
        {
          scale: 1.08,
          y: -3,
          duration: 0.3,
          ease: 'back.out(2)'
        },
        0.16
      );

      tl.to(
        badge,
        {
          scale: 1.02,
          y: 0,
          duration: 0.18,
          ease: 'power2.out'
        },
        0.46
      );

      // -------------------------------------------------
      // PHASE 7: CAMERA ZOOM
      // -------------------------------------------------

      tl.to(
        selectedCard,
        {
          scale: 1.28,
          y: -8,
          duration: 0.36,
          ease: 'power2.in'
        },
        0.78
      );

    });

  }

  // =====================================================
  // MAGIC PARTICLES - CANVAS CONFETTI
  // =====================================================

  private fireDoorParticles(
    gameId: string,
    card: HTMLElement
  ): void {

    if (this.prefersReducedMotion()) return;

    const rect = card.getBoundingClientRect();

    const origin = {

      x: Math.max(
        0.05,
        Math.min(
          0.95,
          (rect.left + rect.width / 2) / window.innerWidth
        )
      ),

      y: Math.max(
        0.05,
        Math.min(
          0.9,
          (rect.top + rect.height * 0.4) / window.innerHeight
        )
      )

    };

    const colors = this.magicColors[gameId] ?? [
      '#FFFFFF',
      '#FDE047'
    ];

    // Lượt bắn sao đầu tiên
    confetti({

      particleCount: 26,

      spread: 75,

      startVelocity: 28,

      gravity: 0.9,

      decay: 0.92,

      ticks: 110,

      scalar: 0.9,

      origin,

      colors,

      shapes: ['star', 'circle'],

      zIndex: 1000,

      disableForReducedMotion: true

    });

    // Lượt bắn sao thứ hai
    if (this.particleTimer !== null) {
      clearTimeout(this.particleTimer);
    }

    this.particleTimer = setTimeout(() => {

      this.particleTimer = null;

      if (this.destroyed) return;

      if (this.activeDoor() !== gameId) return;

      confetti({

        particleCount: 16,

        spread: 105,

        startVelocity: 20,

        gravity: 0.85,

        ticks: 100,

        scalar: 0.7,

        origin,

        colors,

        shapes: ['star', 'circle'],

        zIndex: 1000,

        disableForReducedMotion: true

      });

    }, 180);

  }

  // =====================================================
  // ACCESSIBILITY
  // =====================================================

  private prefersReducedMotion(): boolean {

    return (
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    );

  }

}
