
/**
 * Random hóa thứ tự đồ vật và vị trí đáp án đúng.
 *
 * Đảm bảo đáp án đúng không nằm cùng vị trí
 * với lượt chơi trước của cùng một game.
 */

const previousTargetPositions = new Map<string, number>();

export function shuffleTargetPosition<T extends { isTarget: boolean }>(
    gameKey: string,
    source: readonly T[]
): T[] {

    const result = [...source];

    // Fisher-Yates Shuffle
    for (let i = result.length - 1; i > 0; i--) {

        const randomIndex = Math.floor(
            Math.random() * (i + 1)
        );

        const current = result[i];
        const random = result[randomIndex];

        if (current !== undefined && random !== undefined) {

            result[i] = random;
            result[randomIndex] = current;

        }

    }

    // Tìm vị trí đáp án đúng
    const targetIndex = result.findIndex(
        item => item.isTarget
    );

    const previousIndex = previousTargetPositions.get(gameKey);

    // Không cho đáp án đúng xuất hiện cùng vị trí
    // ở hai lượt liên tiếp
    if (
        targetIndex >= 0 &&
        previousIndex !== undefined &&
        targetIndex === previousIndex &&
        result.length > 1
    ) {

        // Chọn một vị trí khác để đổi chỗ
        const offset =
            1 + Math.floor(Math.random() * (result.length - 1));

        const swapIndex =
            (targetIndex + offset) % result.length;

        const target = result[targetIndex];
        const other = result[swapIndex];

        if (target !== undefined && other !== undefined) {

            result[targetIndex] = other;
            result[swapIndex] = target;

        }

    }

    // Lưu vị trí đáp án đúng hiện tại
    const newTargetIndex = result.findIndex(
        item => item.isTarget
    );

    if (newTargetIndex >= 0) {
        previousTargetPositions.set(gameKey, newTargetIndex);
    }

    return result;

}
