export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  halsteadMetrics: {
    volume: number;
    difficulty: number;
    effort: number;
  };
  nestingDepth: number;
  commentDensity: number;
  qualityRating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

const countOperators = (code: string, language: string): number => {
  const operatorPatterns: Record<string, RegExp[]> = {
    java: [/[+\-*\/%=!<>&|^~]+/g, /\b(if|else|for|while|switch|case|return|throw|new)\b/g],
    c: [/[+\-*\/%=!<>&|^~]+/g, /\b(if|else|for|while|switch|case|return|goto)\b/g],
    python: [/[+\-*\/%=!<>&|^~]+/g, /\b(if|elif|else|for|while|return|yield|import|from|in|is|and|or|not)\b/g],
    cpp: [/[+\-*\/%=!<>&|^~:]+/g, /\b(if|else|for|while|switch|case|return|throw|new|delete)\b/g],
  };
  
  const patterns = operatorPatterns[language] || operatorPatterns.java;
  let count = 0;
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    count += matches ? matches.length : 0;
  });
  return count;
};

const countOperands = (code: string): number => {
  const operands = code.match(/\b[a-zA-Z_]\w*\b|\b\d+\.?\d*\b|"[^"]*"|'[^']*'/g);
  return operands ? operands.length : 0;
};

export const analyzeCode = (code: string, language: string): CodeMetrics => {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const linesOfCode = lines.length;

  // Cyclomatic Complexity
  const decisionPoints = (code.match(/\b(if|for|while|case|catch|&&|\|\||\?)\b/g) || []).length;
  const cyclomaticComplexity = decisionPoints + 1;

  // Halstead Metrics
  const operators = countOperators(code, language);
  const operands = countOperands(code);
  const uniqueOperators = new Set(code.match(/[+\-*\/%=!<>&|^~]+|\b(if|else|for|while|switch|case|return)\b/g) || []).size;
  const uniqueOperands = new Set(code.match(/\b[a-zA-Z_]\w*\b|\b\d+\.?\d*\b/g) || []).size;
  
  const vocabulary = uniqueOperators + uniqueOperands;
  const length = operators + operands;
  const volume = length * Math.log2(vocabulary || 1);
  const difficulty = (uniqueOperators / 2) * (operands / (uniqueOperands || 1));
  const effort = volume * difficulty;

  // Nesting Depth
  let maxNesting = 0;
  let currentNesting = 0;
  for (const char of code) {
    if (char === '{') {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    } else if (char === '}') {
      currentNesting--;
    }
  }

  // Comment Density
  const commentLines = (code.match(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g) || []).length;
  const commentDensity = linesOfCode > 0 ? (commentLines / linesOfCode) * 100 : 0;

  // Quality Rating
  let qualityScore = 100;
  if (cyclomaticComplexity > 10) qualityScore -= 20;
  if (maxNesting > 4) qualityScore -= 20;
  if (commentDensity < 10) qualityScore -= 15;
  if (linesOfCode > 200) qualityScore -= 15;
  if (effort > 10000) qualityScore -= 10;

  let qualityRating: CodeMetrics['qualityRating'];
  if (qualityScore >= 80) qualityRating = 'excellent';
  else if (qualityScore >= 60) qualityRating = 'good';
  else if (qualityScore >= 40) qualityRating = 'fair';
  else qualityRating = 'poor';

  // Recommendations
  const recommendations: string[] = [];
  if (cyclomaticComplexity > 10) {
    recommendations.push('Consider breaking down complex functions into smaller, more manageable units.');
  }
  if (maxNesting > 4) {
    recommendations.push('Reduce nesting depth by extracting nested logic into separate functions.');
  }
  if (commentDensity < 10) {
    recommendations.push('Add more meaningful comments to improve code readability and maintainability.');
  }
  if (linesOfCode > 200) {
    recommendations.push('Consider splitting this large code block into multiple smaller modules.');
  }
  if (effort > 10000) {
    recommendations.push('Simplify complex logic to reduce cognitive load and improve maintainability.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Code quality is excellent! Continue following best practices.');
  }

  return {
    linesOfCode,
    cyclomaticComplexity,
    halsteadMetrics: {
      volume: Math.round(volume),
      difficulty: Math.round(difficulty * 100) / 100,
      effort: Math.round(effort),
    },
    nestingDepth: maxNesting,
    commentDensity: Math.round(commentDensity * 100) / 100,
    qualityRating,
    recommendations,
  };
};