

# 其他代码

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
from threading import Timer
import os
import sys
from werkzeug.utils import secure_filename

# pandas依赖已完全移除以解决打包问题
import os
import sys
from werkzeug.utils import secure_filename
import utils
import utils.genetic_algorithm
import utils.kmeans_clustering
# import utils.data_analysis  # 暂时注释掉使用pandas的版本
import utils.data_analysis_simple as data_analysis
# 处理停车方案算法
import utils.stopCar as stopCar
import utils.greenspeed as greenspeed
# 登录部分
from flask import Flask, render_template, request, redirect, url_for, session
from datetime import datetime
import time

# 自动打开浏览器并搜索url模块
import webbrowser
import time

# 将用户信息存储到文件中
import csv


def get_resource_path(relative_path):
    """获取资源的绝对路径，兼容开发环境和打包后的EXE"""
    if hasattr(sys, '_MEIPASS'):
        # 打包后的路径
        return os.path.join(sys._MEIPASS, relative_path)
    # 开发环境的路径
    return os.path.join(os.path.abspath("."), relative_path)

# 修改Flask应用初始化部分
app = Flask(__name__, 
           template_folder=get_resource_path('templates'),
           static_folder=get_resource_path('static'))

# 添加密钥 - 这是解决问题的关键
app.secret_key = 'awdsasdaceop'  

# 修改上传文件夹路径
app.config['UPLOAD_FOLDER'] = get_resource_path('data')

# 确保数据目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 修改数据文件路径
DATA_DIR = get_resource_path('data')
TRAFFIC_FLOW_FILE = os.path.join(DATA_DIR, 'real_traffic_flow.csv')
INTERSECTIONS_FILE = os.path.join(DATA_DIR, 'real_intersections.json')
USERS_CSV = os.path.join(DATA_DIR, 'user.csv')


def get_next_user_id():
    """获取下一个可用的用户ID"""
    if not os.path.exists(USERS_CSV):
        return 1
    
    with open(USERS_CSV, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        max_id = 0
        for row in csv_reader:
            try:
                user_id = int(row['id'])
                if user_id > max_id:
                    max_id = user_id
            except ValueError:
                continue
        return max_id + 1


def write_user(username, password):
    """写入新用户数据"""
    file_exists = os.path.exists(USERS_CSV)
    next_id = get_next_user_id()
    
    with open(USERS_CSV, 'a', encoding='utf-8', newline='') as file:
        fieldnames = ['id', 'username', 'password']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        # 如果文件不存在，写入表头
        if not file_exists:
            writer.writeheader()
        
        # 写入新用户数据
        writer.writerow({
            'id': next_id,
            'username': username,
            'password': password
        })
    
    return next_id
# 读取用户CSV文件并转换为字典
def read_users_to_dict():
    users = {}
    
    # 检查文件是否存在
    if not os.path.exists(USERS_CSV):
        return users
    
    try:
        with open(USERS_CSV, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                user_id = row['id']
                users[user_id] = {
                    'username': row['username'],
                    'password': row['password']
                }
                
        return users
        
    except Exception as e:
        print(f"读取用户文件时出错: {str(e)}")
        return {}


def verify_login(username, password):
    """验证用户登录"""
    if not os.path.exists(USERS_CSV):
        print("用户文件不存在")
        return False
    
    with open(USERS_CSV, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # print("文件里的：",row['username'],row['password'])
            if (row['username'] == username and row['password'] == password):
                return True
    return False

def username_exists(username):
    """检查用户名是否已存在"""
    if not os.path.exists(USERS_CSV):
        return False
    
    with open(USERS_CSV, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            if row['username'] == username:
                return True
    return False

@app.route('/')
def home():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/register', methods=['POST','GET'])
def register():
    """处理注册表单"""
    try:
        # 获取表单数据
        form_type = request.form.get('form_type')
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        # 验证表单类型
        if form_type != 'register':
            return jsonify({
                'success': False,
                'message': '无效的请求类型'
            }), 400
        
        # 数据验证
        if not username or not password:
            return jsonify({
                'success': False,
                'message': '用户名和密码不能为空'
            }), 400
        
        if len(username) < 3:
            return jsonify({
                'success': False,
                'message': '用户名长度至少3位'
            }), 400
        
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': '密码长度至少6位'
            }), 400
        
        # 检查用户名是否存在
        if username_exists(username):
            return jsonify({
                'success': False,
                'message': '用户名已存在'
            }), 400
        
        # 注册新用户
        user_id = write_user(username, password)
        
        return jsonify({
            'success': True,
            'message': f'注册成功！您的用户ID是：{user_id}',
            'user_id': user_id
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'注册失败: {str(e)}'
        }), 500
    

@app.route('/login', methods=['POST','GET'])
def login():
    """处理登录表单"""
    try:
        # 获取表单数据
        form_type = request.form.get('form_type')
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        print("传入的表单类型和用户名密码：",username,password)
        
        # 验证登录
        if verify_login(username, password):
            #  重要：设置 session
            session['username'] = username
            session['name'] = username  # 可以设置其他session信息
            
            print(f"✅ 登录成功，设置session: {dict(session)}")
            
            # 登录成功，重定向到仪表板
            return jsonify({
                'success': True,
                'message': '登录成功',
                'redirect': '/dashboard'
            })
        
        else:
             # 统一返回JSON响应
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
            
    except Exception as e:
        print(f"登录异常: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'登录失败: {str(e)}'
        }), 500

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        print("未登录")
        return redirect(url_for('login'))
    
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return render_template('dashboard.html', 
                          name=session['username'],
                          current_time=current_time)

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('name', None)
    return redirect('/')

# ===========================================================================
def is_file_locked(filepath):
        if not os.path.exists(filepath):
            return False
        try:
            with open(filepath, 'a') as f:
                pass
            return False
        except IOError:
            return True

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # 确保文件名安全且类型正确
        filename = secure_filename(file.filename)
        if not (filename.endswith('.csv') or filename.endswith('.json')):
            return jsonify({'error': 'Invalid file type'}), 400

        # 确定最终路径
        final_path = os.path.join(app.config['UPLOAD_FOLDER'], 
                                 'real_traffic_flow.csv' if filename.endswith('.csv') 
                                 else 'real_intersections.json')

        # 检查并删除已存在的文件
        try:
            if os.path.exists(final_path):
                os.remove(final_path)
        except Exception as e:
            return jsonify({'error': f'无法删除旧文件: {str(e)}'}), 500

        # 直接保存文件
        try:
            file.save(final_path)
            return jsonify({'success': True, 'filename': filename})
        except Exception as e:
            return jsonify({'error': f'文件保存失败: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# 计算拥堵指数
def simple_congestion_index(current_flow, base_flow=500):
    """
    极简拥堵指数计算函数
    current_flow: 当前车流量
    base_flow: 基准畅通车流量，默认500
    返回: 拥堵指数(0-10)
    """
    ratio = current_flow / base_flow
    
    if ratio <= 1.0:
        return max(0, min(2, ratio * 2))  # 0-2分
    elif ratio <= 1.5:
        return 2 + (ratio - 1.0) * 4     # 2-4分
    elif ratio <= 2.0:
        return 4 + (ratio - 1.5) * 4     # 4-6分
    elif ratio <= 3.0:
        return 6 + (ratio - 2.0) * 2     # 6-8分
    else:
        return min(10, 8 + (ratio - 3.0) * 0.5)  # 8-10分，增长放缓
def load_real_traffic_data():
    """加载真实交通数据"""
    retry_count = 3
    for i in range(retry_count):
        try:
            # 检查文件是否存在
            if not os.path.exists(TRAFFIC_FLOW_FILE) or not os.path.exists(INTERSECTIONS_FILE):
                raise FileNotFoundError("交通数据文件不存在，请先上传数据")
            
            # 1. 加载每小时交通流量数据
            hourly_traffic = []
            
            # 使用标准库读取CSV文件
            with open(TRAFFIC_FLOW_FILE, 'r', encoding='utf-8') as f:
                # 跳过标题行
                next(f)  # 跳过header
                for line in f:
                    # 解析CSV行
                    parts = line.strip().split(',')
                    if len(parts) >= 2:
                        hour = int(parts[0])
                        flow = int(parts[1])
                        hourly_traffic.append({
                            "hour": hour,
                            "flow": flow,
                            "congestion": simple_congestion_index(flow)
                        })
            
            # 2. 加载路口信息数据
            with open(INTERSECTIONS_FILE, 'r', encoding='utf-8') as f:
                real_intersections = json.load(f)
            
            # 处理路口数据
            intersections = []
            for i, intersection in enumerate(real_intersections):
                intersections.append({
                    "id": intersection.get('id', i+1),
                    "name": intersection.get('name', f"路口{i+1}"),
                    "traffic_volume": intersection['traffic_volume'],
                    "signal_cycle": intersection['signal_cycle'],
                    "peak_hours": intersection.get('peak_hours', [7, 8, 17, 18]),
                    "green_time": intersection.get('green_time', int(intersection['signal_cycle'] * 0.6)),
                    "yellow_time": intersection.get('yellow_time', 5),
                    "red_time": intersection.get('red_time', int(intersection['signal_cycle'] * 0.4) - 5)
                })
            
            data= {
                "hourly_traffic": hourly_traffic,
                "intersections": intersections
            }
            return data
        except (ValueError, json.JSONDecodeError, StopIteration) as e:
            if i == retry_count - 1:
                raise
            time.sleep(0.5 * (i + 1))  # 指数退避
        except PermissionError:
            if i == retry_count - 1:
                raise PermissionError("文件被占用，请稍后再试")
            time.sleep(0.5 * (i + 1))
@app.route('/map.png')
def serve_map():
    return send_from_directory(os.path.dirname(__file__), 'map.png')

@app.route('/get_traffic_data')
def get_traffic_data():
    try:
        # 数据是一个字典（json格式）
        return load_real_traffic_data()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"加载数据时出错: {str(e)}"}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    analysis_results = utils.data_analysis.analyze_traffic_data(data)
    return jsonify(analysis_results)

@app.route('/cluster', methods=['POST'])
def cluster():
    try:
        data = request.get_json()
        if not data or 'intersections' not in data:
            return jsonify({"error": "Invalid data format"}), 400
            
        k = int(request.args.get('k', 3))  # 默认3个聚类
        clustered_data = utils.kmeans_clustering.perform_kmeans(data, k)
        return jsonify(clustered_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.json
        
        # 为原始数据添加默认相位时间（如果不存在）
        for intersection in data['intersections']:
            if 'green_time' not in intersection:
                intersection['green_time'] = int(intersection['signal_cycle'] * 0.6)
            if 'yellow_time' not in intersection:
                intersection['yellow_time'] = 5
            if 'red_time' not in intersection:
                intersection['red_time'] = intersection['signal_cycle'] - intersection['green_time'] - intersection['yellow_time']
        
        optimized_params = utils.genetic_algorithm.optimize_traffic_lights(data)
        return jsonify(optimized_params)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/dashboard/getFenXi', methods=['GET', 'POST'])
def getFenXi():
    return render_template('getFenXi.html')
@app.route('/getData', methods=['GET', 'POST'])
def getData():
    return load_real_traffic_data()
# 计算最优滤波速度路由
@app.route('/getGreenSpeed', methods=['GET', 'POST'])
def getGreenSpeed():
    green_wave = greenspeed.TrafficGreenWave(base_speed=50)
    
    # 示例：一条主干道上的交叉口位置（距离起点距离，单位：米）
    intersections = [0, 800, 1500, 2300, 3200, 4100]  # 5个路段
    
    # 生成建议
    result = green_wave.generate_speed_advice(
        intersections=intersections,
        current_speed=45  # 当前速度
    )
    # 输出JSON格式结果
    return json.dumps(result, ensure_ascii=False, indent=2)
@app.route('/getstopCar')
def getstopCar():
    top_three=stopCar.top_three
     # 输出结果
    print("剩余车位前三的停车场：")
    for i, (location, (total, available)) in enumerate(top_three, 1):
        distance = stopCar.distance_dict[location]
        print(f"第{i}名: {location}")
        print(f"  剩余车位: {available}/{total}")
        print(f"  距离: {distance}米")
    result={
        "top_three":top_three,
        "distance_dict":stopCar.distance_dict
    }
     # 输出JSON格式结果
    return json.dumps(result, ensure_ascii=False, indent=2)

# ai界面
@app.route("/aiTemplate")
def aiTemplate():
    return render_template('ollama_chat.html')
    
@app.route("/note")
def note():
    return render_template('note.html')

@app.route('/export_data', methods=['POST'])
def export_data():
    """导出交通数据分析结果到TXT文件"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "没有可导出的数据"}), 400
        
        # 生成TXT文件内容
        txt_content = generate_export_content(data)
        
        # 返回文件内容作为响应
        from flask import make_response
        filename = f"traffic_analysis_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        response = make_response(txt_content)
        response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'
        
        return response
        
    except Exception as e:
        return jsonify({"error": f"导出失败: {str(e)}"}), 500

def generate_export_content(data):
    """生成导出内容"""
    content = []
    content.append("=" * 60)
    content.append("交通流量管理平台数据分析报告")
    content.append("=" * 60)
    content.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    content.append("")
    
    # 交通数据分析部分
    if 'traffic_analysis' in data and data['traffic_analysis'] is not None:
        analysis_data = data['traffic_analysis']
        content.append("1. 交通数据分析结果")
        content.append("-" * 40)
        content.append(f"总流量: {analysis_data.get('total_flow', 0)} 辆")
        content.append(f"平均拥堵指数: {analysis_data.get('avg_congestion', 0)}")
        content.append(f"由北向南: {analysis_data.get('north_to_south', 0)} 辆")
        content.append(f"由南向北: {analysis_data.get('south_to_north', 0)} 辆")
        content.append(f"由东向西: {analysis_data.get('east_to_west', 0)} 辆")
        content.append(f"由西向东: {analysis_data.get('west_to_east', 0)} 辆")
        content.append("")
    else:
        content.append("1. 交通数据分析结果")
        content.append("-" * 40)
        content.append("暂无数据")
        content.append("")
    
    # 路口聚类分析部分
    if 'cluster_analysis' in data and data['cluster_analysis'] is not None:
        cluster_data = data['cluster_analysis']
        content.append("2. 路口聚类分析结果")
        content.append("-" * 40)
        content.append(f"聚类数量: {cluster_data.get('cluster_count', 0)}")
        
        clusters = cluster_data.get('clusters', {})
        for cluster_id, intersections in clusters.items():
            content.append(f"聚类 {int(cluster_id)+1}:")
            content.append(f"  路口: {', '.join(intersections)}")
        
        cluster_centers = cluster_data.get('cluster_centers', {})
        if cluster_centers:
            content.append("聚类中心特征:")
            for center_id, center_data in cluster_centers.items():
                content.append(f"  聚类 {int(center_id)+1}: {center_data}")
        content.append("")
    else:
        content.append("2. 路口聚类分析结果")
        content.append("-" * 40)
        content.append("暂无数据")
        content.append("")
    
    # 信号灯优化部分
    if 'optimization_analysis' in data and data['optimization_analysis'] is not None:
        opt_data = data['optimization_analysis']
        content.append("3. 信号灯优化结果")
        content.append("-" * 40)
        content.append(f"预计等待时间减少: {opt_data.get('estimated_wait_time_reduction', 0):.2f}%")
        
        intersections = opt_data.get('optimized_intersections', [])
        for intersection in intersections:
            content.append(f"路口: {intersection.get('name', '未知')}")
            phases = intersection.get('phases', {})
            original = phases.get('original', {})
            optimized = phases.get('optimized', {})
            
            content.append("  原配置:")
            content.append(f"    绿灯: {original.get('green', 0)}s")
            content.append(f"    黄灯: {original.get('yellow', 0)}s")
            content.append(f"    红灯: {original.get('red', 0)}s")
            
            content.append("  优化配置:")
            content.append(f"    绿灯: {optimized.get('green', 0)}s")
            content.append(f"    黄灯: {optimized.get('yellow', 0)}s")
            content.append(f"    红灯: {optimized.get('red', 0)}s")
            
            change = intersection.get('change', 0)
            content.append(f"  总周期变化: {'+' if change > 0 else ''}{change}s")
            content.append("")
    
    content.append("=" * 60)
    content.append("报告结束")
    content.append("=" * 60)
    
    return ''.join(content)

if __name__ == '__main__':
    import threading
    import time
    
    # 浏览器连接状态监控
    browser_closed = False
    last_activity_time = time.time()
    
    def monitor_browser_activity():
        """监控浏览器活动，如果长时间没有活动则退出服务器"""
        global browser_closed, last_activity_time
        while not browser_closed:
            # 如果超过30秒没有活动，认为浏览器已关闭
            if time.time() - last_activity_time > 1000:
                browser_closed = True
                print("检测到用户无操作，服务器将在5秒后退出...")
                time.sleep(5)
                os._exit(0)  # 强制退出
            time.sleep(5)  # 每5秒检查一次
    
    # 启动浏览器活动监控线程
    monitor_thread = threading.Thread(target=monitor_browser_activity, daemon=True)
    monitor_thread.start()
    
    # 记录活动时间的路由装饰器
    def record_activity():
        global last_activity_time
        last_activity_time = time.time()
    
    # 为所有路由添加活动记录
    @app.before_request
    def before_request():
        record_activity()
    
    # 延迟打开浏览器
    Timer(1, lambda: webbrowser.open(f'http://127.0.0.1:{5001}')).start()
    
    try:
        # 直接运行Flask应用
        app.run(debug=False, host='127.0.0.1', port=5001, use_reloader=False)
    except KeyboardInterrupt:
        print("服务器被用户中断")
    except Exception as e:
        print(f"服务器异常: {e}")
