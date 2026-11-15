import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-select-screen',
  templateUrl: './select-screen.html',
  styleUrl: './select-screen.scss',
  standalone: true
})
export class SelectScreen {
  selectGame = output<string>();
  goHome = output<void>();

  isMuted = signal<boolean>(false);
  activeDoor = signal<string | null>(null);

  doors = [
    { id: 'game-3a', title: 'TÌM ĐỒ VẬT', img: '/images/balloon-door.png', alt: 'Cửa tìm đồ vật' },
    { id: 'game-3b', title: 'TÌM CON VẬT', img: '/images/animal-door.png', alt: 'Cửa tìm con vật' },
    { id: 'game-3c', title: 'TÌM MÀU ĐỎ', img: '/images/apple-door.png', alt: 'Cửa tìm màu đỏ' }
  ];

  ngOnInit(): void {
    this.playPromptVoice();
  }

  toggleAudio(event: Event): void {
    event.stopPropagation();
    this.isMuted.update(m => !m);
    if (this.isMuted()) {
      window.speechSynthesis?.cancel();
    } else {
      this.playPromptVoice();
    }
  }

  onSelectDoor(gameId: string): void {
    // Ngăn chặn bấm nhiều lần khi đã chọn 1 ô
    if (this.activeDoor() !== null) return;

    this.activeDoor.set(gameId);
    this.playTapSoundAndVoice(gameId);

    // Giữ hiệu ứng phóng to & tia sáng tỏa ra trong 650ms rồi chuyển màn hình
    setTimeout(() => {
      this.selectGame.emit(gameId);
    }, 650);
  }

  private playPromptVoice(): void {
    if (this.isMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance('Bé muốn khám phá gì nào?');
    msg.lang = 'vi-VN';
    msg.rate = 0.9;
    msg.pitch = 1.15;
    window.speechSynthesis.speak(msg);
  }

  private playTapSoundAndVoice(gameId: string): void {
    if (this.isMuted() || !('speechSynthesis' in window)) return;
    let text = 'Khám phá thôi!';
    if (gameId === 'game-3a') text = 'Tìm đồ vật nhé!';
    if (gameId === 'game-3b') text = 'Tìm con vật nhé!';
    if (gameId === 'game-3c') text = 'Tìm màu đỏ nhé!';

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.95;
    window.speechSynthesis.speak(msg);
  }
}