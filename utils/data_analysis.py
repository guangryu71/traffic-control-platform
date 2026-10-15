import pandas as pd

def analyze_traffic_data(data):
    # 转换数据为DataFrame
    df = pd.DataFrame(data['hourly_traffic'])
    
    # 基本统计分析
    stats = {
        "total_flow": int(df['flow'].sum()),
        "avg_flow": float(df['flow'].mean()),
        "max_flow": int(df['flow'].max()),
        "min_flow": int(df['flow'].min()),
        "peak_hours": df[df['flow'] > df['flow'].quantile(0.75)]['hour'].tolist(),
        "congestion_stats": {
            "avg_congestion": float(df['congestion'].mean()),
            "max_congestion": int(df['congestion'].max()),
            "high_congestion_hours": df[df['congestion'] >= 7]['hour'].tolist()
        }
    }
    
    # 路口数据分析
    intersections_df = pd.DataFrame(data['intersections'])
    stats['intersection_stats'] = {
        "busiest_intersection": intersections_df.loc[intersections_df['traffic_volume'].idxmax()]['name'],
        "avg_traffic_volume": float(intersections_df['traffic_volume'].mean()),
        "signal_cycle_stats": {
            "avg": float(intersections_df['signal_cycle'].mean()),
            "min": int(intersections_df['signal_cycle'].min()),
            "max": int(intersections_df['signal_cycle'].max())
        }
    }
    
    return stats