import sys
import os
import json
import threading
import time
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QLineEdit, QPushButton, 
                             QTextEdit, QProgressBar, QSpinBox, QTableWidget,
                             QTableWidgetItem, QTabWidget, QGroupBox, QComboBox,
                             QCheckBox, QFileDialog, QMessageBox, QSplitter,
                             QHeaderView, QStatusBar)
from PyQt5.QtCore import QThread, pyqtSignal, Qt, QTimer
from PyQt5.QtGui import QFont, QIcon, QPixmap, QPalette, QColor

# 기존 크롤러 클래스 import
from naver_news_crawler import NaverNewsCrawler

class CrawlerThread(QThread):
    """백그라운드에서 크롤링을 수행하는 스레드"""
    progress_updated = pyqtSignal(int)
    status_updated = pyqtSignal(str)
    article_found = pyqtSignal(dict)
    finished_crawling = pyqtSignal(list)
    error_occurred = pyqtSignal(str)
    
    def __init__(self, search_url, max_articles=10):
        super().__init__()
        self.search_url = search_url
        self.max_articles = max_articles
        self.crawler = NaverNewsCrawler()
        self.articles = []
        
    def run(self):
        try:
            self.status_updated.emit("🔍 검색 결과 페이지 분석 중...")
            
            # 검색 결과에서 링크 추출
            news_links = self.crawler.get_search_results(self.search_url)
            
            if not news_links:
                self.error_occurred.emit("뉴스 링크를 찾을 수 없습니다.")
                return
            
            total_links = min(len(news_links), self.max_articles)
            self.status_updated.emit(f"📰 {total_links}개 기사 크롤링 시작...")
            
            processed = 0
            for i, link in enumerate(news_links[:self.max_articles]):
                if self.isInterruptionRequested():
                    break
                    
                self.status_updated.emit(f"📄 기사 {i+1}/{total_links} 처리 중...")
                
                article = self.crawler.extract_news_content(link)
                if article:
                    self.articles.append(article)
                    self.article_found.emit(article)
                    processed += 1
                
                # 진행률 업데이트
                progress = int((i + 1) / total_links * 100)
                self.progress_updated.emit(progress)
                
                # 요청 간격
                time.sleep(1)
            
            self.status_updated.emit(f"✅ 크롤링 완료! {processed}개 기사 수집")
            self.finished_crawling.emit(self.articles)
            
        except Exception as e:
            self.error_occurred.emit(f"크롤링 중 오류 발생: {str(e)}")

class NewsTableWidget(QTableWidget):
    """뉴스 기사를 표시하는 테이블 위젯"""
    
    def __init__(self):
        super().__init__()
        self.setupTable()
        
    def setupTable(self):
        # 컬럼 설정
        self.setColumnCount(5)
        self.setHorizontalHeaderLabels(['제목', '언론사', '날짜', 'URL', '요약'])
        
        # 헤더 설정
        header = self.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Stretch)  # 제목 컬럼 늘어남
        header.setSectionResizeMode(1, QHeaderView.Fixed)
        header.setSectionResizeMode(2, QHeaderView.Fixed)
        header.setSectionResizeMode(3, QHeaderView.Fixed)
        header.setSectionResizeMode(4, QHeaderView.Fixed)
        
        self.setColumnWidth(1, 100)  # 언론사
        self.setColumnWidth(2, 100)  # 날짜
        self.setColumnWidth(3, 200)  # URL
        self.setColumnWidth(4, 200)  # 요약
        
        # 테이블 설정
        self.setAlternatingRowColors(True)
        self.setSelectionBehavior(QTableWidget.SelectRows)
        self.setSortingEnabled(True)
        
    def addArticle(self, article):
        """기사를 테이블에 추가"""
        row = self.rowCount()
        self.insertRow(row)
        
        # 데이터 설정
        self.setItem(row, 0, QTableWidgetItem(article.get('title', 'N/A')))
        self.setItem(row, 1, QTableWidgetItem(article.get('press', 'N/A')))
        self.setItem(row, 2, QTableWidgetItem(article.get('date', 'N/A')))
        self.setItem(row, 3, QTableWidgetItem(article.get('url', 'N/A')))
        
        # 요약 또는 본문 미리보기
        summary = article.get('summary', '') or article.get('content', '')[:100]
        self.setItem(row, 4, QTableWidgetItem(summary))
        
        # 자동 스크롤
        self.scrollToBottom()
        
    def clearArticles(self):
        """모든 기사 삭제"""
        self.setRowCount(0)
        
    def getSelectedArticle(self):
        """선택된 기사 반환"""
        current_row = self.currentRow()
        if current_row >= 0:
            return {
                'title': self.item(current_row, 0).text(),
                'press': self.item(current_row, 1).text(),
                'date': self.item(current_row, 2).text(),
                'url': self.item(current_row, 3).text(),
                'summary': self.item(current_row, 4).text()
            }
        return None

class NaverNewsGUI(QMainWindow):
    """네이버 뉴스 크롤러 GUI 메인 윈도우"""
    
    def __init__(self):
        super().__init__()
        self.articles = []
        self.crawler_thread = None
        self.setupUI()
        self.setupConnections()
        
    def setupUI(self):
        """UI 구성"""
        self.setWindowTitle("📰 네이버 뉴스 크롤러 GUI v1.0")
        self.setGeometry(100, 100, 1400, 800)
        
        # 중앙 위젯
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # 메인 레이아웃
        main_layout = QVBoxLayout(central_widget)
        
        # 상단 제어 패널
        control_panel = self.createControlPanel()
        main_layout.addWidget(control_panel)
        
        # 진행률 표시
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        main_layout.addWidget(self.progress_bar)
        
        # 탭 위젯
        tab_widget = QTabWidget()
        
        # 뉴스 목록 탭
        news_tab = self.createNewsListTab()
        tab_widget.addTab(news_tab, "📋 뉴스 목록")
        
        # 뉴스 상세 탭
        detail_tab = self.createNewsDetailTab()
        tab_widget.addTab(detail_tab, "📄 뉴스 상세")
        
        # 설정 탭
        settings_tab = self.createSettingsTab()
        tab_widget.addTab(settings_tab, "⚙️ 설정")
        
        main_layout.addWidget(tab_widget)
        
        # 상태바
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("준비")
        
        # 스타일 적용
        self.applyStyles()
        
    def createControlPanel(self):
        """상단 제어 패널 생성"""
        group_box = QGroupBox("🔍 크롤링 설정")
        layout = QVBoxLayout(group_box)
        
        # 첫 번째 행: 검색 키워드
        row1 = QHBoxLayout()
        row1.addWidget(QLabel("검색 키워드:"))
        
        self.keyword_input = QLineEdit()
        self.keyword_input.setText("반도체")
        self.keyword_input.setPlaceholderText("검색할 키워드를 입력하세요")
        row1.addWidget(self.keyword_input)
        
        row1.addWidget(QLabel("최대 기사 수:"))
        self.max_articles_spin = QSpinBox()
        self.max_articles_spin.setRange(1, 50)
        self.max_articles_spin.setValue(10)
        row1.addWidget(self.max_articles_spin)
        
        layout.addLayout(row1)
        
        # 두 번째 행: 버튼들
        row2 = QHBoxLayout()
        
        self.start_button = QPushButton("🚀 크롤링 시작")
        self.start_button.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        row2.addWidget(self.start_button)
        
        self.stop_button = QPushButton("⏹️ 중지")
        self.stop_button.setEnabled(False)
        self.stop_button.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                border: none;
                padding: 10px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #da190b;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        row2.addWidget(self.stop_button)
        
        self.clear_button = QPushButton("🗑️ 목록 지우기")
        row2.addWidget(self.clear_button)
        
        self.save_button = QPushButton("💾 JSON 저장")
        row2.addWidget(self.save_button)
        
        row2.addStretch()
        layout.addLayout(row2)
        
        return group_box
        
    def createNewsListTab(self):
        """뉴스 목록 탭 생성"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 상단 정보
        info_layout = QHBoxLayout()
        self.article_count_label = QLabel("📊 수집된 기사: 0개")
        info_layout.addWidget(self.article_count_label)
        info_layout.addStretch()
        
        layout.addLayout(info_layout)
        
        # 뉴스 테이블
        self.news_table = NewsTableWidget()
        layout.addWidget(self.news_table)
        
        return widget
        
    def createNewsDetailTab(self):
        """뉴스 상세 탭 생성"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 제목
        self.detail_title = QLabel("기사를 선택하세요")
        self.detail_title.setFont(QFont("Arial", 16, QFont.Bold))
        self.detail_title.setWordWrap(True)
        layout.addWidget(self.detail_title)
        
        # 메타 정보
        meta_layout = QHBoxLayout()
        self.detail_press = QLabel("")
        self.detail_date = QLabel("")
        self.detail_url = QLabel("")
        
        meta_layout.addWidget(self.detail_press)
        meta_layout.addWidget(self.detail_date)
        meta_layout.addStretch()
        layout.addLayout(meta_layout)
        
        # URL 표시
        layout.addWidget(self.detail_url)
        
        # 본문
        self.detail_content = QTextEdit()
        self.detail_content.setReadOnly(True)
        layout.addWidget(self.detail_content)
        
        return widget
        
    def createSettingsTab(self):
        """설정 탭 생성"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 크롤링 설정
        crawl_group = QGroupBox("🕷️ 크롤링 설정")
        crawl_layout = QVBoxLayout(crawl_group)
        
        # 요청 간격
        interval_layout = QHBoxLayout()
        interval_layout.addWidget(QLabel("요청 간격 (초):"))
        self.interval_spin = QSpinBox()
        self.interval_spin.setRange(1, 10)
        self.interval_spin.setValue(1)
        interval_layout.addWidget(self.interval_spin)
        interval_layout.addStretch()
        crawl_layout.addLayout(interval_layout)
        
        # 타임아웃 설정
        timeout_layout = QHBoxLayout()
        timeout_layout.addWidget(QLabel("타임아웃 (초):"))
        self.timeout_spin = QSpinBox()
        self.timeout_spin.setRange(5, 60)
        self.timeout_spin.setValue(30)
        timeout_layout.addWidget(self.timeout_spin)
        timeout_layout.addStretch()
        crawl_layout.addLayout(timeout_layout)
        
        layout.addWidget(crawl_group)
        
        # 저장 설정
        save_group = QGroupBox("💾 저장 설정")
        save_layout = QVBoxLayout(save_group)
        
        # 자동 저장
        self.auto_save_check = QCheckBox("크롤링 완료 후 자동 저장")
        save_layout.addWidget(self.auto_save_check)
        
        # 저장 경로
        path_layout = QHBoxLayout()
        path_layout.addWidget(QLabel("저장 경로:"))
        self.save_path_input = QLineEdit()
        self.save_path_input.setText(os.getcwd())
        path_layout.addWidget(self.save_path_input)
        
        browse_button = QPushButton("📁 찾아보기")
        browse_button.clicked.connect(self.browseSavePath)
        path_layout.addWidget(browse_button)
        save_layout.addLayout(path_layout)
        
        layout.addWidget(save_group)
        
        layout.addStretch()
        return widget
        
    def setupConnections(self):
        """시그널-슬롯 연결"""
        self.start_button.clicked.connect(self.startCrawling)
        self.stop_button.clicked.connect(self.stopCrawling)
        self.clear_button.clicked.connect(self.clearArticles)
        self.save_button.clicked.connect(self.saveArticles)
        
        # 테이블 선택 이벤트
        self.news_table.itemSelectionChanged.connect(self.showArticleDetail)
        
        # 키워드 입력 엔터키
        self.keyword_input.returnPressed.connect(self.startCrawling)
        
    def applyStyles(self):
        """스타일 적용"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #cccccc;
                border-radius: 5px;
                margin-top: 1ex;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
            QTableWidget {
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            QTextEdit {
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
            }
            QPushButton {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 8px;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #e6e6e6;
            }
        """)
        
    def startCrawling(self):
        """크롤링 시작"""
        keyword = self.keyword_input.text().strip()
        if not keyword:
            QMessageBox.warning(self, "경고", "검색 키워드를 입력해주세요.")
            return
            
        # URL 생성
        import urllib.parse
        encoded_keyword = urllib.parse.quote(keyword)
        search_url = f"https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query={encoded_keyword}"
        
        max_articles = self.max_articles_spin.value()
        
        # UI 상태 변경
        self.start_button.setEnabled(False)
        self.stop_button.setEnabled(True)
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        
        # 크롤링 스레드 시작
        self.crawler_thread = CrawlerThread(search_url, max_articles)
        self.crawler_thread.progress_updated.connect(self.progress_bar.setValue)
        self.crawler_thread.status_updated.connect(self.status_bar.showMessage)
        self.crawler_thread.article_found.connect(self.addArticle)
        self.crawler_thread.finished_crawling.connect(self.crawlingFinished)
        self.crawler_thread.error_occurred.connect(self.showError)
        self.crawler_thread.start()
        
    def stopCrawling(self):
        """크롤링 중지"""
        if self.crawler_thread and self.crawler_thread.isRunning():
            self.crawler_thread.requestInterruption()
            self.crawler_thread.wait()
            
        self.crawlingFinished([])
        
    def addArticle(self, article):
        """기사 추가"""
        self.articles.append(article)
        self.news_table.addArticle(article)
        self.article_count_label.setText(f"📊 수집된 기사: {len(self.articles)}개")
        
    def crawlingFinished(self, articles):
        """크롤링 완료"""
        self.start_button.setEnabled(True)
        self.stop_button.setEnabled(False)
        self.progress_bar.setVisible(False)
        
        if articles:
            self.articles = articles
            
        self.status_bar.showMessage(f"크롤링 완료 - 총 {len(self.articles)}개 기사 수집")
        
        # 자동 저장
        if self.auto_save_check.isChecked() and self.articles:
            self.saveArticles()
            
    def showError(self, error_message):
        """에러 표시"""
        QMessageBox.critical(self, "오류", error_message)
        self.crawlingFinished([])
        
    def clearArticles(self):
        """기사 목록 지우기"""
        reply = QMessageBox.question(self, "확인", "모든 기사를 지우시겠습니까?",
                                   QMessageBox.Yes | QMessageBox.No,
                                   QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.articles = []
            self.news_table.clearArticles()
            self.article_count_label.setText("📊 수집된 기사: 0개")
            
            # 상세 탭 초기화
            self.detail_title.setText("기사를 선택하세요")
            self.detail_press.setText("")
            self.detail_date.setText("")
            self.detail_url.setText("")
            self.detail_content.clear()
            
    def saveArticles(self):
        """기사 JSON 저장"""
        if not self.articles:
            QMessageBox.information(self, "알림", "저장할 기사가 없습니다.")
            return
            
        # 파일 저장 대화상자
        default_filename = f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        save_path = self.save_path_input.text()
        default_path = os.path.join(save_path, default_filename)
        
        filename, _ = QFileDialog.getSaveFileName(
            self, "JSON 파일 저장", default_path,
            "JSON files (*.json);;All files (*.*)"
        )
        
        if filename:
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(self.articles, f, ensure_ascii=False, indent=2)
                    
                QMessageBox.information(self, "성공", 
                                      f"✅ {len(self.articles)}개 기사가 저장되었습니다.\n"
                                      f"📁 파일: {filename}")
                                      
            except Exception as e:
                QMessageBox.critical(self, "오류", f"파일 저장 중 오류가 발생했습니다:\n{str(e)}")
                
    def showArticleDetail(self):
        """선택된 기사 상세 보기"""
        current_row = self.news_table.currentRow()
        if current_row >= 0 and current_row < len(self.articles):
            article = self.articles[current_row]
            
            # 제목
            self.detail_title.setText(article.get('title', 'N/A'))
            
            # 메타 정보
            self.detail_press.setText(f"🏢 {article.get('press', 'N/A')}")
            self.detail_date.setText(f"📅 {article.get('date', 'N/A')}")
            self.detail_url.setText(f"🔗 {article.get('url', 'N/A')}")
            
            # 본문
            content = article.get('content', '본문이 없습니다.')
            self.detail_content.setPlainText(content)
            
    def browseSavePath(self):
        """저장 경로 찾아보기"""
        path = QFileDialog.getExistingDirectory(self, "저장 경로 선택", self.save_path_input.text())
        if path:
            self.save_path_input.setText(path)

def main():
    """메인 함수"""
    app = QApplication(sys.argv)
    
    # 애플리케이션 정보 설정
    app.setApplicationName("네이버 뉴스 크롤러")
    app.setApplicationVersion("1.0")
    app.setOrganizationName("Claude Code")
    
    # GUI 생성 및 표시
    window = NaverNewsGUI()
    window.show()
    
    # 이벤트 루프 시작
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()