import requests
from bs4 import BeautifulSoup
import time
import json
from urllib.parse import urljoin, urlparse, parse_qs
import re

class NaverNewsCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def is_valid_news_url(self, url):
        """유효한 뉴스 URL인지 확인"""
        if not url:
            return False
        
        # 네이버 뉴스 URL 패턴 확인
        valid_patterns = [
            'n.news.naver.com/mnews/article',
            'news.naver.com/main/read',
            'news.naver.com/article'
        ]
        
        # 제외할 URL 패턴
        exclude_patterns = [
            'news.naver.com/main/list',
            'news.naver.com/main/ranking',
            'news.naver.com/main/hotissue',
            'media.naver.com',
            '#'
        ]
        
        # 제외 패턴 검사
        for pattern in exclude_patterns:
            if pattern in url:
                return False
        
        # 유효 패턴 검사
        for pattern in valid_patterns:
            if pattern in url:
                return True
        
        return False
        
    def get_search_results(self, search_url):
        """네이버 검색 결과 페이지에서 뉴스 링크들을 추출"""
        try:
            response = self.session.get(search_url)
            response.raise_for_status()
            response.encoding = 'utf-8'
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 뉴스 섹션 찾기
            news_links = []
            news_data = []
            
            # 실제 네이버 뉴스 구조에 맞는 셀렉터들
            selectors = [
                # 메인 뉴스 제목 링크
                'a.UpDjg8Q2DzdaIi4sfrjX',
                # 서브 뉴스 제목 링크  
                'a.Oxs1v7upclSMaxokltKZ',
                # 네이버뉴스 링크
                'a[href*="n.news.naver.com"]',
                # 일반 뉴스 링크
                'a[href*="news.naver.com"]'
            ]
            
            # 뉴스 아이템들 찾기
            news_items = soup.select('.fds-news-item-list-desk .NYqAjUWdQsgkJBAODPln')
            
            for item in news_items:
                # 메인 뉴스 제목과 링크
                main_title_link = item.select_one('a.UpDjg8Q2DzdaIi4sfrjX')
                if main_title_link:
                    title = main_title_link.get_text().strip()
                    href = main_title_link.get('href')
                    
                    # 언론사 정보
                    press = item.select_one('.sds-comps-profile-info-title-text')
                    press_name = press.get_text().strip() if press else "Unknown"
                    
                    # 시간 정보
                    time_elem = item.select_one('.RhtLWxQlRdnXvHdGqikm span')
                    time_info = time_elem.get_text().strip() if time_elem else "Unknown"
                    
                    # 본문 미리보기
                    preview = item.select_one('a.qayQSl_GP1qS0BX8dYlm span')
                    preview_text = preview.get_text().strip() if preview else ""
                    
                    if href and self.is_valid_news_url(href):
                        news_data.append({
                            'url': href,
                            'title': title,
                            'press': press_name,
                            'time': time_info,
                            'preview': preview_text
                        })
                        news_links.append(href)
                
                # 서브 뉴스들도 추가
                sub_links = item.select('a.Oxs1v7upclSMaxokltKZ')
                for sub_link in sub_links:
                    href = sub_link.get('href')
                    title = sub_link.get_text().strip()
                    if href and title and self.is_valid_news_url(href):
                        news_data.append({
                            'url': href,
                            'title': title,
                            'press': "Sub News",
                            'time': "Unknown",
                            'preview': ""
                        })
                        news_links.append(href)
            
            # 추가 검색: 일반적인 뉴스 링크들
            for selector in selectors:
                links = soup.select(selector)
                for link in links:
                    href = link.get('href')
                    if href and self.is_valid_news_url(href) and href not in news_links:
                        news_links.append(href)
            
            # 중복 제거
            news_links = list(dict.fromkeys(news_links))  # 순서 유지하면서 중복 제거
            
            print(f"발견된 뉴스 링크 수: {len(news_links)}")
            print(f"뉴스 데이터 수: {len(news_data)}")
            
            # 디버깅: 첫 몇 개 뉴스 정보 출력
            for i, data in enumerate(news_data[:3]):
                print(f"뉴스 {i+1}: {data['title'][:50]}... ({data['press']})")
            
            return news_links
            
        except Exception as e:
            print(f"검색 결과 페이지 크롤링 중 오류: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def extract_news_content(self, news_url):
        """개별 뉴스 기사의 제목과 본문을 추출"""
        try:
            # 네이버 뉴스 페이지 접근
            response = self.session.get(news_url)
            response.raise_for_status()
            response.encoding = 'utf-8'
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 제목 추출 (네이버 뉴스 최신 구조 반영)
            title_selectors = [
                '#title_area h2',  # 최신 네이버뉴스
                '.media_end_head_headline h2',  # 일반적인 네이버뉴스
                '#articleTitle',  # 구버전
                '.newsct_article h2',  # 다른 버전
                'h1.title',  # 일부 언론사
                '.article_title',  # 백업
                'h1',  # 최후 수단
                'h2'   # 최후 수단
            ]
            
            title = None
            for selector in title_selectors:
                title_element = soup.select_one(selector)
                if title_element:
                    title = title_element.get_text().strip()
                    # HTML 태그가 남아있다면 제거
                    title = re.sub(r'<[^>]+>', '', title)
                    if title and len(title) > 5:  # 너무 짧은 제목 제외
                        break
            
            # 본문 추출 (네이버 뉴스 최신 구조 반영)
            content_selectors = [
                '#dic_area',  # 최신 네이버뉴스 본문
                '#articleBodyContents',  # 일반적인 네이버뉴스
                '.newsct_article ._article_body_contents',  # 다른 버전
                '._article_body_contents',  # 구버전
                '.se_component_wrap',  # 네이버 포스트 스타일
                '.article_body',  # 일부 언론사
                '#content',  # 일반적인 content
                '.content',  # 백업
                'article',  # HTML5 semantic
                '.article_txt'  # 추가 백업
            ]
            
            content = None
            for selector in content_selectors:
                content_element = soup.select_one(selector)
                if content_element:
                    # 불필요한 태그 제거
                    for unwanted in content_element(['script', 'style', 'aside', 'footer', 'nav', '.ad', '.advertisement']):
                        unwanted.decompose()
                    
                    # 텍스트 추출
                    content = content_element.get_text()
                    
                    # 텍스트 정리
                    content = re.sub(r'\s+', ' ', content)  # 연속된 공백을 하나로
                    content = re.sub(r'\n+', '\n', content)  # 연속된 줄바꿈을 하나로
                    content = content.strip()
                    
                    # 너무 짧은 내용 제외
                    if content and len(content) > 100:
                        break
                    else:
                        content = None
            
            # 날짜 추출 (네이버 뉴스 최신 구조 반영)
            date_selectors = [
                '.media_end_head_info_datestamp_time',  # 최신
                '.media_end_head_info_datestamp time',
                '._ARTICLE_DATE_TIME',  # 구버전
                '.article_date',
                '.date',
                'time',
                '.published'
            ]
            
            date = None
            for selector in date_selectors:
                date_element = soup.select_one(selector)
                if date_element:
                    # datetime 속성이 있으면 우선 사용
                    date = date_element.get('datetime') or date_element.get_text().strip()
                    if date:
                        break
            
            # 언론사 정보 추출
            press_selectors = [
                '.media_end_head_top_logo img',
                '.press_logo img',
                '.logo img'
            ]
            
            press = None
            for selector in press_selectors:
                press_element = soup.select_one(selector)
                if press_element:
                    press = press_element.get('alt', '').replace('의 프로필 이미지', '').strip()
                    if press:
                        break
            
            # 요약문 추출 시도
            summary_selectors = [
                '.media_end_head_summary',
                '.article_summary',
                '.summary'
            ]
            
            summary = None
            for selector in summary_selectors:
                summary_element = soup.select_one(selector)
                if summary_element:
                    summary = summary_element.get_text().strip()
                    if summary:
                        break
            
            if title and content:
                result = {
                    'url': news_url,
                    'title': title,
                    'content': content,
                    'date': date,
                    'press': press,
                    'summary': summary
                }
                return result
            else:
                print(f"제목 또는 본문을 찾을 수 없음: {news_url}")
                print(f"  제목: {'찾음' if title else '못찾음'}")
                print(f"  본문: {'찾음' if content else '못찾음'}")
                
                # 디버깅: 페이지의 주요 태그 확인
                print("  페이지에서 발견된 주요 태그들:")
                for tag in ['h1', 'h2', 'h3', 'article', '#content', '.content']:
                    elements = soup.select(tag)
                    if elements:
                        print(f"    {tag}: {len(elements)}개")
                
                return None
                
        except Exception as e:
            print(f"뉴스 기사 크롤링 중 오류 ({news_url}): {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def crawl_news(self, search_url, max_articles=10):
        """메인 크롤링 함수"""
        print("네이버 뉴스 크롤링 시작...")
        
        # 1. 검색 결과에서 뉴스 링크 추출
        news_links = self.get_search_results(search_url)
        
        if not news_links:
            print("뉴스 링크를 찾을 수 없습니다.")
            return []
        
        # 2. 각 뉴스 기사 크롤링
        articles = []
        processed = 0
        
        for link in news_links[:max_articles]:
            if processed >= max_articles:
                break
                
            print(f"크롤링 중... ({processed + 1}/{min(len(news_links), max_articles)})")
            
            article = self.extract_news_content(link)
            if article:
                articles.append(article)
                processed += 1
            
            # 요청 간격 조절 (서버 부하 방지)
            time.sleep(1)
        
        print(f"크롤링 완료! 총 {len(articles)}개 기사 수집")
        return articles
    
    def save_to_json(self, articles, filename='news_articles.json'):
        """결과를 JSON 파일로 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"결과가 {filename}에 저장되었습니다.")
    
    def print_articles(self, articles):
        """기사들을 콘솔에 출력"""
        for i, article in enumerate(articles, 1):
            print(f"\n{'='*60}")
            print(f"📰 기사 {i}")
            print(f"{'='*60}")
            print(f"📌 제목: {article['title']}")
            print(f"🏢 언론사: {article.get('press', 'N/A')}")
            print(f"📅 날짜: {article.get('date', 'N/A')}")
            print(f"🔗 URL: {article['url']}")
            
            # 요약문이 있으면 출력
            if article.get('summary'):
                print(f"📝 요약: {article['summary'][:150]}...")
            
            # 본문 미리보기
            content_preview = article['content'][:300] if len(article['content']) > 300 else article['content']
            print(f"📄 본문: {content_preview}...")
            print(f"   (전체 길이: {len(article['content'])}자)")

def main():
    print("🚀 네이버 뉴스 크롤러 시작")
    print("=" * 50)
    
    # 크롤러 인스턴스 생성
    crawler = NaverNewsCrawler()
    
    # 주어진 URL
    search_url = "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EB%B0%98%EB%8F%84%EC%B2%B4&ackey=guszjn2h"
    
    print(f"🔍 검색 URL: {search_url}")
    print(f"📈 키워드: 반도체")
    print("-" * 50)
    
    # 뉴스 크롤링 (최대 15개 기사)
    articles = crawler.crawl_news(search_url, max_articles=15)
    
    if articles:
        print(f"\n✅ 총 {len(articles)}개의 기사를 성공적으로 크롤링했습니다!")
        
        # 결과 출력
        crawler.print_articles(articles)
        
        # JSON 파일로 저장
        crawler.save_to_json(articles, 'semiconductor_news.json')
        
        print(f"\n💾 모든 기사가 'semiconductor_news.json'에 저장되었습니다.")
        print("🎉 크롤링 완료!")
        
    else:
        print("❌ 크롤링된 기사가 없습니다.")
        print("💡 다음을 확인해보세요:")
        print("   - 인터넷 연결 상태")
        print("   - 네이버 접근 가능 여부")
        print("   - URL이 올바른지 확인")

def demo():
    """데모 실행 함수"""
    print("🔥 네이버 뉴스 크롤러 데모")
    print("이 데모는 반도체 관련 뉴스를 크롤링합니다.")
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  사용자가 중단했습니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()