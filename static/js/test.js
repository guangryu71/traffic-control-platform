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

// 输出：当前拥堵指数为：33 (说明速度只有自由流速度的1/3，非常拥堵)
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
// 求平均拥堵指数
            const roadNetworkData = [
              { actualSpeed: 20, freeFlowSpeed: 60 }, // 路段1：非常拥堵
              { actualSpeed: 55, freeFlowSpeed: 60 }, // 路段2：轻微拥堵
              { actualSpeed: 5, freeFlowSpeed: 50 },  // 路段3：极度拥堵，可能被过滤（如果函数处理了0速度）
              { actualSpeed: 65, freeFlowSpeed: 60 }, // 路段4：畅通
              { invalidData: 'xxx' }                  // 路段5：无效数据，会被跳过
            ];
const avgCongestionIndex = calculateAverageCongestionIndex(roadNetworkData);
console.log(avgCongestionIndex);
