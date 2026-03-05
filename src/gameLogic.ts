// 明日方舟天赋养成模拟器 - 核心逻辑
import type { Operator, TalentConfig, UpgradeResult, GameState } from './types';
import { getStageByLevel } from './types';

// 计算干员当前已加的总点数
export function getTotalAddedPoints(operator: Operator): number {
  return operator.talents.reduce((sum, t) => sum + t.current, 0);
}

// 计算干员当前阶段的已加点数
export function getCurrentStagePoints(operator: Operator): number {
  const total = getTotalAddedPoints(operator);
  const stage = getStageByLevel(operator.currentLevel);
  
  if (stage.totalPoints === 14) return total;
  if (stage.totalPoints === 28) return total - 14;
  return total - 28;
}

// 计算当前阶段的剩余可加点数
export function getRemainingPointsInStage(operator: Operator): number {
  const stage = getStageByLevel(operator.currentLevel);
  const totalAdded = getTotalAddedPoints(operator);
  return stage.totalPoints - totalAdded;
}

// 计算每次加点消耗的天赋点
export function getCostPerUpgrade(operator: Operator): number {
  const totalAdded = getTotalAddedPoints(operator);
  if (totalAdded < 14) return 10;
  if (totalAdded < 28) return 20;
  return 50;
}

// 计算属性权重（新公式）
// Wi = (1 / (当前值 + 1)^n) × (当前阶段上限 - 当前值) × 100
export function calculateTalentWeight(talent: TalentConfig, n: number): number {
  if (talent.current >= talent.currentMax) return 0;
  // (当前值 + 1)的n次方
  const denominator = Math.pow(talent.current + 1, n);
  // 当前阶段上限 - 当前值
  const remainingSpace = talent.currentMax - talent.current;
  // 计算权重并乘以100
  return (1 / denominator) * remainingSpace * 100;
}

// 加权随机选择一个属性
export function weightedRandomSelect(talents: TalentConfig[], n: number): TalentConfig | null {
  const weights = talents.map(t => ({
    talent: t,
    weight: calculateTalentWeight(t, n),
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) return null;

  let random = Math.random() * totalWeight;
  
  for (const { talent, weight } of weights) {
    random -= weight;
    if (random <= 0) return talent;
  }

  return weights[weights.length - 1]?.talent || null;
}

// 执行加点
export function upgradeTalent(state: GameState, operatorId: string): UpgradeResult {
  const operator = state.operators.find(o => o.id === operatorId);
  if (!operator) {
    return { success: false, message: '干员不存在' };
  }

  const cost = getCostPerUpgrade(operator);
  
  // 检查天赋点是否足够
  if (state.talentPoints < cost) {
    return { success: false, message: '天赋点不足' };
  }

  // 检查是否还有剩余点数可加
  const remaining = getRemainingPointsInStage(operator);
  if (remaining <= 0) {
    return { success: false, message: '当前阶段已加满，请提升等级' };
  }

  // 检查是否有可升级的属性
  const upgradableTalents = operator.talents.filter(t => t.current < t.currentMax);
  if (upgradableTalents.length === 0) {
    return { success: false, message: '所有属性已达当前上限' };
  }

  // 加权随机选择（传入参数n）
  const selectedTalent = weightedRandomSelect(operator.talents, state.weightParamN);
  if (!selectedTalent) {
    return { success: false, message: '没有可升级的属性' };
  }

  // 执行升级
  const updatedOperators = state.operators.map(o => {
    if (o.id !== operatorId) return o;
    
    return {
      ...o,
      talents: o.talents.map(t => {
        if (t.name !== selectedTalent.name) return t;
        return { ...t, current: t.current + 1 };
      }),
    };
  });

  return {
    success: true,
    upgradedTalent: selectedTalent.name,
    cost,
    message: `${selectedTalent.name} +1`,
  };
}

// 更新游戏状态（加点后）
export function applyUpgrade(state: GameState, result: UpgradeResult, operatorId: string): GameState {
  if (!result.success || !result.cost) return state;

  return {
    ...state,
    talentPoints: state.talentPoints - result.cost,
    operators: state.operators.map(o => {
      if (o.id !== operatorId) return o;
      
      return {
        ...o,
        talents: o.talents.map(t => {
          if (t.name !== result.upgradedTalent) return t;
          return { ...t, current: t.current + 1 };
        }),
      };
    }),
  };
}
