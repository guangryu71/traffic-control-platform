// 163行折线已隐藏
// 在全局范围添加标记存储变量
let markers = [];
// 在全局范围声明图表变量

let clusterChart = null;
let optimizationChartGreen = null;
let optimizationChartRed = null;
let trafficData = {}; // 将trafficData提升为全局变量
let trafficChart = null;

document.addEventListener('DOMContentLoaded', function() {

    // 初始化应用
    function initApplication() {
        loadTrafficData();
        initMapInteraction();
    }


function closeEditor() {
    // 关闭编辑器的逻辑
    console.log("编辑器已关闭");
}

/**
 * 计算单个路段的拥堵指数
 * @param {number} actualSpeed - 实际平均速度 (km/h)
 * @param {number} freeFlowSpeed - 自由流速度 (km/h)
 * @returns {number} 拥堵指数
 */
function calculateSingleCongestionIndex(actualSpeed, freeFlowSpeed) {
  // 参数校验
  if (typeof actualSpeed !== 'number' || typeof freeFlowSpeed !== 'number') {
    throw new Error('速度和自由流速度必须是数字');
  }
  if (freeFlowSpeed <= 0) {
    throw new Error('自由流速度必须大于0');
  }
  if (actualSpeed <= 0) {
    // 如果实际速度接近0，说明极度拥堵，返回一个非常大的指数或特定值（如999）
    return 999; 
  }

  // 核心公式：拥堵指数 = (自由流时间 / 实际时间) * 100
  // 因为 时间 = 距离 / 速度， 所以 (自由流时间 / 实际时间) = (距离/自由流速度) / (距离/实际速度) = 实际速度 / 自由流速度
  // 因此，指数可以简化为：(实际速度 / 自由流速度) * 100
  const index = (actualSpeed / freeFlowSpeed) * 100;

  // 通常我们会限制指数的范围，使其更具可读性，例如最大为500
  return Math.min(Math.round(index), 500);
}
/**
 * 计算多个路段的平均拥堵指数
 * @param {Array} roadSegments - 路段数据数组
 * @param {number} roadSegments[].actualSpeed - 该路段的实际速度
 * @param {number} roadSegments[].freeFlowSpeed - 该路段的自由流速度
 * @returns {number} 平均拥堵指数，保留2位小数
 */
function calculateAverageCongestionIndex(roadSegments) {
  // 参数校验
  if (!Array.isArray(roadSegments) || roadSegments.length === 0) {
    throw new Error('参数必须是一个非空的路段数据数组');
  }

  let totalIndex = 0;
  let validSegmentCount = 0;

  for (const segment of roadSegments) {
    // 检查每个路段对象是否包含必要的属性
    if (
      segment &&
      typeof segment.actualSpeed === 'number' &&
      typeof segment.freeFlowSpeed === 'number' &&
      segment.freeFlowSpeed > 0
    ) {
      try {
        const index = calculateSingleCongestionIndex(segment.actualSpeed, segment.freeFlowSpeed);
        // 如果返回了有效的指数（不是代表异常值的999），则加入计算
        if (index !== 999) {
          totalIndex += index;
          validSegmentCount++;
        }
      } catch (error) {
        // 忽略计算错误的路段，继续处理下一个
        console.warn(`跳过无效路段数据:`, segment, `错误:`, error.message);
      }
    } else {
      console.warn(`跳过格式错误的路段数据:`, segment);
    }
  }

  if (validSegmentCount === 0) {
    throw new Error('没有有效的路段数据可用于计算平均拥堵指数');
  }

  // 计算平均值并保留2位小数
  const averageIndex = totalIndex / validSegmentCount;
  return Number(averageIndex.toFixed(2));
}

// 单独的分析函数
async function performAnalysis() {
    try {
        console.log("开始执行分析");
        // if (!trafficData || trafficData.intersections.length === 0) {
        //     throw new Error("没有可分析的数据，请先上传文件");
        // }

        // // 显示加载状态
        // document.getElementById('analysisResults').innerHTML = 
        //     '<div class="alert alert-info">分析中...</div>';

        // 执行分析请求
        // 发送 GET 请求
        fetch('/getData')
        .then(response => {
            if (!response.ok) throw new Error("请求失败");
            return response.json();  // 解析 JSON 响应
        })
        .then(data => {
            console.log("接收到的数据:", data);
            let trafficDataSum = 0;
            try{
                console.log("shuzu:"+data.hourly_traffic.length);
                console.log("初始值"+trafficDataSum);
                
                // 求总流量
            for(let i = 0; i < data.hourly_traffic.length; i++){
                console.log(trafficDataSum);
                trafficDataSum=trafficDataSum+data.hourly_traffic[i].flow;
            }
            }catch(error){
                console.log("计算总流量出现错误："+error);
            }
            // 求平均拥堵指数
            const roadNetworkData = [
              { actualSpeed: 20, freeFlowSpeed: 60 }, // 路段1：非常拥堵
              { actualSpeed: 55, freeFlowSpeed: 60 }, // 路段2：轻微拥堵
              { actualSpeed: 5, freeFlowSpeed: 50 },  // 路段3：极度拥堵，可能被过滤（如果函数处理了0速度）
              { actualSpeed: 65, freeFlowSpeed: 60 }, // 路段4：畅通
              { invalidData: 'xxx' }                  // 路段5：无效数据，会被跳过
            ];
            const avgCongestionIndex = calculateAverageCongestionIndex(roadNetworkData);
            console.log("总流量为"+trafficDataSum)
            console.log("平均拥堵指数(基准为100,越大越拥堵):"+avgCongestionIndex);
            // 更新页面
            // 更新分析结果显示（左侧文字部分）
            document.getElementById('totalFlow').textContent = `总流量: ${trafficDataSum} 辆`;
            document.getElementById('avgCongestion').textContent = `平均拥堵指数: ${avgCongestionIndex}`;
            
            // 绘制环形图与折线图
            drawDoughnutCharts(data, trafficDataSum);
            testPolylineGenerator();
        console.log("折线图已加载");
        })
        .catch(error => {
            console.error("请求错误:", error);
        });        

    } catch (error) {
        console.error("分析错误:", error);
        document.getElementById('analysisResults').innerHTML = 
            `<div class="alert alert-danger">${error.message}</div>`;
    }
}
    // 绘制折线函数
    function testPolylineGenerator() 
        {
           // 核心折线生成器
        class PolylineGenerator {
            constructor(svgId) {
                this.svg = document.getElementById(svgId);
            }
            
            // 添加一条折线
            addLine(points, color = '#3498db', width = 2) {
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
                
                polyline.setAttribute('points', pointsString);
                polyline.setAttribute('fill', 'none');
                polyline.setAttribute('stroke', color);
                polyline.setAttribute('stroke-width', width);
                polyline.setAttribute('stroke-linejoin', 'round');
                
                this.svg.appendChild(polyline);
                return polyline;
            }
            
            // 清空所有折线
            clear() {
                this.svg.innerHTML = '';
            }
        } 
            // 使用示例
        const generator = new PolylineGenerator('multiLineSvg');
        
        // 第一条折线
        generator.addLine([
            { x: 50, y: 350 }, { x: 550, y: 100 }
        ], '#e74c3c', 3);
        
        // 第二条折线
        generator.addLine([
            { x: 50, y: 100 }, { x: 550, y: 350 }
        ], '#3498db', 2);
        
        // 第三条折线
        generator.addLine([
            { x: 450, y: 300 }, { x: 550, y: 200 }
        ], '#27ae60', 2);}

// 绘制环形图函数
function drawDoughnutCharts(data, totalFlow) {
    // 使用传入的 data 直接计算
    const hourly = Array.isArray(data?.hourly_traffic) ? data.hourly_traffic : [];
    if (hourly.length === 0) {
        console.warn('无可用小时流量数据，跳过环形图绘制');
        return;
    }

    // 如果没有总流量数据，从hourly数据计算
    if (!totalFlow || totalFlow === 0) {
        totalFlow = 0;
        for (let i = 0; i < hourly.length; i++) {
            const flow = typeof hourly[i]?.flow === 'number' ? hourly[i].flow : parseInt(hourly[i]?.flow || 0, 10);
            totalFlow += flow;
        }
    }

    // 计算四个方向的车流量（如果数据中没有方向信息，按比例分配）
    // 这里采用简单的分配策略：根据时段和随机性分配
    let northToSouth = 0;
    let southToNorth = 0;
    let eastToWest = 0;
    let westToEast = 0;

    // 根据小时流量数据按比例分配（这里采用简单的分配策略）
    // 可以改进：如果有实际的方向数据，直接使用
    for (let i = 0; i < hourly.length; i++) {
        const flow = typeof hourly[i]?.flow === 'number' ? hourly[i].flow : parseInt(hourly[i]?.flow || 0, 10);
        const hour = hourly[i]?.hour || 0;
        // 简单的分配策略：早高峰主要是进城方向，晚高峰主要是出城方向
        if (hour >= 7 && hour <= 9) {
            // 早高峰：进城为主（假设南向北、西向东较多）
            southToNorth += Math.floor(flow * 0.35);
            northToSouth += Math.floor(flow * 0.15);
            westToEast += Math.floor(flow * 0.35);
            eastToWest += Math.floor(flow * 0.15);
        } else if (hour >= 17 && hour <= 19) {
            // 晚高峰：出城为主（假设北向南、东向西较多）
            northToSouth += Math.floor(flow * 0.35);
            southToNorth += Math.floor(flow * 0.15);
            eastToWest += Math.floor(flow * 0.35);
            westToEast += Math.floor(flow * 0.15);
        } else {
            // 平峰时段：相对均匀分配
            northToSouth += Math.floor(flow * 0.25);
            southToNorth += Math.floor(flow * 0.25);
            eastToWest += Math.floor(flow * 0.25);
            westToEast += Math.floor(flow * 0.25);
        }
    }

    // 确保总和等于总流量（处理舍入误差）
    const currentSum = northToSouth + southToNorth + eastToWest + westToEast;
    if (currentSum < totalFlow) {
        const diff = totalFlow - currentSum;
        // 将差值分配给最大的方向
        const maxDir = Math.max(northToSouth, southToNorth, eastToWest, westToEast);
        if (maxDir === northToSouth) northToSouth += diff;
        else if (maxDir === southToNorth) southToNorth += diff;
        else if (maxDir === eastToWest) eastToWest += diff;
        else westToEast += diff;
    }

    // 更新左侧文字显示
    document.getElementById('northToSouth').textContent = `由北向南: ${northToSouth} 辆`;
    document.getElementById('southToNorth').textContent = `由南向北: ${southToNorth} 辆`;
    document.getElementById('eastToWest').textContent = `由东向西: ${eastToWest} 辆`;
    document.getElementById('westToEast').textContent = `由西向东: ${westToEast} 辆`;

    // 创建环形图容器
    const container = document.getElementById('doughnutChartsContainer');
    container.innerHTML = ''; // 清空现有内容

    const directions = [
        { id: 'northSouth', name: '由北向南', value: northToSouth, colors: ['#2af598', '#009efd'] },
        { id: 'southNorth', name: '由南向北', value: southToNorth, colors: ['#fa709a', '#fee140'] },
        { id: 'eastWest', name: '由东向西', value: eastToWest, colors: ['#30cfd0', '#330867'] },
        { id: 'westEast', name: '由西向东', value: westToEast, colors: ['#e5e0dd', '#f5576c'] }
    ];

    directions.forEach((dir, index) => {
        // 创建容器
        const chartContainer = document.createElement('div');
        chartContainer.className = 'doughnut-chart-item';
        chartContainer.style.position = 'relative';
        chartContainer.style.display = 'flex';
        chartContainer.style.flexDirection = 'column';
        chartContainer.style.alignItems = 'center';



        // 创建canvas容器（用于定位百分比）
        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.position = 'relative';
        canvasWrapper.style.display = 'inline-block';
        canvasWrapper.style.width = '150px';



        // 创建canvas
        const canvas = document.createElement('canvas');
        canvas.id = `doughnutChart${index}`;
        canvas.width = 200;
        canvas.height = 200;

        // 创建百分比显示元素
        const percentageDiv = document.createElement('div');
        percentageDiv.id = `percentage${index}`;
        percentageDiv.style.position = 'absolute';
        percentageDiv.style.top = '50%';
        percentageDiv.style.left = '50%';
        percentageDiv.style.transform = 'translate(-50%, -50%)';
        percentageDiv.style.textAlign = 'center';
        percentageDiv.style.pointerEvents = 'none';
        percentageDiv.style.zIndex = '10';
        percentageDiv.style.width = '100%';

        // 创建标签元素
        const labelP = document.createElement('p');
        labelP.textContent = dir.name;
        labelP.style.marginTop = '0px';
        labelP.style.color = '#333';
        labelP.style.fontSize = '14px';
        labelP.style.position = 'relative';
        labelP.style.bottom = '60px';


        canvasWrapper.appendChild(canvas);
        canvasWrapper.appendChild(percentageDiv);
        chartContainer.appendChild(canvasWrapper);
        chartContainer.appendChild(labelP);
        container.appendChild(chartContainer);

        // 计算百分比（占总流量的百分比）
        const percentage = totalFlow > 0 ? ((dir.value / totalFlow) * 100).toFixed(1) : '0.0';
        percentageDiv.innerHTML = `<div style="font-size: 24px; font-weight: bold; color: #009efd;">${percentage}%</div>`;

        // 绘制环形图
        const ctx = canvas.getContext('2d');
        const otherValue = Math.max(totalFlow - dir.value, 0);
        const chartData = [dir.value, otherValue];

        // 创建渐变效果
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, dir.colors[0]);
        gradient.addColorStop(1, dir.colors[1]);
        
        const gradient1 = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient1.addColorStop(0, '#e0e0e0');
        gradient1.addColorStop(1, '#f5f5f5');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [dir.name, '其他'],
                datasets: [{
                    data: chartData,
                    backgroundColor: [gradient, gradient1],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.chart.data.labels[context.dataIndex] || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} 辆 (${percent}%)`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: true
            }
        });
    });
}



async function uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-File-Type': file.name.endsWith('.csv') ? 'csv' : 'json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `上传失败: ${file.name}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`上传错误 (${file.name}):`, error);
        throw error;
    }
}
// 修改上传顺序为串行执行
async function uploadFilesSequentially(files) {
    const results = [];
    for (const file of files) {
        try {
            const result = await uploadSingleFile(file);
            results.push(result);
            // 增加延迟时间到1秒
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            throw error;
        }
    }
    return results;
}



    // 修改数据加载函数
function loadTrafficData() {
    fetch('/get_traffic_data')
        .then(response => {
            if (!response.ok) throw new Error('数据加载失败T^T');
            return response.json();
        })
        .then(data => {
            trafficData = data; // 确保全局变量被更新
            console.log("数据加载完成:", trafficData); // 调试用
            return trafficData; // 更新图表
        })
        .catch(error => {
            console.error('数据加载错误:', error);
            showErrorAlert('数据加载失败: ' + error.message);
        });
}

// 显示错误提示
function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger position-fixed top-0 start-0 m-3';
    alertDiv.style.zIndex = '1000';
    alertDiv.innerHTML = `
        <strong>错误：</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 5秒后自动消失
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

    // 更新交通流量图表
// 更新交通流量图表
function updateTrafficChart() {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // 检查数据是否存在
    if (!trafficData || !trafficData.hourly_traffic || trafficData.hourly_traffic.length === 0) {
        console.warn('没有交通数据可用于更新图表');
        return;
    }
    
    const labels = trafficData.hourly_traffic.map(item => `${item.hour}:00`);
    const data = trafficData.hourly_traffic.map(item => item.flow);
    const congestion = trafficData.hourly_traffic.map(item => item.congestion);
    
    // 计算Y轴的最大值，确保比例一致
    const maxFlow = Math.max(...data);
    const maxCongestion = Math.max(...congestion);
    
    // 设置Y轴范围，留出一些边距
    const yMax = Math.ceil(maxFlow * 1.1); // 流量轴最大值
    const y1Max = Math.min(Math.ceil(maxCongestion * 1.2), 15); // 拥堵指数轴最大值，不超过15
    
    // 创建拥堵指数渐变样式（固定值）
    const gradient = ctx.createLinearGradient(0, 0, 100, 0);
    gradient.addColorStop(0, '#4CAF50'); // 绿色
    gradient.addColorStop(0.5, '#FFC107'); // 黄色
    gradient.addColorStop(1, '#F44336'); // 红色
    
    // 交通流量渐变样式（固定值）
    const gradient1 = ctx.createLinearGradient(0, 0, 100, 0);
    gradient1.addColorStop(0, '#4facfe'); // 绿色
    gradient1.addColorStop(0.5, '#00f2fe'); // 黄色
    gradient1.addColorStop(1, '#034afcff'); // 红色

    // 如果图表已存在，更新数据而不是重新创建
    if (trafficChart) {
        trafficChart.data.labels = labels;
        trafficChart.data.datasets[0].data = data;
        trafficChart.data.datasets[1].data = congestion;
        
        // 更新Y轴范围
        trafficChart.options.scales.y.max = yMax;
        trafficChart.options.scales.y1.max = y1Max;
        
        trafficChart.update();
    } else {
        // 首次创建图表
        trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '交通流量 (辆/小时)',
                        data: data,
                        borderColor: gradient1,
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: '拥堵指数 (1-15)',
                        data: congestion,
                        borderColor: gradient,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: yMax,
                        title: {
                            display: true,
                            text: '交通流量 (辆/小时)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: y1Max,
                        title: {
                            display: true,
                            text: '拥堵指数'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
}


    // 执行分析
    document.getElementById('analyzeBtn').addEventListener('click', async function(){
    console.log("分析按钮被点击"); // 调试用

    const fileInput = document.getElementById('dataPackage');
    const files = Array.from(fileInput.files);
    const statusDiv = document.getElementById('uploadStatus');
    
    statusDiv.innerHTML = '<div class="alert alert-info">分析处理中...</div>';
    
    try{
        // 加载数据
        await new Promise(resolve => setTimeout(resolve, 500)); // 确保文件完全写入
        await loadTrafficData();
        performAnalysis(); 
        // 只更新图表
        updateTrafficChart();
        statusDiv.innerHTML = '<div class="alert alert-success">分析完成！</div>';
    }catch(error){
        try {

        // 验证文件
        if (files.length !== 2) {
            throw new Error('请同时选择CSV和JSON两个文件');
        }

        const hasCSV = files.some(f => f.name.endsWith('.csv'));
        const hasJSON = files.some(f => f.name.endsWith('.json'));
        
        if (!hasCSV || !hasJSON) {
            throw new Error('必须包含一个CSV文件和一个JSON文件');
        }

        // 先上传CSV再上传JSON
        const orderedFiles = [
            files.find(f => f.name.endsWith('.csv')),
            files.find(f => f.name.endsWith('.json'))
        ];
        await uploadFilesSequentially(orderedFiles);
        
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger">T^T ${error.message}</div>`;
    }
    }
    
});
    


// 修改聚类分析部分
document.getElementById('clusterBtn').addEventListener('click', function() {
    // 验证数据是否已加载
    if (!trafficData || !trafficData.intersections || trafficData.intersections.length === 0) {
        showErrorAlert('请先导入数据文件并执行分析，再进行聚类分析');
        return;
    }
    
    const k = document.getElementById('clusterNum').value;
    
    fetch(`/cluster?k=${k}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trafficData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { 
                throw new Error(err.error || '聚类失败') 
            });
        }
        return response.json();
    })
    .then(data => {
        trafficData.intersections = data.clustered_intersections;
        
        const resultsDiv = document.getElementById('clusterResults');
        
        // 创建聚类分组展示
        let clusterGroupsHTML = '';
        for (const [clusterId, intersections] of Object.entries(data.clusters)) {
            clusterGroupsHTML += `
                <div class="cluster-group mb-3">
                    <h6 class="cluster-header">聚类 ${parseInt(clusterId)+1}</h6>
                    <div class="cluster-members">
                        ${intersections.map(name => `<span class="badge bg-primary me-2">${name}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        resultsDiv.innerHTML = `
            <div class="cluster-results">
                <h6>聚类分析结果</h6>
                <p>共分为 ${Object.keys(data.clusters).length} 个聚类组</p>
                <div class="cluster-groups mt-3">
                    ${clusterGroupsHTML}
                </div>
                <div class="cluster-stats mt-3">
                    <p><small>聚类中心特征: ${JSON.stringify(data.cluster_centers)}</small></p>
                </div>
            </div>
        `;
        
        updateClusterChart(data);
    })
    .catch(error => {
        console.error('聚类错误:', error);
        document.getElementById('clusterResults').innerHTML = `
            <div class="alert alert-danger">
                ${error.message || '聚类分析出错'}
            </div>
        `;
        // 清除图表
        if (clusterChart) {
            clusterChart.destroy();
            clusterChart = null;
        }
    });
});
    
    // 更新聚类图表
    // 更新聚类图表函数
function updateClusterChart(clusterData) {
    const ctx = document.getElementById('clusterChart').getContext('2d');
    
    // 销毁旧图表
    if (clusterChart) {
        clusterChart.destroy();
    }
    
    // 准备聚类数据
    const clusters = {};
    clusterData.clustered_intersections.forEach(item => {
        if (!clusters[item.cluster]) {
            clusters[item.cluster] = {
                traffic_volumes: [],
                signal_cycles: []
            };
        }
        clusters[item.cluster].traffic_volumes.push(item.traffic_volume);
        clusters[item.cluster].signal_cycles.push(item.signal_cycle);
    });
    
    // 计算每个聚类的平均值
    const clusterLabels = Object.keys(clusters).sort();
    const avgTraffic = clusterLabels.map(k => {
        const arr = clusters[k].traffic_volumes;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    const avgCycle = clusterLabels.map(k => {
        const arr = clusters[k].signal_cycles;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    
    // 创建新图表
    // 创建新图表
        clusterChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: clusterLabels.map(k => `聚类 ${parseInt(k)+1}`),
                datasets: [
                    {
                        label: '平均交通流量',
                        data: avgTraffic,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: '平均信号周期',
                        data: avgCycle,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '信号周期 (秒)',
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '交通流量 (辆/小时)',
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
}
    
    // 执行信号灯优化
document.getElementById('optimizeBtn').addEventListener('click', function() {
    // 验证数据是否已加载
    if (!trafficData || !trafficData.intersections || trafficData.intersections.length === 0) {
        showErrorAlert('请先导入数据文件并执行分析，再进行信号灯优化');
        return;
    }
    
    fetch('/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trafficData)
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('optimizationResults');
        
        // 生成优化详情表格
        let tableHTML = `
            <div class="alert alert-success">
                <strong>优化完成！</strong> 预计等待时间减少 ${data.estimated_wait_time_reduction.toFixed(2)}%
            </div>
            <table class="table table-sm table-hover">
                <thead class="table-light">
                    <tr>
                        <th rowspan="2">路口</th>
                        <th colspan="3" class="text-center">原配置</th>
                        <th colspan="3" class="text-center">优化配置</th>
                        <th rowspan="2">总周期变化</th>
                    </tr>
                    <tr>
                        <th>绿灯(s)</th><th>黄灯(s)</th><th>红灯(s)</th>
                        <th>绿灯(s)</th><th>黄灯(s)</th><th>红灯(s)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.optimized_intersections.forEach(item => {
            const original = item.phases.original;
            const optimized = item.phases.optimized;
            
            tableHTML += `
                <tr>
                    <td style="font-weight:600;">${item.name}</td>
                    <td>${original.green}</td>
                    <td>${original.yellow}</td>
                    <td>${original.red}</td>
                    <td class="${optimized.green > original.green ? 'text-danger' : 'text-success'}">
                        ${optimized.green} ${getChangeArrow(optimized.green, original.green)}
                    </td>
                    <td>${optimized.yellow}</td>
                    <td class="${optimized.red < original.red ? 'text-success' : 'text-danger'}">
                        ${optimized.red} ${getChangeArrow(optimized.red, original.red)}
                    </td>
                    <td class="${item.change > 0 ? 'text-warning' : 'text-success'}">
                        ${item.change > 0 ? '+' : ''}${item.change}s
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `</tbody></table>`;
        resultsDiv.innerHTML = tableHTML;
        
        updateOptimizationChart(data);
    });
});

    // 辅助函数：显示变化箭头
// 辅助函数：显示变化箭头
// 辅助函数：显示变化箭头
function getChangeArrow(newVal, oldVal) {
    if (newVal > oldVal) return '↑';
    if (newVal < oldVal) return '↓';
    return '→';
}

// 修改updateOptimizationChart函数中的combinedTableHTML部分
function updateOptimizationChart(optimizationData) {
    const resultsDiv = document.getElementById('optimizationResults');
    
    // 生成优化详情表格
    let tableHTML = `
        <div class="alert alert-success mb-2">
            <strong>优化完成！</strong> 预计等待时间减少 ${optimizationData.estimated_wait_time_reduction.toFixed(2)}%
        </div>
        <div class="table-responsive mb-2" style="font-size: 0.85rem;">
            <table class="table table-sm table-hover optimization-summary-table mb-2">
                <thead class="table-light">
                    <tr>
                        <th rowspan="2" style="width: 15%">路口</th>
                        <th colspan="3" class="text-center">原配置</th>
                        <th colspan="3" class="text-center">优化配置</th>
                        <th rowspan="2" style="width: 8%">总周期变化</th>
                    </tr>
                    <tr>
                        <th style="width: 8%">绿灯(s)</th>
                        <th style="width: 8%">黄灯(s)</th>
                        <th style="width: 8%">红灯(s)</th>
                        <th style="width: 8%">绿灯(s)</th>
                        <th style="width: 8%">黄灯(s)</th>
                        <th style="width: 8%">红灯(s)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    optimizationData.optimized_intersections.forEach(item => {
        const original = item.phases.original;
        const optimized = item.phases.optimized;
        
        tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${original.green}</td>
                <td>${original.yellow}</td>
                <td>${original.red}</td>
                <td class="${optimized.green > original.green ? 'text-danger' : optimized.green < original.green ? 'text-success' : ''}">
                    ${optimized.green} ${getChangeArrow(optimized.green, original.green)}
                </td>
                <td>${optimized.yellow}</td>
                <td class="${optimized.red < original.red ? 'text-success' : optimized.red > original.red ? 'text-danger' : ''}">
                    ${optimized.red} ${getChangeArrow(optimized.red, original.red)}
                </td>
                <td class="${item.change > 0 ? 'text-warning' : item.change < 0 ? 'text-success' : ''}">
                    ${item.change > 0 ? '+' : ''}${item.change}s
                </td>
            </tr>
        `;
    });
    
    tableHTML += `</tbody></table></div>`;
    
    // 找出所有红绿灯时间的最大值，用于统一比例
    let maxTime = 0;
    optimizationData.optimized_intersections.forEach(item => {
        const optimized = item.phases.optimized;
        maxTime = Math.max(maxTime, optimized.green, optimized.red);
    });
    
    // 添加安全边界，防止除零错误
    maxTime = Math.max(maxTime, 1);
    
    // 生成合并的红灯和绿灯时间变化表格
    let combinedTableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2 mt-3">
            <h6 class="mb-0">红绿灯时间优化对比</h6>
            <div style="font-size: 18px;">
                <span class="timeLine-text-green" style="background: linear-gradient(90deg, #a1d279ff, #017b06ff);border-radius: 5px;">绿灯</span>
                <span class="timeLine-text-red" style="background: linear-gradient(90deg, #e1ec3aff, #f91b06ff);border-radius: 5px;">红灯</span>
            </div>
        </div>
        <div class="table-responsive" style="font-size: 0.85rem;">
            <table class="table table-sm optimization-table mb-0">
                <thead class="table-light">
                    <tr>
                        <th style="width: 25%">路口名称</th>
                        <th style="width: 75%">优化时间对比</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    optimizationData.optimized_intersections.forEach(item => {
        const optimized = item.phases.optimized;
        
        // 使用统一的最大值计算比例，确保比例一致
        const greenPercent = (optimized.green / maxTime) * 85;
        const redPercent = (optimized.red / maxTime) * 85;
        
        combinedTableHTML += `
            <tr>
                <td class="align-middle fw-bold">${item.name}</td>
                <td>
                    <div class="mb-2">
                        <div class="d-flex align-items-center">
                            <div class="time-line-container flex-grow-1 me-2" style="height: 20px; position: relative;">
                                <div class="time-line green-line" style="width: ${greenPercent}%; height: 3px; background: linear-gradient(90deg, #92d9ae, #01891c); position: relative; margin-bottom: 8px;">
                                    <span class="time-dot green-dot" style="position: absolute; right: -4px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 50%; background: #01891c; border: 1px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3)"></span>
                                    <span style="position: absolute; right: -25px; top: -8px; font-size: 0.75rem; font-weight: 500; color: #01891c; white-space: nowrap;">${optimized.green}s</span>
                                </div>
                                <div class="time-line red-line" style="width: ${redPercent}%; height: 3px; background: linear-gradient(90deg, #e1ec3aff, #f91b06ff); position: relative;">
                                    <span class="time-dot red-dot" style="position: absolute; right: -4px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 50%; background: #f91b06ff; border: 1px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3)"></span>
                                    <span style="position: absolute; right: -25px; top: -8px; font-size: 0.75rem; font-weight: 500; color: #f91b06ff; white-space: nowrap;">${optimized.red}s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;

    });
    
    combinedTableHTML += `</tbody></table></div>`;
    
    // 合并所有表格内容
    resultsDiv.innerHTML = tableHTML + combinedTableHTML;
    
    // 添加滚动功能并增加高度
    resultsDiv.style.overflowY = 'auto';
    resultsDiv.style.maxHeight = '1000px'; // 增加高度到500px
    
    // 隐藏图表容器
    document.getElementById('optimizationChartGreen').style.display = 'none';
    document.getElementById('optimizationChartRed').style.display = 'none';
    
    // 调整位置使其底部略低于聚类分析部分
    setTimeout(() => {
        const clusterResults = document.getElementById('clusterResults');
        const optimizationResults = document.getElementById('optimizationResults');
        
        if (clusterResults && optimizationResults) {
            optimizationResults.style.marginTop = '25px';
        }
    }, 100);
}


// 公用图表配置
function getChartOptions(title, yAxisTitle) {
    return {
        responsive: true,
        scales: { y: { beginAtZero: true, title: { display: true, text: yAxisTitle } } },
        plugins: {
            title: { display: true, text: title },
            tooltip: {
                callbacks: {
                    afterBody: function(context) {
                        const index = context[0].dataIndex;
                        const data = optimizationData.optimized_intersections[index];
                        const change = context[0].datasetIndex === 1 
                            ? (context[0].raw - data.phases.original[context[0].datasetIndex === 1 ? 'green' : 'red'])
                            : 0;
                        return [
                            `总周期: ${data.original_cycle}s → ${data.optimized_cycle}s`,
                            `变化: ${change > 0 ? '+' : ''}${change}s`
                        ];
                    }
                }
            }
        }
    };
}

    // 地图交互功能
    function initMapInteraction() {
        const mapContainer = document.getElementById('mapContainer');
        const mapImage = document.getElementById('mapImage');
        const markersContainer = document.getElementById('markersContainer');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const clearMarkersBtn = document.getElementById('clearMarkersBtn');
        const addMarkerBtn = document.getElementById('addMarkerBtn');
        const markerEditor = document.getElementById('markerEditor');
        const markerLabelInput = document.getElementById('markerLabelInput');
        const saveMarkerBtn = document.getElementById('saveMarkerBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const mapSelector = document.getElementById('mapSelector');

        let scale = 1;
        let posX = 0;
        let posY = 0;
        let isDragging = false;
        let startX, startY;
        let markers = [];
        let currentEditingMarker = null;
        let isAddingMarker = false;

        // 初始化地图位置
        function initMapPosition() {
            const containerWidth = mapContainer.clientWidth;
            const containerHeight = mapContainer.clientHeight;
            
            // 自动缩放以适应容器
            scale = Math.min(
                containerWidth / mapImage.naturalWidth,
                containerHeight / mapImage.naturalHeight
            ) * 1;
            
            posX = (containerWidth - mapImage.naturalWidth * scale) / 2;
            posY = (containerHeight - mapImage.naturalHeight * scale) / 2;
            
            updateTransform();
        }
        // 加载保存的标记
    function loadSavedMarkers() {
        const savedMarkers = localStorage.getItem('mapMarkers');
        if (savedMarkers) {
            markers = JSON.parse(savedMarkers);
            markers.forEach(markerData => {
                createMarkerElement(markerData);
            });
        }
    }
        // 创建标记元素（使用箭头图片）
    // 在main.js中修改createMarkerElement函数
function createMarkerElement(markerData) {
    const marker = document.createElement('div');
    marker.className = 'map-marker';
    marker.style.left = `${markerData.x}px`;
    marker.style.top = `${markerData.y}px`;
    
    // 创建箭头标记
    const markerImg = document.createElement('img');
    markerImg.src = '/static/images/markers/marker-icon-red.png'; // 确保图片路径正确
    markerImg.alt = 'Marker';
    markerImg.style.width = '24px';
    markerImg.style.height = '24px';
    
    // 创建标签
    const markerLabel = document.createElement('div');
    markerLabel.className = 'marker-label';
    markerLabel.textContent = markerData.label;
    
    marker.appendChild(markerImg);
    marker.appendChild(markerLabel);
    markersContainer.appendChild(marker);
    
    // 点击标记编辑
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        editMarker(markerData);
    });
    
    return marker;
}

    // 保存标记到本地存储
    function saveMarkersToStorage() {
        localStorage.setItem('mapMarkers', JSON.stringify(markers));
    }

        // 更新变换
        function updateTransform() {
            mapImage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
            markersContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
        }


    // 修改后的添加标记函数
    function addMarker(clientX, clientY) {
        const rect = mapContainer.getBoundingClientRect();
        const markerX = (clientX - rect.left - posX) / scale;
        const markerY = (clientY - rect.top - posY) / scale;
        
        const markerData = {
            x: markerX,
            y: markerY,
            label: `标记 ${markers.length + 1}`
        };
        
        markerData.element = createMarkerElement(markerData);
        markers.push(markerData);
        saveMarkersToStorage();
        
        // 直接进入编辑模式
        editMarker(markerData);
    }


        // 编辑标记
        function editMarker(markerData) {
            currentEditingMarker = markerData;
            markerLabelInput.value = markerData.label;
            markerEditor.style.display = 'block';
            markerLabelInput.focus();
        }

    // 修改后的保存标记函数
    function saveMarker() {
        if (!currentEditingMarker) return;
        
        const newLabel = markerLabelInput.value.trim() || `标记 ${markers.indexOf(currentEditingMarker) + 1}`;
        currentEditingMarker.label = newLabel;
        currentEditingMarker.element.querySelector('.marker-label').textContent = newLabel;
        
        saveMarkersToStorage();
        closeEditor();
    }

        // 清除所有标记
        // 清除所有标记时也清除容器
    function clearMarkers() {
        if (markers.length === 0 || confirm('确定要清除所有标记吗？')) {
            markersContainer.innerHTML = ''; // 清空容器
            markers = [];
            localStorage.removeItem('mapMarkers');
            closeEditor();
        }
    }
    // 初始化时加载保存的标记
    loadSavedMarkers();
        

        mapContainer.addEventListener('click', (e) => {
            if (isAddingMarker && e.target === mapImage) {
                addMarker(e.clientX, e.clientY);
            }
        });

    

        zoomInBtn.addEventListener('click', () => zoomMap(0.2));
        zoomOutBtn.addEventListener('click', () => zoomMap(-0.2));
        
        addMarkerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isAddingMarker = !isAddingMarker;
            addMarkerBtn.classList.toggle('active');
            mapImage.style.cursor = isAddingMarker ? 'crosshair' : 'grab';
        });
        
        clearMarkersBtn.addEventListener('click', clearMarkers);
        saveMarkerBtn.addEventListener('click', saveMarker);
        cancelEditBtn.addEventListener('click', closeEditor);

        // 初始化
        if (mapImage.complete) {
            initMapPosition();
        } else {
            mapImage.onload = initMapPosition;
        }
        window.addEventListener('resize', initMapPosition);
    }

    // 添加导出按钮事件监听器
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDataToTxt);
    }

    // 初始化应用
    initApplication();
});

// 导出数据功能
function exportDataToTxt() {
    try {
        // 收集当前的分析数据
        const exportData = {
            traffic_analysis: getTrafficAnalysisData(),
            cluster_analysis: getClusterAnalysisData(),
            optimization_analysis: getOptimizationAnalysisData()
        };
        
        // 检查是否有数据可导出
        if (!hasExportData(exportData)) {
            alert('没有可导出的数据，请先执行分析操作');
            return;
        }
        
        // 显示导出中状态
        const exportBtn = document.getElementById('exportDataBtn');
        const originalText = exportBtn.querySelector('span').textContent;
        exportBtn.querySelector('span').textContent = '导出中...';
        exportBtn.style.pointerEvents = 'none';
        
        // 发送导出请求
        fetch('/export_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { 
                    throw new Error(err.error || '导出失败') 
                });
            }
            return response.blob();
        })
        .then(blob => {
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `traffic_analysis_export_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // 恢复按钮状态
            exportBtn.querySelector('span').textContent = originalText;
            exportBtn.style.pointerEvents = 'auto';
            
            // 显示成功消息
            showSuccessAlert('数据导出成功！');
        })
        .catch(error => {
            console.error('导出错误:', error);
            exportBtn.querySelector('span').textContent = originalText;
            exportBtn.style.pointerEvents = 'auto';
            showErrorAlert('导出失败: ' + error.message);
        });
        
    } catch (error) {
        console.error('导出错误:', error);
        showErrorAlert('导出失败: ' + error.message);
    }
}

// 获取交通分析数据
function getTrafficAnalysisData() {
    const totalFlowElem = document.getElementById('totalFlow');
    const avgCongestionElem = document.getElementById('avgCongestion');
    const northToSouthElem = document.getElementById('northToSouth');
    const southToNorthElem = document.getElementById('southToNorth');
    const eastToWestElem = document.getElementById('eastToWest');
    const westToEastElem = document.getElementById('westToEast');
    
    if (!totalFlowElem || !avgCongestionElem) {
        return null;
    }
    
    // 从页面元素提取数值
    const totalFlow = parseInt(totalFlowElem.textContent.match(/\d+/)?.[0] || '0');
    const avgCongestion = parseFloat(avgCongestionElem.textContent.match(/[\d.]+/)?.[0] || '0');
    const northToSouth = parseInt(northToSouthElem?.textContent.match(/\d+/)?.[0] || '0');
    const southToNorth = parseInt(southToNorthElem?.textContent.match(/\d+/)?.[0] || '0');
    const eastToWest = parseInt(eastToWestElem?.textContent.match(/\d+/)?.[0] || '0');
    const westToEast = parseInt(westToEastElem?.textContent.match(/\d+/)?.[0] || '0');
    
    return {
        total_flow: totalFlow,
        avg_congestion: avgCongestion,
        north_to_south: northToSouth,
        south_to_north: southToNorth,
        east_to_west: eastToWest,
        west_to_east: westToEast
    };
}

// 获取聚类分析数据
function getClusterAnalysisData() {
    const clusterResultsElem = document.getElementById('clusterResults');
    if (!clusterResultsElem || clusterResultsElem.innerHTML.trim() === '') {
        return null;
    }
    
    // 从聚类结果中提取数据
    const clusters = {};
    const clusterGroups = clusterResultsElem.querySelectorAll('.cluster-group');
    
    clusterGroups.forEach((group, index) => {
        const clusterId = index.toString();
        const intersections = [];
        const badges = group.querySelectorAll('.badge');
        badges.forEach(badge => {
            intersections.push(badge.textContent.trim());
        });
        clusters[clusterId] = intersections;
    });
    
    // 尝试从全局变量获取聚类中心数据
    let clusterCenters = {};
    if (window.currentClusterData && window.currentClusterData.cluster_centers) {
        clusterCenters = window.currentClusterData.cluster_centers;
    }
    
    return {
        cluster_count: Object.keys(clusters).length,
        clusters: clusters,
        cluster_centers: clusterCenters
    };
}

// 获取信号灯优化数据
function getOptimizationAnalysisData() {
    const optimizationResultsElem = document.getElementById('optimizationResults');
    if (!optimizationResultsElem || optimizationResultsElem.innerHTML.trim() === '') {
        return null;
    }
    
    // 从优化结果中提取数据
    let estimatedWaitTimeReduction = 0;
    const waitTimeMatch = optimizationResultsElem.textContent.match(/等待时间减少\s*([\d.]+)%/);
    if (waitTimeMatch) {
        estimatedWaitTimeReduction = parseFloat(waitTimeMatch[1]);
    }
    
    const optimizedIntersections = [];
    const tableRows = optimizationResultsElem.querySelectorAll('table tr');
    
    // 跳过表头行
    for (let i = 1; i < tableRows.length; i++) {
        const cells = tableRows[i].querySelectorAll('td');
        if (cells.length >= 8) {
            const intersection = {
                name: cells[0].textContent.trim(),
                phases: {
                    original: {
                        green: parseInt(cells[1].textContent.match(/\d+/)?.[0] || '0'),
                        yellow: parseInt(cells[2].textContent.match(/\d+/)?.[0] || '0'),
                        red: parseInt(cells[3].textContent.match(/\d+/)?.[0] || '0')
                    },
                    optimized: {
                        green: parseInt(cells[4].textContent.match(/\d+/)?.[0] || '0'),
                        yellow: parseInt(cells[5].textContent.match(/\d+/)?.[0] || '0'),
                        red: parseInt(cells[6].textContent.match(/\d+/)?.[0] || '0')
                    }
                },
                change: parseInt(cells[7].textContent.match(/[-+]?\d+/)?.[0] || '0')
            };
            optimizedIntersections.push(intersection);
        }
    }
    
    return {
        estimated_wait_time_reduction: estimatedWaitTimeReduction,
        optimized_intersections: optimizedIntersections
    };
}

// 检查是否有可导出的数据
function hasExportData(exportData) {
    return (
        (exportData.traffic_analysis && Object.values(exportData.traffic_analysis).some(val => val > 0)) ||
        (exportData.cluster_analysis && exportData.cluster_analysis.cluster_count > 0) ||
        (exportData.optimization_analysis && exportData.optimization_analysis.optimized_intersections.length > 0)
    );
}

// 显示成功消息
function showSuccessAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// 显示错误消息
function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// 在聚类分析完成后保存数据到全局变量
function updateClusterChart(clusterData) {
    // 原有的图表更新代码...
    
    // 保存聚类数据用于导出
    window.currentClusterData = clusterData;
    
    // 原有的图表创建代码...
}
// 更新时间显示
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\//g, '-');
    
    const timeElements = document.querySelectorAll('.time-display');
    if (timeElements) {
        timeElements.forEach(el => {
            el.textContent = timeString;
        });
    }
}

// 初始更新时间并设置定时器
updateTime();
setInterval(updateTime, 1000);

// 登录表单动画
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        setTimeout(() => {
            loginForm.style.opacity = '1';
            loginForm.style.transform = 'translateY(0)';
        }, 300);
    }
});


// 获取DOM元素
const toggleBtn = document.getElementById('toggleBtn');
const parkingBox = document.getElementById('parkingBox');

// 状态判断函数
function getStatusClass(available, total) {
    const rate = available / total;
    if (rate >0.9) return 'full';
    if (rate >0.7) return 'limited';
    return 'available';
}

function getStatusText(available, total) {
    const rate = available / total;
    if (rate >0.9) return '已满';
    if (rate >0.7) return '紧张';
    return '充足';
}

// 停车场方案模拟
document.getElementById("toggleBtn").addEventListener("click", function() {
    // 如果盒子已经显示，则隐藏
    if (parkingBox.style.display === 'block') {
        parkingBox.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> 显示停车建议';
        return; // 直接返回，不执行后面的代码
    }
    console.log("停车场方案模拟功能");
    fetch('/getstopCar')
    .then(response => response.json())
    .then(data => {
        console.log('停车场方案处理结果:', data);
        
        // 使用模板字符串生成HTML
        // 使用模板字符串生成HTML
    parkingBox.innerHTML = `
        <h2 class="title">推荐停车场</h2>
        
        <div class="suggestion-item">
            <div class="suggestion-title">建议 1: ${data.top_three[0][0]}</div>
            <div class="progress-container">
                <div class="progress-info">
                    <span>车位使用情况(单位:位数)</span>
                    <span>${data.top_three[0][1][1]}/${data.top_three[0][1][0]} (${((data.top_three[0][1][1]/data.top_three[0][1][0])*100).toFixed(1)}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${getStatusClass(data.top_three[0][1][1], data.top_three[0][1][0])}" 
                        style="width: ${(data.top_three[0][1][1]/data.top_three[0][1][0])*100}%"></div>
                </div>
            </div>
            <div class="status ${getStatusClass(data.top_three[0][1][1], data.top_three[0][1][0])}">
                ${getStatusText(data.top_three[0][1][1], data.top_three[0][1][0])}
            </div>
        </div>
        
        <div class="suggestion-item">
            <div class="suggestion-title">建议 2: ${data.top_three[1][0]}</div>
            <div class="progress-container">
                <div class="progress-info">
                    <span>车位使用情况(单位:位数)</span>
                    <span>${data.top_three[1][1][1]}/${data.top_three[1][1][0]} (${((data.top_three[1][1][1]/data.top_three[1][1][0])*100).toFixed(1)}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${getStatusClass(data.top_three[1][1][1], data.top_three[1][1][0])}" 
                        style="width: ${(data.top_three[1][1][1]/data.top_three[1][1][0])*100}%"></div>
                    </div>
            </div>
            <div class="status ${getStatusClass(data.top_three[1][1][1], data.top_three[1][1][0])}">
                ${getStatusText(data.top_three[1][1][1], data.top_three[1][1][0])}
            </div>
        </div>
        
        <div class="suggestion-item">
            <div class="suggestion-title">建议 3: ${data.top_three[2][0]}</div>
            <div class="progress-container">
                <div class="progress-info">
                    <span>车位使用情况(单位:位数)</span>
                    <span>${data.top_three[2][1][1]}/${data.top_three[2][1][0]} (${((data.top_three[2][1][1]/data.top_three[2][1][0])*100).toFixed(1)}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${getStatusClass(data.top_three[2][1][1], data.top_three[2][1][0])}" 
                        style="width: ${(data.top_three[2][1][1]/data.top_three[2][1][0])*100}%"></div>
                </div>
            </div>
            <div class="status ${getStatusClass(data.top_three[2][1][1], data.top_three[2][1][0])}">
                ${getStatusText(data.top_three[2][1][1], data.top_three[2][1][0])}
            </div>
        </div>
        
        <div class="distance-info">
            <div class="distance-title">距离信息(单位:米):</div>
            <div>${Object.entries(data.distance_dict).map(([name, distance]) => `${name}: ${distance}`).join(', ')}</div>
        </div>
    `;
        
        // 显示盒子
        parkingBox.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏停车建议';
    })
    .catch(error => {
        console.error('Error:', error);
        parkingBox.innerHTML = '<div class="error">数据加载失败，请重试</div>';
        parkingBox.style.display = 'block';
    });
});

