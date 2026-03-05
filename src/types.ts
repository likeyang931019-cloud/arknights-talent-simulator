// 明日方舟天赋养成模拟器 - 类型定义

// 九种天赋属性
export type TalentType = '勇气' | '体魄' | '毅力' | '信念' | '灵巧' | '智慧' | '魅力' | '感知' | '感应';

// 属性配置
export interface TalentConfig {
  name: TalentType;
  totalMax: number;  // 总上限
  currentMax: number; // 当前等级上限
  current: number;   // 当前值
}

// 阶段配置
export interface StageConfig {
  minLevel: number;
  maxLevel: number;
  totalPoints: number;  // 该阶段可加点总数
  costPerPoint: number; // 每次加点消耗
}

// 干员数据
export interface Operator {
  id: string;
  name: string;
  avatar: string;
  talents: TalentConfig[];
  currentLevel: number;  // 当前精二等级 (1-70)
}

// 游戏状态
export interface GameState {
  talentPoints: number;  // 玩家拥有的天赋点
  selectedOperator: string | null;
  operators: Operator[];
}

// 加点结果
export interface UpgradeResult {
  success: boolean;
  upgradedTalent?: TalentType;
  cost?: number;
  message: string;
}

// 等级阶段定义
export const LEVEL_STAGES: StageConfig[] = [
  { minLevel: 1, maxLevel: 30, totalPoints: 14, costPerPoint: 10 },
  { minLevel: 31, maxLevel: 50, totalPoints: 28, costPerPoint: 20 },
  { minLevel: 51, maxLevel: 70, totalPoints: 42, costPerPoint: 50 },
];

// 根据等级获取当前阶段
export function getStageByLevel(level: number): StageConfig {
  for (const stage of LEVEL_STAGES) {
    if (level >= stage.minLevel && level <= stage.maxLevel) {
      return stage;
    }
  }
  return LEVEL_STAGES[0];
}

// 计算属性当前上限
export function calculateCurrentMax(totalMax: number, level: number): number {
  const stage = getStageByLevel(level);
  const ratio = stage.totalPoints / 42; // 42是总点数
  // 确保是整数，且不超过总上限
  return Math.min(Math.round(totalMax * ratio), totalMax);
}

// 获取所有9种属性类型
export const ALL_TALENT_TYPES: TalentType[] = [
  '勇气', '体魄', '毅力', '信念', '灵巧', '智慧', '魅力', '感知', '感应'
];
