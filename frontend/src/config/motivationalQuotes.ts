// 励志反馈配置
export interface MotivationalQuote {
  text: string;
  author?: string;
  translation?: string; // 英文翻译
}

export interface MotivationalQuotes {
  excellent: MotivationalQuote;
  good: MotivationalQuote;
  pass: MotivationalQuote;
  fail: MotivationalQuote;
}

// 中文固定反馈
export const chineseQuotes: MotivationalQuotes = {
  excellent: {
    text: "顶峰的空气虽然稀薄，但最配卓越的你。请继续保持这份孤独的强大。",
    translation: "The air at the peak may be thin, but it's perfectly suited for excellence like yours. Keep maintaining this solitary strength."
  },
  good: {
    text: "优秀已成定式，卓越近在咫尺。目前的成绩证明了你的扎实，最后一点盲区正是你进化的阶梯。",
    translation: "Excellence has become your standard, and greatness is within reach. Your current results prove your solid foundation, and those remaining blind spots are the stairs to your evolution."
  },
  pass: {
    text: "分数就像身材，虽然不是最完美的，但绝对是过得去的。再努力一把，马甲线（高分）就在前方！",
    translation: "Your score is like your body shape - maybe not perfect, but definitely acceptable. Push a little harder, and those abs (high scores) are just ahead!"
  },
  fail: {
    text: "每一个错误都是一枚勋章，它精准地指出了你进化的方向。只要不停止，慢也是一种快。",
    translation: "Every mistake is a medal that precisely points out the direction of your evolution. As long as you don't stop, slow is also a form of fast."
  }
};

// 英文固定反馈
export const englishQuotes: MotivationalQuotes = {
  excellent: {
    text: "The air at the peak may be thin, but it's perfectly suited for excellence like yours. Keep maintaining this solitary strength."
  },
  good: {
    text: "Excellence has become your standard, and greatness is within reach. Your current results prove your solid foundation, and those remaining blind spots are the stairs to your evolution."
  },
  pass: {
    text: "Your score is like your body shape - maybe not perfect, but definitely acceptable. Push a little harder, and those abs (high scores) are just ahead!"
  },
  fail: {
    text: "Every mistake is a medal that precisely points out the direction of your evolution. As long as you don't stop, slow is also a form of fast."
  }
};

// 根据分数获取对应的固定反馈
export const getMotivationalQuote = (percentage: number, language: 'zh' | 'en' = 'zh'): MotivationalQuote => {
  const quotes = language === 'zh' ? chineseQuotes : englishQuotes;

  if (percentage >= 90) {
    return quotes.excellent;
  } else if (percentage >= 75) {
    return quotes.good;
  } else if (percentage >= 60) {
    return quotes.pass;
  } else {
    return quotes.fail;
  }
};