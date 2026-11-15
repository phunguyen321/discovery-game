import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-select-screen',
  templateUrl: './select-screen.html',
  styleUrl: './select-screen.scss'
})
export class SelectScreen {
  // Phát sự kiện khi bé chọn 1 trong 3 thử thách
  selectGame = output<string>();

  // Phát sự kiện nếu bé muốn về lại trang Home
  goHome = output<void>();

  isMuted = signal<boolean>(false);
  activeDoor = signal<string | null>(null);

  doors = [
    { id: 'game-3a', title: 'TÌM ĐỒ VẬT', img: '/images/door-yellow.png', alt: 'Cửa tìm đồ vật' },
    { id: 'game-3b', title: 'TÌM CON VẬT', img: '/images/door-pink.png', alt: 'Cửa tìm con vật' },
    { id: 'game-3c', title: 'TÌM MÀU ĐỎ', img: '/images/door-purple.png', alt: 'Cửa tìm màu đỏ' }
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
    this.activeDoor.set(gameId);
    this.playTapSoundAndVoice(gameId);

    // Hiệu ứng mở cửa nhẹ 400ms trước khi routing sang màn hình chơi tương ứng
    setTimeout(() => {
      this.selectGame.emit(gameId);
    }, 400);
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