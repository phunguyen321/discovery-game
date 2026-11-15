import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-find-item',
  imports: [],
  templateUrl: './find-item.html',
  styleUrl: './find-item.scss',
})
export class FindItem {
  goBack = output<void>();

  isMuted = signal<boolean>(false);
  selectedId = signal<string | null>(null);

  items = [
    { id: 'ball', title: 'Quả bóng', img: '/images/red-ball.png', alt: 'Quả bóng đỏ', isTarget: true },
    { id: 'duck', title: 'Con vịt', img: '/images/yellow-duck.png', alt: 'Con vịt vàng', isTarget: false },
    { id: 'bear', title: 'Gấu bông', img: '/images/teddy-bear.png', alt: 'Gấu bông', isTarget: false }
  ];

  ngOnInit(): void {
    this.playInstructionVoice();
  }

  toggleAudio(event: Event): void {
    event.stopPropagation();
    this.isMuted.update(m => !m);
    if (this.isMuted()) {
      window.speechSynthesis?.cancel();
    } else {
      this.playInstructionVoice();
    }
  }

  playInstructionVoice(): void {
    if (this.isMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance('Bé tìm quả bóng nhé!');
    msg.lang = 'vi-VN';
    msg.rate = 0.9;
    msg.pitch = 1.15;
    window.speechSynthesis.speak(msg);
  }

  onSelectItem(item: { id: string; isTarget: boolean }): void {
    if (this.selectedId() !== null) return;

    this.selectedId.set(item.id);

    if (item.isTarget) {
      this.playFeedbackVoice(true);
      setTimeout(() => {
        // Xử lý chuyển tiếp khi hoàn thành màn chơi
      }, 1500);
    } else {
      this.playFeedbackVoice(false);
      setTimeout(() => {
        this.selectedId.set(null);
      }, 600);
    }
  }

  private playFeedbackVoice(isCorrect: boolean): void {
    if (this.isMuted() || !('speechSynthesis' in window)) return;
    const text = isCorrect ? 'Chính xác! Bé giỏi quá!' : 'Chưa đúng rồi, thử lại nhé!';
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.95;
    msg.pitch = 1.2;
    window.speechSynthesis.speak(msg);
  }
}