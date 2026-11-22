
import { Injectable, computed, signal } from '@angular/core';

export type ImageScreen =
  | 'home'
  | 'select'
  | 'find-item'
  | 'find-animal'
  | 'find-color'
  | 'win';

@Injectable({
  providedIn: 'root'
})
export class ImagePreloader {
  private readonly CONCURRENCY = 4;

  private readonly loadedImages = new Set<string>();
  private readonly imagePromises = new Map<string, Promise<boolean>>();

  readonly totalImages = signal(0);
  readonly loadedCount = signal(0);
  readonly failedCount = signal(0);
  readonly isPreloading = signal(false);

  readonly progress = computed(() => {
    const total = this.totalImages();

    if (total === 0) {
      return 100;
    }

    return Math.round((this.loadedCount() / total) * 100);
  });

  /**
   * Danh sách ảnh của toàn bộ ứng dụng.
   * Các đường dẫn này tương ứng với những ảnh đã xuất hiện
   * trong các component bạn đã gửi.
   */
  private readonly imageManifest: Record<ImageScreen, string[]> = {
    home: [
      '/images/bg-meadow.jpg',
      '/images/char-teacher.png',
      '/images/char-bunny.png'
    ],

    select: [
      '/images/bg-screen2.png',
      '/images/character-avatar.png',
      '/images/balloon-door.png',
      '/images/animal-door.png',
      '/images/apple-door.png'
      // Bổ sung ảnh các cánh cửa trong SelectScreen tại đây.
      // Ví dụ: '/images/door-game-1.png'
    ],

    'find-item': [
      '/images/bg-find-item.png',
      '/images/character-avatar.png',
      '/images/red-ball.png',
      '/images/yellow-duck.png',
      '/images/teddy-bear.png'
    ],

    'find-animal': [
      '/images/bg-screen2.png',
      '/images/character-avatar.png',
      '/images/chicken.png',
      '/images/dog.png',
      '/images/cat.png'
    ],

    'find-color': [
      '/images/bg-screen2.png',
      '/images/character-avatar.png',
      '/images/red-ball.png',
      '/images/ball-blue.png',
      '/images/ball-yellow.png'
    ],

    win: [
      '/images/bg-win.png',
      '/images/bg-win-doc.png'
    ]
  };

  /**
   * Tải trước toàn bộ ảnh của ứng dụng.
   */
  async preloadAll(): Promise<void> {
    const allImages = [
      ...new Set(
        Object.values(this.imageManifest).flat()
      )
    ];

    await this.preload(allImages);
  }

  /**
   * Tải ảnh của một màn hình cụ thể.
   */
  async preloadScreen(screen: ImageScreen): Promise<void> {
    const images = this.imageManifest[screen] ?? [];

    await this.preload(images);
  }

  /**
   * Tải một danh sách ảnh với số lượng request đồng thời giới hạn.
   */
  async preload(images: string[]): Promise<void> {
    const uniqueImages = [...new Set(images)].filter(
      image => !this.loadedImages.has(image)
    );

    if (uniqueImages.length === 0) {
      return;
    }

    this.isPreloading.set(true);
    this.totalImages.update(value => value + uniqueImages.length);

    let currentIndex = 0;

    const worker = async (): Promise<void> => {
      while (currentIndex < uniqueImages.length) {
        const imageUrl = uniqueImages[currentIndex++];

        const success = await this.loadImage(imageUrl);

        if (success) {
          this.loadedCount.update(value => value + 1);
        } else {
          this.failedCount.update(value => value + 1);
        }
      }
    };

    const workerCount = Math.min(
      this.CONCURRENCY,
      uniqueImages.length
    );

    await Promise.all(
      Array.from(
        { length: workerCount },
        () => worker()
      )
    );

    this.isPreloading.set(false);
  }

  /**
   * Tải và giải mã một ảnh.
   * Promise được lưu lại để tránh tải trùng khi nhiều component
   * cùng yêu cầu một ảnh.
   */
  private loadImage(url: string): Promise<boolean> {
    if (this.loadedImages.has(url)) {
      return Promise.resolve(true);
    }

    const existingPromise = this.imagePromises.get(url);

    if (existingPromise) {
      return existingPromise;
    }

    const promise = new Promise<boolean>(resolve => {
      const image = new Image();

      image.onload = async () => {
        try {
          if (typeof image.decode === 'function') {
            await image.decode();
          }

          this.loadedImages.add(url);
          resolve(true);
        } catch {
          // Ảnh đã tải nhưng trình duyệt không decode được.
          // Không đánh dấu thành công để có thể thử lại sau.
          resolve(false);
        }
      };

      image.onerror = () => {
        resolve(false);
      };

      image.src = url;
    });

    this.imagePromises.set(url, promise);

    return promise;
  }

  /**
   * Kiểm tra một ảnh đã được tải thành công hay chưa.
   */
  isLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }

  /**
   * Xóa trạng thái lỗi để có thể thử tải lại.
   */
  retryFailedImage(url: string): Promise<boolean> {
    this.imagePromises.delete(url);
    return this.loadImage(url);
  }
}
