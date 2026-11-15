import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-door',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="door-container">
      <!-- Lớp 1: Đồ vật nằm ở phía sau (Nằm lọt vào khung tròn của cửa) -->
      <div class="item-layer">
        <img [src]="itemImage()" alt="Game Item" class="game-item" />
      </div>

      <!-- Lớp 2: Cánh cửa trống nằm đè lên trên -->
      <div class="door-layer">
        <img [src]="doorImage()" alt="Door Frame" class="door-frame" />
      </div>
    </div>
  `,
  styles: `
    .door-container {
      position: relative;
      width: 280px;  /* Kích thước bạn có thể tùy chỉnh theo layout */
      height: 380px;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }

    /* Cánh cửa nằm đè phía trên */
    .door-layer {
      position: absolute;
      inset: 0;
      z-index: 2; /* Đảm bảo cửa luôn nằm trên đồ vật */
      pointer-events: none; /* Giúp các sự kiện click xuyên qua nếu cần */
    }

    .door-frame {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* Lớp chứa đồ vật nằm phía dưới */
    .item-layer {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      /* Tinh chỉnh padding hoặc margin nếu ô tròn lệch tâm */
      padding-bottom: 15px; 
    }

    .game-item {
      width: 110px; /* Kích thước khớp với đường kính khung tròn trên cửa */
      height: 110px;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    /* Hiệu ứng khi bé bấm vào cửa/đồ vật */
    .door-container:hover .game-item {
      transform: scale(1.1);
    }
  `
})
export class DynamicDoor {
  // Input dạng Angular Signals mới nhất
  doorImage = input.required<string>();
  itemImage = input.required<string>();
}