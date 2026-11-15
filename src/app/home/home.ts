import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  effect
} from '@angular/core';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

type ScreenType = 'home' | 'select' | 'game-3a' | 'game-3b' | 'game-3c' | 'success';

interface GameItem {
  id: string;
  label: string;
  emoji: string;
  isCorrect: boolean;
  colorHex?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas') threeCanvas?: ElementRef<HTMLCanvasElement>;

  // Quản lý trạng thái bằng Signals chuẩn Angular 21
  currentScreen = signal<ScreenType>('home');
  isAudioMuted = signal<boolean>(false);
  feedbackType = signal<'correct' | 'incorrect' | null>(null);
  feedbackMessage = signal<string>('');
  selectedItemId = signal<string | null>(null);
  showNextButton = signal<boolean>(false);

  // Dữ liệu từng màn chơi bám sát mockup
  screenData: Record<'game-3a' | 'game-3b' | 'game-3c', { prompt: string; items: GameItem[] }> = {
    'game-3a': {
      prompt: 'Bé tìm quả bóng nhé!',
      items: [
        { id: 'ball', label: 'Quả bóng', emoji: '⚽', isCorrect: true },
        { id: 'duck', label: 'Con vịt', emoji: '🦆', isCorrect: false },
        { id: 'bear', label: 'Gấu bông', emoji: '🧸', isCorrect: false }
      ]
    },
    'game-3b': {
      prompt: 'Ò ó o! Đâu là con gà?',
      items: [
        { id: 'chicken', label: 'Con gà', emoji: '🐔', isCorrect: true },
        { id: 'dog', label: 'Con chó', emoji: '🐶', isCorrect: false },
        { id: 'cat', label: 'Con mèo', emoji: '🐱', isCorrect: false }
      ]
    },
    'game-3c': {
      prompt: 'Bé tìm quả bóng màu đỏ nhé!',
      items: [
        { id: 'red-ball', label: 'Bóng đỏ', emoji: '🔴', isCorrect: true, colorHex: '#ef4444' },
        { id: 'blue-ball', label: 'Bóng xanh', emoji: '🔵', isCorrect: false, colorHex: '#3b82f6' },
        { id: 'yellow-ball', label: 'Bóng vàng', emoji: '🟡', isCorrect: false, colorHex: '#eab308' }
      ]
    }
  };

  // Biến quản lý Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mascotMesh!: THREE.Mesh;
  private animationFrameId = 0;

  constructor() {
    // Tự động đọc lời hướng dẫn khi chuyển màn hình
    effect(() => {
      const screen = this.currentScreen();
      if (screen === 'home') {
        this.speak('Xin chào các bé! Hôm nay chúng mình cùng khám phá nhé!');
      } else if (screen === 'select') {
        this.speak('Bé muốn khám phá gì nào?');
      } else if (screen === 'game-3a' || screen === 'game-3b' || screen === 'game-3c') {
        this.speak(this.screenData[screen].prompt);
      } else if (screen === 'success') {
        this.speak('Hoan hô! Bé đã khám phá thật giỏi!');
        this.fireConfetti();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.renderer?.dispose();
  }

  // Khởi tạo vật thể 3D nền (ngôi sao/khối cầu 3D xoay nhẹ tạo chiều sâu)
  private initThreeJS(): void {
    if (!this.threeCanvas) return;
    const canvas = this.threeCanvas.nativeElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ánh sáng mềm mại phong cách pastel
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    // Tạo khối ngôi sao / khối cầu 3D nổi bồng bềnh
    const geometry = new THREE.IcosahedronGeometry(1.1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.1
    });
    this.mascotMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mascotMesh);

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.mascotMesh.rotation.y += 0.01;
      this.mascotMesh.rotation.x += 0.005;
      this.mascotMesh.position.y = Math.sin(Date.now() * 0.002) * 0.15;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // Điều hướng màn hình
  goToScreen(screen: ScreenType): void {
    this.currentScreen.set(screen);
    this.feedbackType.set(null);
    this.selectedItemId.set(null);
    this.showNextButton.set(false);
  }

  toggleAudio(): void {
    this.isAudioMuted.update(v => !v);
    if (this.isAudioMuted()) {
      window.speechSynthesis?.cancel();
    }
  }

  // Xử lý khi bé chạm vào item
  handleSelect(item: GameItem): void {
    this.selectedItemId.set(item.id);

    if (item.isCorrect) {
      this.feedbackType.set('correct');
      this.feedbackMessage.set('Đúng rồi! Bé giỏi quá!');
      this.showNextButton.set(true);
      this.speak('Đúng rồi! Bé giỏi quá!');
      this.fireConfetti();
    } else {
      this.feedbackType.set('incorrect');
      this.feedbackMessage.set('Bé thử lại nhé!');
      this.speak('Bé thử lại nhé! Bé tìm xem nào!');

      // Tự động tắt rung sau 800ms để bé chọn lại
      setTimeout(() => {
        if (this.feedbackType() === 'incorrect') {
          this.feedbackType.set(null);
          this.selectedItemId.set(null);
        }
      }, 1000);
    }
  }

  // Hiệu ứng bắn pháo hoa chúc mừng
  private fireConfetti(): void {
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#f87171', '#fbbf24', '#34d399', '#60a5fa']
    });
  }

  // Giả lập giọng đọc AI cô giáo (Web Speech API)
  private speak(text: string): void {
    if (this.isAudioMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9; // Đọc chậm, rõ ràng cho trẻ 13-18 tháng
    utterance.pitch = 1.15; // Giọng nữ ấm áp, tươi vui
    window.speechSynthesis.speak(utterance);
  }
}