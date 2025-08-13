# Claude Templates Project

한국어 기반 Claude Code 템플릿 시스템을 제공하는 개발 워크스페이스입니다.

## 기능

### 🎯 컴포넌트 템플릿
- React TypeScript 컴포넌트 자동 생성
- Props 인터페이스 및 기본 스타일 포함
- Storybook 스토리 및 유닛 테스트 자동 생성

### 🔧 API 템플릿  
- REST API 엔드포인트 CRUD 작업 생성
- Express.js 라우터 및 검증 미들웨어
- Swagger 문서 주석 및 통합 테스트

### 🐛 버그 수정 워크플로우
- 체계적인 버그 분석 및 수정 프로세스
- 근본 원인 분석 및 재발 방지 테스트
- 커밋 메시지 자동 생성

## 사용 방법

### 템플릿 설치
```bash
mkdir -p ~/.claude-templates/{components,features,tests,docs}
```

### 컴포넌트 생성
```bash
COMPONENT_NAME="UserProfile" envsubst < ~/.claude-templates/components/react-component.txt | claude
```

### API 엔드포인트 생성
```bash
RESOURCE_NAME="users" envsubst < ~/.claude-templates/features/api-endpoint.txt | claude
```

### 버그 수정
```bash
BUG_DESCRIPTION="로그인 세션 만료 문제" envsubst < ~/.claude-templates/features/bugfix.txt | claude
```

## 코드 스타일
- 모든 함수는 화살표 함수로 작성
- 세미콜론 항상 사용  
- 들여쓰기는 2칸

## 템플릿 구조
```
~/.claude-templates/
├── components/
│   └── react-component.txt
├── features/
│   ├── api-endpoint.txt
│   └── bugfix.txt
├── tests/
└── docs/
```

## 기여 방법
1. 새로운 템플릿 추가 시 해당 카테고리 폴더에 `.txt` 파일 생성
2. 변수는 `[VARIABLE_NAME]` 형식으로 작성
3. `envsubst` 명령어로 변수 치환 가능하도록 구성