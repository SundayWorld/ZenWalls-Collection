// utils/coverRotation.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRotationMeta, getHoursUntilNextDrop } from '@/utils/trendingRotation';

const ROTATION_KEY = 'zenwalls_cover_rotation_v2';

interface RotationState {
  slotId: string;
  coverIndices: Record<string, number>;
}

function hashStringToInt(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateDeterministicIndex(collectionId: string, slotId: string, maxIndex: number): number {
  if (maxIndex <= 0) return 0;
  return hashStringToInt(`${collectionId}-${slotId}`) % maxIndex;
}

/**
 * ✅ Rotates cover index by your Morning/Night slot:
 * Morning: 08:00–19:59
 * Night:   20:00–07:59
 */
export async function getRotatedCoverIndex(
  collectionId: string,
  totalCovers: number
): Promise<number> {
  const { slotId } = getRotationMeta();

  try {
    const stored = await AsyncStorage.getItem(ROTATION_KEY);
    let state: RotationState = stored
      ? JSON.parse(stored)
      : { slotId, coverIndices: {} };

    if (state.slotId !== slotId) {
      state = { slotId, coverIndices: {} };
    }

    if (state.coverIndices[collectionId] === undefined) {
      state.coverIndices[collectionId] = generateDeterministicIndex(collectionId, slotId, totalCovers);
      await AsyncStorage.setItem(ROTATION_KEY, JSON.stringify(state));
    }

    return state.coverIndices[collectionId];
  } catch (error) {
    console.error('[CoverRotation] Error getting rotation index:', error);
    return generateDeterministicIndex(collectionId, slotId, totalCovers);
  }
}

export function getRotationBlockInfo(): { isNewBlock: boolean; hoursUntilNext: number } {
  const { slotId } = getRotationMeta();

  // “new block” = first minute after the slot starts
  const now = new Date();
  const isNewBlock = now.getMinutes() === 0 && now.getSeconds() < 60;

  return {
    isNewBlock,
    hoursUntilNext: getHoursUntilNextDrop(now),
  };
}

