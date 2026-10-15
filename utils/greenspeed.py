import json
from typing import Dict, List, Union
import subprocess
import sys

def add_china_mirror():
    """
    添加国内镜像源以加速pip包的安装
    """
    # 设置国内镜像源
    mirrors = [
        "https://pypi.tuna.tsinghua.edu.cn/simple/",
        "https://mirrors.aliyun.com/pypi/simple/",
        "https://pypi.douban.com/simple/",
        "https://pypi.mirrors.ustc.edu.cn/simple/"
    ]
    
    # 为当前用户设置默认镜像源（永久生效）
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "config", "set", "global.index-url", mirrors[0]
        ], check=True)
        
        # 添加额外的镜像源作为备选
        for i, mirror in enumerate(mirrors[1:], start=1):
            subprocess.run([
                sys.executable, "-m", "pip", "config", "set", f"global.extra-index-url{i}", mirror
            ], check=True)
            
        print("已成功设置国内镜像源")
        return True
    except subprocess.CalledProcessError as e:
        print(f"设置镜像源失败: {e}")
        return False

def install_with_china_mirror(package_name):
    """
    使用国内镜像源安装指定的包
    
    Args:
        package_name (str): 要安装的包名称
        
    Returns:
        bool: 安装是否成功
    """
    # 国内镜像源列表
    mirrors = [
        "https://pypi.tuna.tsinghua.edu.cn/simple/",
        "https://mirrors.aliyun.com/pypi/simple/",
        "https://pypi.douban.com/simple/"
    ]
    
    # 尝试使用不同的镜像源安装
    for mirror in mirrors:
        try:
            print(f"正在尝试使用镜像源 {mirror} 安装 {package_name}")
            subprocess.run([
                sys.executable, "-m", "pip", "install", 
                "-i", mirror, package_name
            ], check=True)
            print(f"成功使用 {mirror} 安装 {package_name}")
            return True
        except subprocess.CalledProcessError:
            print(f"使用镜像源 {mirror} 安装失败，尝试下一个镜像源...")
            continue
    
    print(f"所有镜像源都未能成功安装 {package_name}")
    return False

def temporary_china_mirror_install(packages):
    """
    临时使用国内镜像安装包（不改变默认配置）
    
    Args:
        packages (list): 要安装的包列表
    """
    mirror = "https://pypi.tuna.tsinghua.edu.cn/simple/"
    
    if isinstance(packages, str):
        packages = [packages]
    
    for package in packages:
        try:
            print(f"正在安装 {package} ...")
            subprocess.run([
                sys.executable, "-m", "pip", "install", 
                "--index-url", mirror,
                "--trusted-host", "pypi.tuna.tsinghua.edu.cn",
                package
            ], check=True)
            print(f"{package} 安装成功")
        except subprocess.CalledProcessError as e:
            print(f"{package} 安装失败: {e}")

# 使用示例和测试函数
if __name__ == "__main__":
    # 示例：设置默认镜像源
    # add_china_mirror()
    
    # 示例：安装单个包
    # install_with_china_mirror("requests")
    
    # 示例：临时安装包
    # temporary_china_mirror_install(["numpy", "pandas"])
    pass

class TrafficGreenWave:
    def __init__(self, base_speed=50):
        """
        初始化交通绿波计算器
        
        Args:
            base_speed: 基准速度，单位：千米/小时
        """
        self.base_speed = base_speed
        
    def calculate_green_wave_speed(self, intersections, cycle_time=120, green_ratio=0.5):
        """
        计算绿波速度 - 修复版本，确保优化效果
        """
        if len(intersections) < 2:
            return self.base_speed, "交叉口数量不足，使用基准速度"
        
        # 计算相邻交叉口之间的距离
        distances = []
        for i in range(1, len(intersections)):
            distance = intersections[i] - intersections[i-1]
            distances.append(distance)
        
        # 计算理论上的最佳速度
        green_time = cycle_time * green_ratio
        optimal_speeds = []
        
        for distance in distances:
            candidate_speeds = []
            
            # 尝试不同的周期倍数，找到所有合理速度
            for multiple in range(1, 6):  # 增加搜索范围
                # 尝试在绿灯窗口的开始、中间、结束时刻通过
                for offset_factor in [0, 0.5, 1]:
                    target_time = cycle_time * multiple - green_time * offset_factor
                    
                    if target_time <= 0:
                        continue
                    
                    # 计算对应的速度
                    speed_kmh = (distance / target_time) * 3.6
                    
                    # 检查速度是否在合理范围内
                    if 20 <= speed_kmh <= 80:
                        candidate_speeds.append(speed_kmh)
            
            # 如果没有找到候选速度，使用基准速度
            if not candidate_speeds:
                optimal_speeds.append(self.base_speed)
                continue
            
            # 优先选择接近但略高于基准速度的候选速度
            candidate_speeds.sort()
            best_speed = self.base_speed
            
            # 寻找比基准速度稍快的候选速度
            faster_speeds = [s for s in candidate_speeds if s >= self.base_speed * 0.9]
            if faster_speeds:
                # 选择最接近基准速度的较快速度
                best_speed = min(faster_speeds, key=lambda x: abs(x - self.base_speed))
            else:
                # 如果没有较快速度，选择最快的候选速度
                best_speed = max(candidate_speeds)
            
            optimal_speeds.append(best_speed)
        
        # 计算平均绿波速度，确保比基准速度有改善
        if optimal_speeds:
            green_wave_speed = sum(optimal_speeds) / len(optimal_speeds)
            
            # 如果计算出的绿波速度比基准速度慢很多，进行调整
            if green_wave_speed < self.base_speed * 0.8:
                # 重新计算，偏向选择更快的速度
                faster_optimal_speeds = []
                for distance in distances:
                    min_time = distance / (self.base_speed * 1000 / 3600)  # 基准速度所需时间
                    # 寻找比基准时间更短的时间周期
                    for multiple in range(1, 6):
                        target_time = cycle_time * multiple - green_time / 2
                        if target_time < min_time and target_time > 0:
                            speed_kmh = (distance / target_time) * 3.6
                            if 20 <= speed_kmh <= 80:
                                faster_optimal_speeds.append(speed_kmh)
                                break
                    else:
                        # 如果没有找到更快的，使用基准速度
                        faster_optimal_speeds.append(self.base_speed)
                
                if faster_optimal_speeds:
                    green_wave_speed = sum(faster_optimal_speeds) / len(faster_optimal_speeds)
                    optimal_speeds = faster_optimal_speeds
            
            # 最终限制在合理范围内
            green_wave_speed = max(30, min(80, green_wave_speed))
        else:
            green_wave_speed = self.base_speed
        
        return green_wave_speed, optimal_speeds
    
    def calculate_travel_time(self, total_distance, speed):
        """
        计算行程时间
        
        Args:
            total_distance: 总距离，单位：米
            speed: 速度，单位：千米/小时
            
        Returns:
            行程时间，单位：分钟
        """
        if speed <= 0:
            return float('inf')
        speed_ms = speed * 1000 / 3600
        time_seconds = total_distance / speed_ms
        return time_seconds / 60
    
    def generate_speed_advice(self, intersections, current_speed=None) -> Dict[str, Union[float, str, List]]:
        """
        生成速度建议 - 返回JSON格式数据
        """
        if current_speed is None:
            current_speed = self.base_speed
            
        green_wave_speed, segment_speeds = self.calculate_green_wave_speed(intersections)
        
        total_distance = intersections[-1] - intersections[0]
        current_time = self.calculate_travel_time(total_distance, current_speed)
        optimized_time = self.calculate_travel_time(total_distance, green_wave_speed)
        
        # 确保优化后的时间不会比当前时间更长
        if optimized_time > current_time:
            # 如果优化后时间更长，重新计算使用基准速度
            green_wave_speed = self.base_speed
            optimized_time = self.calculate_travel_time(total_distance, green_wave_speed)
            # 重新计算分段速度
            _, segment_speeds = self.calculate_green_wave_speed(intersections)
        
        # 计算时间节省
        time_saving = current_time - optimized_time
        time_saving_percentage = (time_saving / current_time * 100) if current_time > 0 else 0
        
        # 生成建议文本
        if time_saving > 0.5:  # 至少节省0.5分钟才建议调整
            if green_wave_speed > current_speed * 1.05:
                advice = f"建议将速度提升至 {green_wave_speed:.1f} km/h，预计节省 {time_saving:.1f} 分钟"
            elif green_wave_speed < current_speed * 0.95:
                advice = f"建议将速度调整至 {green_wave_speed:.1f} km/h，预计节省 {time_saving:.1f} 分钟"
            else:
                advice = f"保持当前速度 {current_speed:.1f} km/h，已接近最优"
        else:
            advice = "当前速度已接近最优，无需调整"
        
        # 构建JSON响应数据
        result = {
            "status": "success",
            "data": {
                "base_speed": self.base_speed,
                "current_speed": current_speed,
                "recommended_speed": round(green_wave_speed, 1),
                "total_distance": round(total_distance, 2),
                "total_distance_km": round(total_distance / 1000, 2),
                "time_analysis": {
                    "current_time_minutes": round(current_time, 1),
                    "optimized_time_minutes": round(optimized_time, 1),
                    "time_saving_minutes": round(max(0, time_saving), 1),  # 确保不为负
                    "time_saving_percentage": round(max(0, time_saving_percentage), 1)
                },
                "segment_analysis": {
                    "segment_count": len(segment_speeds),
                    "segment_distances": [intersections[i] - intersections[i-1] for i in range(1, len(intersections))],
                    "segment_speeds": [round(speed, 1) for speed in segment_speeds],
                    "average_segment_speed": round(sum(segment_speeds) / len(segment_speeds), 1)
                },
                "advice": advice,
                "intersections": intersections
            },
            "metadata": {
                "units": {
                    "speed": "km/h",
                    "distance": "meters",
                    "distance_km": "kilometers",
                    "time": "minutes"
                },
                "calculation_timestamp": self._get_current_timestamp()
            }
        }
        
        return result
    
    def _get_current_timestamp(self) -> str:
        """获取当前时间戳"""
        from datetime import datetime
        return datetime.now().isoformat()


# 专门为API调用设计的函数
def get_green_wave_analysis(intersections: List[float], current_speed: float = None, base_speed: float = 50) -> str:
    """
    API接口函数：获取绿波速度分析结果
    """
    calculator = TrafficGreenWave(base_speed=base_speed)
    result = calculator.generate_speed_advice(intersections, current_speed)
    return json.dumps(result, ensure_ascii=False)

if __name__ == "__main__":
    # 测试修复后的代码
    green_wave = TrafficGreenWave(base_speed=50)
    
    # 测试案例1：正常情况
    intersections = [0, 800, 1500, 2300, 3200, 4100]
    result = green_wave.generate_speed_advice(
        intersections=intersections,
        current_speed=45
    )
    
    print("测试案例1 - 正常情况:")
    print(f"当前速度: {result['data']['current_speed']} km/h")
    print(f"推荐速度: {result['data']['recommended_speed']} km/h")
    print(f"当前时间: {result['data']['time_analysis']['current_time_minutes']} 分钟")
    print(f"优化时间: {result['data']['time_analysis']['optimized_time_minutes']} 分钟")
    print(f"节省时间: {result['data']['time_analysis']['time_saving_minutes']} 分钟")
    print(f"建议: {result['data']['advice']}")
    print()
    
    # 测试案例2：密集交叉口
    dense_intersections = [0, 500, 900, 1400, 1900, 2400]
    result2 = TrafficGreenWave(base_speed=50).generate_speed_advice(
        dense_intersections, 
        current_speed=55
    )
    
    print("测试案例2 - 密集交叉口:")
    print(f"当前速度: {result2['data']['current_speed']} km/h")
    print(f"推荐速度: {result2['data']['recommended_speed']} km/h")
    print(f"当前时间: {result2['data']['time_analysis']['current_time_minutes']} 分钟")
    print(f"优化时间: {result2['data']['time_analysis']['optimized_time_minutes']} 分钟")
    print(f"节省时间: {result2['data']['time_analysis']['time_saving_minutes']} 分钟")
    print(f"建议: {result2['data']['advice']}")
