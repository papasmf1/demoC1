"""
정렬 알고리즘 모음 모듈
다양한 정렬 알고리즘의 구현, 성능 비교, 시각화 기능을 제공합니다.

작성자: Claude Code
날짜: 2025-08-13
"""

import time
import random
import matplotlib.pyplot as plt
import numpy as np
from typing import List, Callable, Tuple, Dict
from functools import wraps


def timing_decorator(func: Callable) -> Callable:
    """함수 실행 시간을 측정하는 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        return result, execution_time
    return wrapper


class SortingAlgorithms:
    """정렬 알고리즘 클래스"""
    
    def __init__(self):
        """정렬 알고리즘 클래스 초기화"""
        self.comparison_count = 0
        self.swap_count = 0
        self.steps = []  # 시각화를 위한 단계 저장
        
    def reset_counters(self):
        """카운터 초기화"""
        self.comparison_count = 0
        self.swap_count = 0
        self.steps = []
    
    def compare(self, a, b) -> bool:
        """비교 연산 (카운터 증가)"""
        self.comparison_count += 1
        return a > b
    
    def swap(self, arr: List, i: int, j: int):
        """교환 연산 (카운터 증가)"""
        self.swap_count += 1
        arr[i], arr[j] = arr[j], arr[i]
        self.steps.append(arr.copy())  # 시각화를 위해 단계 저장
    
    # ========== 기본 정렬 알고리즘 ==========
    
    def bubble_sort(self, arr: List[int]) -> List[int]:
        """
        버블 정렬 (Bubble Sort)
        시간복잡도: O(n²)
        공간복잡도: O(1)
        안정정렬: O
        """
        n = len(arr)
        result = arr.copy()
        
        for i in range(n):
            swapped = False
            for j in range(0, n - i - 1):
                if self.compare(result[j], result[j + 1]):
                    self.swap(result, j, j + 1)
                    swapped = True
            
            # 최적화: 교환이 없으면 이미 정렬됨
            if not swapped:
                break
                
        return result
    
    def selection_sort(self, arr: List[int]) -> List[int]:
        """
        선택 정렬 (Selection Sort)
        시간복잡도: O(n²)
        공간복잡도: O(1)
        안정정렬: X
        """
        n = len(arr)
        result = arr.copy()
        
        for i in range(n):
            min_idx = i
            for j in range(i + 1, n):
                if self.compare(result[min_idx], result[j]):
                    min_idx = j
            
            if min_idx != i:
                self.swap(result, i, min_idx)
                
        return result
    
    def insertion_sort(self, arr: List[int]) -> List[int]:
        """
        삽입 정렬 (Insertion Sort)
        시간복잡도: O(n²)
        공간복잡도: O(1)
        안정정렬: O
        """
        result = arr.copy()
        
        for i in range(1, len(result)):
            key = result[i]
            j = i - 1
            
            while j >= 0 and self.compare(result[j], key):
                self.comparison_count += 1
                result[j + 1] = result[j]
                j -= 1
                self.steps.append(result.copy())
            
            result[j + 1] = key
            self.steps.append(result.copy())
            
        return result
    
    # ========== 고급 정렬 알고리즘 ==========
    
    def merge_sort(self, arr: List[int]) -> List[int]:
        """
        병합 정렬 (Merge Sort)
        시간복잡도: O(n log n)
        공간복잡도: O(n)
        안정정렬: O
        """
        def merge(left: List[int], right: List[int]) -> List[int]:
            result = []
            i = j = 0
            
            while i < len(left) and j < len(right):
                if not self.compare(left[i], right[j]):
                    result.append(left[i])
                    i += 1
                else:
                    result.append(right[j])
                    j += 1
            
            result.extend(left[i:])
            result.extend(right[j:])
            self.steps.append(result.copy())
            return result
        
        def merge_sort_helper(arr: List[int]) -> List[int]:
            if len(arr) <= 1:
                return arr
            
            mid = len(arr) // 2
            left = merge_sort_helper(arr[:mid])
            right = merge_sort_helper(arr[mid:])
            
            return merge(left, right)
        
        return merge_sort_helper(arr.copy())
    
    def quick_sort(self, arr: List[int]) -> List[int]:
        """
        퀵 정렬 (Quick Sort)
        시간복잡도: 평균 O(n log n), 최악 O(n²)
        공간복잡도: O(log n)
        안정정렬: X
        """
        def partition(arr: List[int], low: int, high: int) -> int:
            pivot = arr[high]
            i = low - 1
            
            for j in range(low, high):
                if not self.compare(arr[j], pivot):
                    i += 1
                    if i != j:
                        self.swap(arr, i, j)
            
            if i + 1 != high:
                self.swap(arr, i + 1, high)
            return i + 1
        
        def quick_sort_helper(arr: List[int], low: int, high: int):
            if low < high:
                pi = partition(arr, low, high)
                quick_sort_helper(arr, low, pi - 1)
                quick_sort_helper(arr, pi + 1, high)
        
        result = arr.copy()
        quick_sort_helper(result, 0, len(result) - 1)
        return result
    
    def heap_sort(self, arr: List[int]) -> List[int]:
        """
        힙 정렬 (Heap Sort)
        시간복잡도: O(n log n)
        공간복잡도: O(1)
        안정정렬: X
        """
        def heapify(arr: List[int], n: int, i: int):
            largest = i
            left = 2 * i + 1
            right = 2 * i + 2
            
            if left < n and self.compare(arr[left], arr[largest]):
                largest = left
            
            if right < n and self.compare(arr[right], arr[largest]):
                largest = right
            
            if largest != i:
                self.swap(arr, i, largest)
                heapify(arr, n, largest)
        
        result = arr.copy()
        n = len(result)
        
        # 힙 구성
        for i in range(n // 2 - 1, -1, -1):
            heapify(result, n, i)
        
        # 힙에서 원소를 하나씩 추출
        for i in range(n - 1, 0, -1):
            self.swap(result, 0, i)
            heapify(result, i, 0)
        
        return result
    
    def counting_sort(self, arr: List[int]) -> List[int]:
        """
        계수 정렬 (Counting Sort)
        시간복잡도: O(n + k) (k는 최대값)
        공간복잡도: O(k)
        안정정렬: O
        """
        if not arr:
            return arr
        
        # 음수 처리를 위한 오프셋 계산
        min_val = min(arr)
        max_val = max(arr)
        range_size = max_val - min_val + 1
        
        # 카운트 배열 초기화
        count = [0] * range_size
        output = [0] * len(arr)
        
        # 각 원소의 개수 세기
        for num in arr:
            count[num - min_val] += 1
        
        # 누적 카운트 계산
        for i in range(1, range_size):
            count[i] += count[i - 1]
        
        # 출력 배열 구성 (안정 정렬을 위해 뒤에서부터)
        for i in range(len(arr) - 1, -1, -1):
            output[count[arr[i] - min_val] - 1] = arr[i]
            count[arr[i] - min_val] -= 1
            self.steps.append(output.copy())
        
        return output
    
    def radix_sort(self, arr: List[int]) -> List[int]:
        """
        기수 정렬 (Radix Sort)
        시간복잡도: O(d × (n + k)) (d는 자릿수, k는 기수)
        공간복잡도: O(n + k)
        안정정렬: O
        """
        if not arr:
            return arr
        
        def counting_sort_for_radix(arr: List[int], exp: int) -> List[int]:
            n = len(arr)
            output = [0] * n
            count = [0] * 10
            
            # 각 자릿수의 개수 세기
            for i in range(n):
                index = (arr[i] // exp) % 10
                count[index] += 1
            
            # 누적 카운트
            for i in range(1, 10):
                count[i] += count[i - 1]
            
            # 출력 배열 구성
            i = n - 1
            while i >= 0:
                index = (arr[i] // exp) % 10
                output[count[index] - 1] = arr[i]
                count[index] -= 1
                i -= 1
            
            return output
        
        result = arr.copy()
        max_num = max(result)
        
        exp = 1
        while max_num // exp > 0:
            result = counting_sort_for_radix(result, exp)
            self.steps.append(result.copy())
            exp *= 10
        
        return result
    
    # ========== 특수 정렬 알고리즘 ==========
    
    def bucket_sort(self, arr: List[float], num_buckets: int = 10) -> List[float]:
        """
        버킷 정렬 (Bucket Sort)
        시간복잡도: 평균 O(n + k), 최악 O(n²)
        공간복잡도: O(n + k)
        안정정렬: O (내부 정렬이 안정적인 경우)
        """
        if not arr:
            return arr
        
        # 버킷 초기화
        buckets = [[] for _ in range(num_buckets)]
        
        # 최대값과 최소값 찾기
        min_val, max_val = min(arr), max(arr)
        bucket_range = (max_val - min_val) / num_buckets
        
        # 원소들을 버킷에 분배
        for num in arr:
            if num == max_val:
                bucket_index = num_buckets - 1
            else:
                bucket_index = int((num - min_val) / bucket_range)
            buckets[bucket_index].append(num)
        
        # 각 버킷 정렬 (삽입 정렬 사용)
        result = []
        for bucket in buckets:
            if bucket:
                # 간단한 삽입 정렬
                for i in range(1, len(bucket)):
                    key = bucket[i]
                    j = i - 1
                    while j >= 0 and bucket[j] > key:
                        bucket[j + 1] = bucket[j]
                        j -= 1
                    bucket[j + 1] = key
                result.extend(bucket)
                self.steps.append(result.copy())
        
        return result


class SortingVisualizer:
    """정렬 알고리즘 시각화 클래스"""
    
    @staticmethod
    def visualize_sorting_steps(steps: List[List[int]], algorithm_name: str, delay: float = 0.1):
        """정렬 단계별 시각화"""
        plt.figure(figsize=(12, 8))
        
        for i, step in enumerate(steps):
            plt.clf()
            plt.bar(range(len(step)), step, color='skyblue', edgecolor='black')
            plt.title(f'{algorithm_name} - Step {i + 1}')
            plt.xlabel('Index')
            plt.ylabel('Value')
            plt.pause(delay)
        
        plt.show()
    
    @staticmethod
    def compare_algorithms(arr: List[int], algorithms: Dict[str, Callable]) -> Dict[str, Dict]:
        """알고리즘 성능 비교"""
        results = {}
        
        for name, algorithm in algorithms.items():
            sorter = SortingAlgorithms()
            start_time = time.time()
            
            sorted_arr = algorithm(sorter, arr.copy())
            
            end_time = time.time()
            
            results[name] = {
                'time': end_time - start_time,
                'comparisons': sorter.comparison_count,
                'swaps': sorter.swap_count,
                'is_sorted': sorted_arr == sorted(arr)
            }
        
        return results
    
    @staticmethod
    def plot_performance_comparison(results: Dict[str, Dict]):
        """성능 비교 그래프"""
        algorithms = list(results.keys())
        times = [results[alg]['time'] for alg in algorithms]
        comparisons = [results[alg]['comparisons'] for alg in algorithms]
        swaps = [results[alg]['swaps'] for alg in algorithms]
        
        fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(18, 6))
        
        # 실행 시간 비교
        ax1.bar(algorithms, times, color='lightcoral')
        ax1.set_title('실행 시간 비교')
        ax1.set_ylabel('시간 (초)')
        ax1.tick_params(axis='x', rotation=45)
        
        # 비교 연산 횟수
        ax2.bar(algorithms, comparisons, color='lightblue')
        ax2.set_title('비교 연산 횟수')
        ax2.set_ylabel('비교 횟수')
        ax2.tick_params(axis='x', rotation=45)
        
        # 교환 연산 횟수
        ax3.bar(algorithms, swaps, color='lightgreen')
        ax3.set_title('교환 연산 횟수')
        ax3.set_ylabel('교환 횟수')
        ax3.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.show()


class SortingTester:
    """정렬 알고리즘 테스트 클래스"""
    
    @staticmethod
    def generate_test_data(size: int, data_type: str = 'random') -> List[int]:
        """테스트 데이터 생성"""
        if data_type == 'random':
            return [random.randint(1, 1000) for _ in range(size)]
        elif data_type == 'sorted':
            return list(range(1, size + 1))
        elif data_type == 'reverse':
            return list(range(size, 0, -1))
        elif data_type == 'nearly_sorted':
            arr = list(range(1, size + 1))
            # 10% 정도 섞기
            for _ in range(size // 10):
                i, j = random.randint(0, size - 1), random.randint(0, size - 1)
                arr[i], arr[j] = arr[j], arr[i]
            return arr
        elif data_type == 'duplicates':
            return [random.randint(1, size // 3) for _ in range(size)]
        else:
            raise ValueError(f"Unknown data type: {data_type}")
    
    @staticmethod
    def test_correctness(algorithms: Dict[str, Callable], test_cases: List[List[int]]) -> Dict[str, bool]:
        """정렬 알고리즘 정확성 테스트"""
        results = {}
        
        for name, algorithm in algorithms.items():
            all_correct = True
            sorter = SortingAlgorithms()
            
            for test_case in test_cases:
                sorted_result = algorithm(sorter, test_case.copy())
                expected = sorted(test_case)
                
                if sorted_result != expected:
                    all_correct = False
                    break
                
                sorter.reset_counters()
            
            results[name] = all_correct
        
        return results
    
    @staticmethod
    def benchmark_algorithms(sizes: List[int], data_types: List[str], algorithms: Dict[str, Callable]):
        """알고리즘 벤치마크"""
        results = {}
        
        for size in sizes:
            results[size] = {}
            
            for data_type in data_types:
                print(f"Testing size: {size}, type: {data_type}")
                test_data = SortingTester.generate_test_data(size, data_type)
                
                results[size][data_type] = SortingVisualizer.compare_algorithms(test_data, algorithms)
        
        return results


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("정렬 알고리즘 모음 (Sorting Algorithms Collection)")
    print("=" * 60)
    
    # 정렬 알고리즘 인스턴스 생성
    sorter = SortingAlgorithms()
    
    # 사용 가능한 알고리즘들
    algorithms = {
        'Bubble Sort': SortingAlgorithms.bubble_sort,
        'Selection Sort': SortingAlgorithms.selection_sort,
        'Insertion Sort': SortingAlgorithms.insertion_sort,
        'Merge Sort': SortingAlgorithms.merge_sort,
        'Quick Sort': SortingAlgorithms.quick_sort,
        'Heap Sort': SortingAlgorithms.heap_sort,
        'Counting Sort': SortingAlgorithms.counting_sort,
        'Radix Sort': SortingAlgorithms.radix_sort
    }
    
    # 테스트 데이터 생성
    test_sizes = [10, 50, 100]
    
    print("\\n[알고리즘별 시간복잡도 및 특성]:")
    print("-" * 60)
    complexity_info = {
        'Bubble Sort': 'O(n²) - 안정정렬, 제자리정렬',
        'Selection Sort': 'O(n²) - 불안정정렬, 제자리정렬',
        'Insertion Sort': 'O(n²) - 안정정렬, 제자리정렬, 거의 정렬된 데이터에 효율적',
        'Merge Sort': 'O(n log n) - 안정정렬, 추가 메모리 필요',
        'Quick Sort': 'O(n log n) 평균, O(n²) 최악 - 불안정정렬, 제자리정렬',
        'Heap Sort': 'O(n log n) - 불안정정렬, 제자리정렬',
        'Counting Sort': 'O(n + k) - 안정정렬, 정수 데이터만 가능',
        'Radix Sort': 'O(d × (n + k)) - 안정정렬, 정수 데이터만 가능'
    }
    
    for name, info in complexity_info.items():
        print(f"{name:15}: {info}")
    
    # 작은 데이터셋으로 예시 실행
    print("\\n[작은 데이터셋 정렬 예시]:")
    print("-" * 60)
    
    small_data = [64, 34, 25, 12, 22, 11, 90]
    print(f"원본 데이터: {small_data}")
    
    # 각 알고리즘으로 정렬 실행
    for name, algorithm in algorithms.items():
        sorter.reset_counters()
        
        start_time = time.time()
        sorted_data = algorithm(sorter, small_data.copy())
        end_time = time.time()
        
        print(f"\\n{name}:")
        print(f"  결과: {sorted_data}")
        print(f"  시간: {(end_time - start_time) * 1000:.3f}ms")
        print(f"  비교: {sorter.comparison_count}회, 교환: {sorter.swap_count}회")
    
    # 성능 비교 테스트
    print("\\n[성능 비교 테스트 (크기별)]:")
    print("-" * 60)
    
    for size in test_sizes:
        print(f"\\n[데이터 크기: {size}]")
        test_data = SortingTester.generate_test_data(size, 'random')
        
        # 빠른 알고리즘들만 테스트 (큰 데이터에서)
        if size <= 50:
            test_algorithms = algorithms
        else:
            test_algorithms = {
                'Merge Sort': algorithms['Merge Sort'],
                'Quick Sort': algorithms['Quick Sort'],
                'Heap Sort': algorithms['Heap Sort']
            }
        
        results = SortingVisualizer.compare_algorithms(test_data, test_algorithms)
        
        # 결과 출력
        for alg_name, metrics in results.items():
            print(f"  {alg_name:15}: {metrics['time']*1000:6.2f}ms, "
                  f"비교: {metrics['comparisons']:6d}, 교환: {metrics['swaps']:6d}")
    
    # 정확성 테스트
    print("\\n[정확성 테스트]:")
    print("-" * 60)
    
    test_cases = [
        [],  # 빈 배열
        [1],  # 단일 원소
        [1, 2, 3, 4, 5],  # 이미 정렬됨
        [5, 4, 3, 2, 1],  # 역순
        [3, 1, 4, 1, 5, 9, 2, 6],  # 랜덤
        [1, 1, 1, 1, 1],  # 모두 같음
    ]
    
    correctness_results = SortingTester.test_correctness(algorithms, test_cases)
    
    for alg_name, is_correct in correctness_results.items():
        status = "[통과]" if is_correct else "[실패]"
        print(f"  {alg_name:15}: {status}")
    
    print("\\n[사용 권장사항]:")
    print("-" * 60)
    recommendations = [
        "- 작은 데이터 (< 50): Insertion Sort",
        "- 일반적인 경우: Quick Sort 또는 Merge Sort",
        "- 안정 정렬 필요: Merge Sort",
        "- 메모리 제약: Heap Sort",
        "- 정수 데이터, 범위 제한: Counting Sort",
        "- 큰 정수 데이터: Radix Sort",
        "- 거의 정렬된 데이터: Insertion Sort"
    ]
    
    for recommendation in recommendations:
        print(recommendation)
    
    print("\\n" + "=" * 60)
    print("정렬 알고리즘 분석 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()