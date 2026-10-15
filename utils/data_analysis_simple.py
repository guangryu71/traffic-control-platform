import json

def analyze_traffic_data(data):
    # 转换数据为列表
    hourly_traffic = data['hourly_traffic']
    
    # 计算基本统计数据
    flows = [item['flow'] for item in hourly_traffic]
    congestions = [item['congestion'] for item in hourly_traffic]
    hours = [item['hour'] for item in hourly_traffic]
    
    total_flow = sum(flows)
    avg_flow = total_flow / len(flows) if flows else 0
    max_flow = max(flows) if flows else 0
    min_flow = min(flows) if flows else 0
    
    # 计算高峰时段 (流量高于75%分位数的时段)
    sorted_flows = sorted(flows)
    n = len(sorted_flows)
    threshold_index = int(n * 0.75)
    threshold = sorted_flows[threshold_index] if n > 0 else 0
    peak_hours = [hours[i] for i, flow in enumerate(flows) if flow > threshold]
    
    # 计算拥堵统计
    avg_congestion = sum(congestions) / len(congestions) if congestions else 0
    max_congestion = max(congestions) if congestions else 0
    high_congestion_hours = [hours[i] for i, congestion in enumerate(congestions) if congestion >= 7]
    
    stats = {
        "total_flow": int(total_flow),
        "avg_flow": float(avg_flow),
        "max_flow": int(max_flow),
        "min_flow": int(min_flow),
        "peak_hours": peak_hours,
        "congestion_stats": {
            "avg_congestion": float(avg_congestion),
            "max_congestion": int(max_congestion),
            "high_congestion_hours": high_congestion_hours
        }
    }
    
    return stats