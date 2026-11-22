
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  output,
  signal
} from '@angular/core';

import { WinModal } from '../win-modal/win-modal';

import { shuffleTargetPosition } from '../shared/utils/shuffle-target';

import gsap from 'gsap';
import confetti from 'canvas-confetti';

interface ColorOption {
  id: string;
  title: string;
  img: string;
  alt: string;
  isTarget: boolean;
}

type AudioKey = 'instruction' | 'correct' | 'wrong';

@Component({
  selector: 'app-find-color',
  standalone: true,
  imports: [WinModal],
  templateUrl: './find-color.html',
  styleUrl: './find-color.scss',
})
export class FindColor implements OnInit, OnDestroy {

  @ViewChild('itemsGrid')
  private itemsGrid?: ElementRef<HTMLDivElement>;

  goBack = output<void>();

  isMuted = signal<boolean>(false);
  selectedId = signal<string | null>(null);
  isCompleted = signal<boolean>(false);
  isBusy = signal<boolean>(false);

  // =====================================================
  // ORIGINAL ITEMS
  // =====================================================

  private readonly originalItems: ColorOption[] = [

    {
      id: 'red-ball',
      title: 'Quả bóng đỏ',
      img: '/images/red-ball.png',
      alt: 'Quả bóng màu đỏ',
      isTarget: true
    },

    {
      id: 'blue-ball',
      title: 'Quả bóng xanh',
      img: '/images/ball-blue.png',
      alt: 'Quả bóng màu xanh dương',
      isTarget: false
    },

    {
      id: 'yellow-ball',
      title: 'Quả bóng vàng',
      img: '/images/ball-yellow.png',
      alt: 'Quả bóng màu vàng',
      isTarget: false
    }

  ];

  // RANDOM NGAY KHI KHỞI TẠO
  items: ColorOption[] = shuffleTargetPosition(
    'find-color',
    this.originalItems
  );

  // =====================================================
  // AUDIO
  // =====================================================

  private audioFiles: Record<AudioKey, string> = {

    instruction: '/audio/find-color.mp3',

    correct: '/audio/correct.mp3',

    wrong: '/audio/wrong.wav'

  };

  private audioElements = new Map<AudioKey, HTMLAudioElement>();

  private activeAudio: HTMLAudioElement | null = null;

  private activeAudioFinish: (() => void) | null = null;

  // =====================================================
  // GSAP
  // =====================================================

  private selectionTimeline: gsap.core.Timeline | null = null;

  private animationFinish: (() => void) | null = null;

  private destroyed = false;

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.preloadAudio();

    void this.playAudio('instruction');

  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.destroyed = true;

    this.stopAnimation();

    this.stopActiveAudio();

    this.resetBoardVisuals();

    this.audioElements.forEach(audio => {

      audio.pause();

      audio.currentTime = 0;

      audio.src = '';

    });

    this.audioElements.clear();

    confetti.reset();

  }

  // =====================================================
  // PRELOAD AUDIO
  // =====================================================

  private preloadAudio(): void {

    if (typeof Audio === 'undefined') return;

    (Object.keys(this.audioFiles) as AudioKey[]).forEach(key => {

      const audio = new Audio(this.audioFiles[key]);

      audio.preload = 'auto';

      audio.volume = 1;

      this.audioElements.set(key, audio);

      audio.load();

    });

  }

  // =====================================================
  // PLAY AUDIO
  // =====================================================

  private playAudio(key: AudioKey): Promise<void> {

    if (this.destroyed || this.isMuted()) {
      return Promise.resolve();
    }

    const audio = this.audioElements.get(key);

    if (!audio) {

      console.warn(
        'Không tìm thấy MP3:',
        this.audioFiles[key]
      );

      return Promise.resolve();

    }

    this.stopActiveAudio();

    audio.currentTime = 0;

    audio.volume = 1;

    return new Promise<void>(resolve => {

      let finished = false;

      let timeoutId: ReturnType<typeof setTimeout>;

      const finish = (): void => {

        if (finished) return;

        finished = true;

        clearTimeout(timeoutId);

        audio.removeEventListener('ended', finish);
        audio.removeEventListener('error', finish);
        audio.removeEventListener('abort', finish);

        if (this.activeAudio === audio) {
          this.activeAudio = null;
        }

        if (this.activeAudioFinish === finish) {
          this.activeAudioFinish = null;
        }

        resolve();

      };

      this.activeAudio = audio;

      this.activeAudioFinish = finish;

      audio.addEventListener('ended', finish);
      audio.addEventListener('error', finish);
      audio.addEventListener('abort', finish);

      timeoutId = setTimeout(finish, 15000);

      void audio.play().catch(error => {

        console.warn('Không thể phát MP3:', error);

        finish();

      });

    });

  }

  // =====================================================
  // STOP AUDIO
  // =====================================================

  private stopActiveAudio(): void {

    const audio = this.activeAudio;

    if (audio) {

      audio.pause();

      audio.currentTime = 0;

    }

    this.activeAudioFinish?.();

    this.activeAudio = null;

    this.activeAudioFinish = null;

  }

  // =====================================================
  // INSTRUCTION
  // =====================================================

  replayInstructionAudio(): void {

    if (this.isBusy() || this.isCompleted()) return;

    void this.playAudio('instruction');

  }

  // =====================================================
  // TOGGLE AUDIO
  // =====================================================

  toggleAudio(event: Event): void {

    event.stopPropagation();

    this.isMuted.update(m => !m);

    if (this.isMuted()) {

      this.stopActiveAudio();

    } else if (!this.isBusy() && !this.isCompleted()) {

      void this.playAudio('instruction');

    }

  }

  // =====================================================
  // SELECT COLOR
  // =====================================================

  async onSelectItem(item: ColorOption): Promise<void> {

    if (
      this.isBusy() ||
      this.isCompleted() ||
      this.selectedId() !== null
    ) {
      return;
    }

    this.isBusy.set(true);

    this.selectedId.set(item.id);

    const cards = Array.from(
      this.itemsGrid?.nativeElement.querySelectorAll<HTMLElement>(
        '.color-card'
      ) ?? []
    );

    const selectedCard = cards.find(
      card => card.dataset['itemId'] === item.id
    );

    const otherCards = cards.filter(
      card => card !== selectedCard
    );

    if (item.isTarget) {

      const audioTask = this.playAudio('correct');

      const animationTask =
        selectedCard && !this.prefersReducedMotion()
          ? this.playCorrectAnimation(selectedCard, otherCards)
          : Promise.resolve();

      await Promise.all([
        audioTask,
        animationTask
      ]);

      if (this.destroyed) return;

      this.isBusy.set(false);

      this.isCompleted.set(true);

    } else {

      const audioTask = this.playAudio('wrong');

      const animationTask =
        selectedCard && !this.prefersReducedMotion()
          ? this.playWrongAnimation(selectedCard)
          : Promise.resolve();

      await Promise.all([
        audioTask,
        animationTask
      ]);

      if (this.destroyed) return;

      this.resetBoardVisuals();

      this.selectedId.set(null);

      this.isBusy.set(false);

    }

  }

  // =====================================================
  // CORRECT ANIMATION
  // =====================================================

  private playCorrectAnimation(
    selectedCard: HTMLElement,
    otherCards: HTMLElement[]
  ): Promise<void> {

    const artboard = selectedCard.querySelector<HTMLElement>(
      '.color-artboard'
    );

    const glow = selectedCard.querySelector<HTMLElement>(
      '.color-glow'
    );

    const rays = selectedCard.querySelector<HTMLElement>(
      '.color-rays'
    );

    const image = selectedCard.querySelector<HTMLElement>(
      '.color-ball-wrapper'
    );

    if (!artboard || !glow || !rays || !image) {

      this.fireColorConfetti(selectedCard);

      return Promise.resolve();

    }

    gsap.set(selectedCard, {
      zIndex: 50,
      transformPerspective: 1200,
      transformOrigin: '50% 60%'
    });

    this.fireColorConfetti(selectedCard);

    return new Promise<void>(resolve => {

      let finished = false;

      const finish = (): void => {

        if (finished) return;

        finished = true;

        this.selectionTimeline = null;

        this.animationFinish = null;

        resolve();

      };

      const tl = gsap.timeline({
        onComplete: finish
      });

      this.selectionTimeline = tl;

      this.animationFinish = finish;

      tl.to(
        otherCards,
        {
          autoAlpha: 0.25,
          scale: 0.82,
          y: 12,
          filter: 'blur(3px)',
          duration: 0.35,
          ease: 'power2.inOut'
        },
        0
      );

      tl.fromTo(
        selectedCard,
        {
          scale: 0.88,
          y: 12,
          rotationZ: -5
        },
        {
          scale: 1.13,
          y: -15,
          rotationZ: 3,
          duration: 0.4,
          ease: 'back.out(2)'
        },
        0
      );

      tl.to(
        selectedCard,
        {
          scale: 1.07,
          y: -9,
          rotationZ: 0,
          duration: 0.25,
          ease: 'power2.out'
        },
        0.4
      );

      tl.fromTo(
        glow,
        {
          autoAlpha: 0,
          scale: 0.5
        },
        {
          autoAlpha: 1,
          scale: 1.4,
          duration: 0.65,
          ease: 'power2.out'
        },
        0.05
      );

      tl.fromTo(
        rays,
        {
          autoAlpha: 0,
          scale: 0.25,
          rotation: -25
        },
        {
          autoAlpha: 1,
          scale: 1.15,
          rotation: 80,
          duration: 0.8,
          ease: 'power2.out'
        },
        0
      );

      tl.fromTo(
        image,
        {
          scale: 0.85,
          y: 15,
          rotation: -12
        },
        {
          scale: 1.15,
          y: -5,
          rotation: 8,
          duration: 0.4,
          ease: 'back.out(2)'
        },
        0.05
      );

      tl.to(
        image,
        {
          rotation: 0,
          scale: 1.06,
          duration: 0.2,
          ease: 'power2.out'
        },
        0.45
      );

      tl.to(
        artboard,
        {
          scale: 1.06,
          duration: 0.3,
          ease: 'power2.out'
        },
        0.65
      );

      tl.to(
        artboard,
        {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out'
        },
        0.95
      );

    });

  }

  // =====================================================
  // WRONG ANIMATION
  // =====================================================

  private playWrongAnimation(
    selectedCard: HTMLElement
  ): Promise<void> {

    gsap.set(selectedCard, {
      zIndex: 40
    });

    return new Promise<void>(resolve => {

      let finished = false;

      const finish = (): void => {

        if (finished) return;

        finished = true;

        this.selectionTimeline = null;

        this.animationFinish = null;

        resolve();

      };

      const tl = gsap.timeline({
        onComplete: finish
      });

      this.selectionTimeline = tl;

      this.animationFinish = finish;

      tl.to(selectedCard, {
        x: -10,
        rotationZ: -3,
        duration: 0.08,
        ease: 'power1.inOut'
      });

      tl.to(selectedCard, {
        x: 10,
        rotationZ: 3,
        duration: 0.08,
        ease: 'power1.inOut'
      });

      tl.to(selectedCard, {
        x: -7,
        rotationZ: -2,
        duration: 0.08,
        ease: 'power1.inOut'
      });

      tl.to(selectedCard, {
        x: 7,
        rotationZ: 2,
        duration: 0.08,
        ease: 'power1.inOut'
      });

      tl.to(selectedCard, {
        x: 0,
        rotationZ: 0,
        scale: 1,
        duration: 0.2,
        ease: 'back.out(1.5)'
      });

    });

  }

  // =====================================================
  // COLOR CONFETTI
  // =====================================================

  private fireColorConfetti(card: HTMLElement): void {

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

    confetti({
      particleCount: 50,
      spread: 90,
      startVelocity: 32,
      gravity: 0.8,
      decay: 0.92,
      ticks: 130,
      scalar: 1,
      origin,
      colors: [
        '#EF4444',
        '#F59E0B',
        '#FDE047',
        '#22C55E',
        '#38BDF8',
        '#A855F7',
        '#FFFFFF'
      ],
      shapes: ['star', 'circle'],
      zIndex: 10000,
      disableForReducedMotion: true
    });

    confetti({
      particleCount: 26,
      spread: 125,
      startVelocity: 22,
      gravity: 0.75,
      decay: 0.94,
      ticks: 110,
      scalar: 0.75,
      origin,
      colors: [
        '#FFFFFF',
        '#FCA5A5',
        '#FDE68A',
        '#F9A8D4'
      ],
      shapes: ['star', 'circle'],
      zIndex: 10000,
      disableForReducedMotion: true
    });

  }

  // =====================================================
  // RESET VISUALS
  // =====================================================

  private resetBoardVisuals(): void {

    const cards = Array.from(
      this.itemsGrid?.nativeElement.querySelectorAll<HTMLElement>(
        '.color-card'
      ) ?? []
    );

    cards.forEach(card => {

      const elements = [

        card,

        card.querySelector<HTMLElement>('.color-artboard'),

        card.querySelector<HTMLElement>('.color-glow'),

        card.querySelector<HTMLElement>('.color-rays'),

        card.querySelector<HTMLElement>('.color-ball-wrapper')

      ].filter(
        (element): element is HTMLElement => element !== null
      );

      elements.forEach(element => {

        gsap.killTweensOf(element);

        gsap.set(element, {
          clearProps: 'transform,opacity,visibility,filter,zIndex'
        });

      });

    });

  }

  // =====================================================
  // STOP ANIMATION
  // =====================================================

  private stopAnimation(): void {

    this.selectionTimeline?.kill();

    this.selectionTimeline = null;

    this.animationFinish?.();

    this.animationFinish = null;

  }

  // =====================================================
  // REDUCED MOTION
  // =====================================================

  private prefersReducedMotion(): boolean {

    return (
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    );

  }

  // =====================================================
  // REPLAY - RANDOMIZE COLOR POSITION
  // =====================================================

  handleReplay(): void {

    this.stopAnimation();

    this.stopActiveAudio();

    confetti.reset();

    this.resetBoardVisuals();

    // RANDOM LẠI BA QUẢ BÓNG
    // QUẢ BÓNG ĐỎ ĐỔI VỊ TRÍ SO VỚI LƯỢT TRƯỚC
    this.items = shuffleTargetPosition(
      'find-color',
      this.originalItems
    );

    this.selectedId.set(null);

    this.isCompleted.set(false);

    this.isBusy.set(false);

    if (!this.isMuted()) {
      void this.playAudio('instruction');
    }

  }

  // =====================================================
  // GO BACK
  // =====================================================

  handleGoBack(): void {

    this.stopAnimation();

    this.stopActiveAudio();

    confetti.reset();

    this.goBack.emit();

  }

}
