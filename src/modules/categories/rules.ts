export interface CategoryRule {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    name: "카페/간식",
    icon: "☕",
    color: "#A16207",
    keywords: [
      "스타벅스", "이디야", "투썸", "할리스", "빽다방", "메가커피", "커피빈",
      "폴바셋", "파스쿠찌", "드롭탑", "엔젤리너스", "카페", "coffee", "cafe",
      "베이커리", "뚜레쥬르", "파리바게뜨", "던킨", "도너츠", "브레드",
    ],
  },
  {
    name: "식비",
    icon: "🍽️",
    color: "#EA580C",
    keywords: [
      "식당", "음식", "배달", "배민", "요기요", "쿠팡이츠",
      "맥도날드", "롯데리아", "버거킹", "KFC", "서브웨이",
      "피자헛", "도미노", "피자", "치킨", "BBQ", "교촌", "굽네",
      "김밥", "분식", "국밥", "설렁탕", "삼겹살", "곱창", "횟집",
      "한식", "중식", "일식", "양식", "레스토랑", "식사", "밥",
      "스시", "초밥", "라멘", "우동", "쌀국수",
    ],
  },
  {
    name: "생활/마트",
    icon: "🛒",
    color: "#16A34A",
    keywords: [
      "이마트", "홈플러스", "롯데마트", "코스트코", "트레이더스",
      "GS25", "CU편의점", "세븐일레븐", "미니스톱", "편의점",
      "다이소", "올리브영", "마트", "슈퍼", "하나로마트",
    ],
  },
  {
    name: "교통",
    icon: "🚌",
    color: "#2563EB",
    keywords: [
      "지하철", "버스", "택시", "카카오택시", "우버", "티머니",
      "교통카드", "KTX", "SRT", "무궁화", "ITX", "고속버스",
      "주유", "GS칼텍스", "SK에너지", "현대오일뱅크", "S-OIL",
      "주차", "통행료", "하이패스", "ETC",
    ],
  },
  {
    name: "쇼핑",
    icon: "🛍️",
    color: "#9333EA",
    keywords: [
      "쿠팡", "네이버쇼핑", "11번가", "G마켓", "옥션", "SSG",
      "무신사", "지그재그", "에이블리", "H&M", "자라", "유니클로",
      "나이키", "아디다스", "뉴발란스", "ABC마트",
      "마켓컬리", "오늘의집", "이케아", "인터파크",
    ],
  },
  {
    name: "의료/건강",
    icon: "🏥",
    color: "#DC2626",
    keywords: [
      "병원", "의원", "클리닉", "약국", "한의원", "치과",
      "안과", "피부과", "정형외과", "내과", "소아과",
      "헬스장", "피트니스", "PT", "요가", "필라테스",
    ],
  },
  {
    name: "문화/여가",
    icon: "🎬",
    color: "#DB2777",
    keywords: [
      "CGV", "롯데시네마", "메가박스", "영화",
      "넷플릭스", "유튜브", "왓챠", "웨이브", "티빙", "디즈니",
      "게임", "스팀", "플레이스테이션", "닌텐도", "앱스토어",
      "구글플레이", "KBO", "축구", "야구", "콘서트", "공연",
      "여행", "호텔", "숙박", "항공", "에어비앤비",
    ],
  },
  {
    name: "통신/구독",
    icon: "📱",
    color: "#0891B2",
    keywords: [
      "SKT", "KT", "LG유플러스", "알뜰폰", "통신",
      "인터넷", "넷플릭스 구독", "유튜브프리미엄",
      "애플", "구글", "마이크로소프트", "어도비",
      "스포티파이", "멜론", "지니", "플로",
    ],
  },
  {
    name: "주거/관리비",
    icon: "🏠",
    color: "#78716C",
    keywords: [
      "관리비", "전기요금", "가스요금", "수도요금",
      "한전", "도시가스", "상하수도", "월세", "임대료",
      "보증금", "이사", "용달", "청소",
    ],
  },
  {
    name: "금융/이체",
    icon: "💸",
    color: "#6B7280",
    keywords: [
      "이체", "송금", "ATM", "출금", "입금",
      "보험", "삼성생명", "한화생명", "교보생명",
      "적금", "저축", "투자", "주식", "펀드",
    ],
  },
  {
    name: "기타",
    icon: "📦",
    color: "#4B5563",
    keywords: [],
  },
];

export function classifyByKeywords(description: string): CategoryRule {
  const lower = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.length === 0) continue;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) return rule;
    }
  }
  return CATEGORY_RULES[CATEGORY_RULES.length - 1]; // 기타
}
