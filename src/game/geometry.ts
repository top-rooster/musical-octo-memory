export interface ClientMetrics {
  rectLeft: number;
  rectTop: number;
  clientLeft: number;
  clientTop: number;
  clientWidth: number;
  clientHeight: number;
}

export function clientBoxFromMetrics(metrics: ClientMetrics) {
  return {
    x: metrics.rectLeft + metrics.clientLeft,
    y: metrics.rectTop + metrics.clientTop,
    width: metrics.clientWidth,
    height: metrics.clientHeight,
  };
}

export function measureClientBox(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return clientBoxFromMetrics({
    rectLeft: rect.left,
    rectTop: rect.top,
    clientLeft: element.clientLeft,
    clientTop: element.clientTop,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
  });
}
