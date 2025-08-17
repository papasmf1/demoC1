# 📰 네이버 뉴스 크롤러 v2.0

제공된 HTML 구조를 분석하여 개선된 네이버 검색 결과에서 반도체 관련 뉴스 기사를 크롤링하는 파이썬 스크립트입니다.

## 🚀 새로운 기능 (v2.0)

- ✅ **실제 네이버 HTML 구조 기반**: 제공된 HTML을 분석하여 정확한 셀렉터 사용
- ✅ **향상된 데이터 추출**: 제목, 본문, 언론사, 날짜, 요약문 추출
- ✅ **URL 검증 시스템**: 유효한 뉴스 URL만 선별적으로 크롤링
- ✅ **상세한 디버깅**: 크롤링 과정과 결과를 자세히 표시
- ✅ **에러 복구**: 실패한 기사는 건너뛰고 다음 기사 계속 처리
- ✅ **이모지 UI**: 더 읽기 쉬운 콘솔 출력

## 📦 설치 방법

1. 필요한 라이브러리 설치:
```bash
pip install -r requirements.txt
```

## 🎮 사용 방법

### 기본 실행
```bash
python naver_news_crawler.py
```

### 데모 실행 (에러 처리 포함)
```python
from naver_news_crawler import demo
demo()
```

### 프로그래밍 방식 사용
```python
from naver_news_crawler import NaverNewsCrawler

crawler = NaverNewsCrawler()
url = "https://search.naver.com/search.naver?query=반도체"
articles = crawler.crawl_news(url, max_articles=20)

# 결과 출력
crawler.print_articles(articles)

# JSON 저장
crawler.save_to_json(articles, 'my_news.json')
```

## 🔧 주요 기능

### 🎯 **정밀한 데이터 추출**
- **검색 결과 분석**: 실제 네이버 뉴스 HTML 구조 기반
- **기사 내용 크롤링**: 제목, 본문, 언론사, 날짜, 요약문
- **URL 검증**: 유효한 네이버 뉴스 URL만 처리
- **중복 제거**: 동일한 기사 중복 방지

### 🛡️ **안전한 크롤링**
- **요청 간격 조절**: 서버 부하 방지 (1초 간격)
- **에러 핸들링**: 개별 기사 실패 시에도 전체 프로세스 계속
- **디버깅 정보**: 상세한 진행 상황 표시

### 💾 **데이터 관리**
- **JSON 저장**: 구조화된 데이터 형태로 저장
- **상세한 메타데이터**: URL, 언론사, 발행시간 등 포함
- **콘솔 출력**: 실시간 결과 확인

## 📋 크롤링되는 정보

각 기사마다 다음 정보를 수집합니다:

| 필드 | 설명 | 예시 |
|------|------|------|
| `title` | 기사 제목 | "SK하이닉스, 반도체 업무 특화 생성형 AI 플랫폼 개발" |
| `content` | 본문 내용 | "SK하이닉스가 반도체 업무에 특화된..." |
| `press` | 언론사명 | "전자신문" |
| `date` | 발행 날짜 | "18시간 전" |
| `url` | 기사 URL | "https://n.news.naver.com/..." |
| `summary` | 요약문 (있는 경우) | "SK하이닉스는 14일..." |

## ⚙️ 설정 변경

### 크롤링 개수 변경
```python
# main() 함수에서
articles = crawler.crawl_news(search_url, max_articles=20)  # 20개로 변경
```

### 다른 키워드 검색
```python
# URL의 query 부분 변경
search_url = "https://search.naver.com/search.naver?query=인공지능"
```

### 요청 간격 조절
```python
# crawler 클래스의 time.sleep(1) 부분 수정
time.sleep(2)  # 2초로 변경
```

## 📁 출력 파일

- `semiconductor_news.json`: 크롤링된 뉴스 기사들이 JSON 형태로 저장

## ⚠️ 주의사항

- **이용약관 준수**: 네이버 웹사이트의 robots.txt와 이용약관을 준수해야 합니다
- **적절한 사용**: 서버에 부하를 주지 않도록 적절한 간격으로 요청
- **개인 용도**: 개인적인 학습 및 연구 목적으로만 사용하세요
- **법적 책임**: 크롤링 데이터 사용에 따른 법적 책임은 사용자에게 있습니다

## 🐛 문제 해결

### 크롤링 결과가 없는 경우
1. 인터넷 연결 확인
2. 네이버 접근 가능 여부 확인
3. URL 형식이 올바른지 확인
4. 디버깅 메시지 확인

### 특정 기사 크롤링 실패
- 개별 기사 실패는 정상적인 상황입니다
- 전체 프로세스는 계속 진행됩니다
- 디버깅 정보를 통해 실패 원인 확인 가능

## 📈 향후 개선 계획

- [ ] 이미지 URL 추출
- [ ] 댓글 수집
- [ ] 실시간 모니터링
- [ ] 다양한 검색 엔진 지원
- [ ] GUI 인터페이스