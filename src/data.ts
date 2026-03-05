// 明日方舟天赋养成模拟器 - 干员数据
import type { Operator, TalentConfig } from './types';
import { calculateCurrentMax } from './types';

// 阿米娅的天赋配置（总上限：勇气9、体魄6、信念12、智慧15）
const AMIYA_TALENT_TOTALS: Record<string, number> = {
  '勇气': 9,
  '体魄': 6,
  '信念': 12,
  '智慧': 15,
};

// 星熊的天赋配置（总上限：勇气9、体魄15、毅力12、感知6）
const HOSHIGUMA_TALENT_TOTALS: Record<string, number> = {
  '勇气': 9,
  '体魄': 15,
  '毅力': 12,
  '感知': 6,
};

// 创建干员天赋配置
function createTalents(totals: Record<string, number>, level: number): TalentConfig[] {
  return Object.entries(totals).map(([name, totalMax]) => ({
    name: name as TalentConfig['name'],
    totalMax,
    currentMax: calculateCurrentMax(totalMax, level),
    current: 0,
  }));
}

// 初始干员数据
export function createInitialOperators(): Operator[] {
  const initialLevel = 30;
  
  return [
    {
      id: 'amiya',
      name: '阿米娅',
      avatar: '🐰',
      talents: createTalents(AMIYA_TALENT_TOTALS, initialLevel),
      currentLevel: initialLevel,
    },
    {
      id: 'hoshiguma',
      name: '星熊',
      avatar: '🛡️',
      talents: createTalents(HOSHIGUMA_TALENT_TOTALS, initialLevel),
      currentLevel: initialLevel,
    },
  ];
}

// 更新干员等级时重新计算当前上限
export function updateOperatorLevel(operator: Operator, newLevel: number): Operator {
  const updatedTalents = operator.talents.map(talent => ({
    ...talent,
    currentMax: calculateCurrentMax(talent.totalMax, newLevel),
  }));

  return {
    ...operator,
    currentLevel: newLevel,
    talents: updatedTalents,
  };
}

// 重置干员养成进度
export function resetOperator(operator: Operator): Operator {
  return {
    ...operator,
    talents: operator.talents.map(talent => ({
      ...talent,
      current: 0,
    })),
  };
}
