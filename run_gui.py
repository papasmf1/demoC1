#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
네이버 뉴스 크롤러 GUI 실행 스크립트
"""

import sys
import os

def check_dependencies():
    """필요한 라이브러리 설치 확인"""
    missing_packages = []
    
    try:
        import PyQt5
    except ImportError:
        missing_packages.append('PyQt5')
    
    try:
        import requests
    except ImportError:
        missing_packages.append('requests')
        
    try:
        import bs4
    except ImportError:
        missing_packages.append('beautifulsoup4')
    
    if missing_packages:
        print("❌ 다음 패키지가 설치되지 않았습니다:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 다음 명령어로 설치하세요:")
        print("   pip install -r requirements.txt")
        print("\n또는 개별 설치:")
        for package in missing_packages:
            print(f"   pip install {package}")
        return False
    
    return True

def main():
    """메인 실행 함수"""
    print("🚀 네이버 뉴스 크롤러 GUI 시작...")
    
    # 의존성 확인
    if not check_dependencies():
        input("\n아무 키나 눌러서 종료...")
        return
    
    try:
        # GUI 모듈 import 및 실행
        from naver_news_gui import main as run_gui
        print("✅ 모든 라이브러리가 설치되어 있습니다.")
        print("🖥️  GUI 창을 열고 있습니다...")
        
        run_gui()
        
    except ImportError as e:
        print(f"❌ 모듈 import 오류: {e}")
        print("💡 naver_news_crawler.py 파일이 같은 폴더에 있는지 확인하세요.")
        input("\n아무 키나 눌러서 종료...")
        
    except Exception as e:
        print(f"❌ 실행 중 오류 발생: {e}")
        input("\n아무 키나 눌러서 종료...")

if __name__ == "__main__":
    main()