// position-chart.js

export class PositionChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.maxPoints = 200;
        this.history = {
            x: [],
            y: [],
            z: []
        };
    }
    
    updateFrame(trajectoryData, frame) {
        const pos = trajectoryData[frame];
        
        // Add to history
        this.history.x.push(pos[0]);
        this.history.y.push(pos[1]);
        this.history.z.push(pos[2]);
        
        // Keep only last N points
        if (this.history.x.length > this.maxPoints) {
            this.history.x.shift();
            this.history.y.shift();
            this.history.z.shift();
        }
        
        this.render();
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        if (this.history.x.length === 0) return;
        
        // Find ranges for scaling
        const allValues = [...this.history.x, ...this.history.y, ...this.history.z];
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal || 1;
        
        const margin = 30;
        const chartWidth = width - 2 * margin;
        const chartHeight = height - 2 * margin;
        
        // Helper function to map data to canvas coordinates
        const mapX = (i) => margin + (i / (this.maxPoints - 1)) * chartWidth;
        const mapY = (val) => margin + chartHeight - ((val - minVal) / range) * chartHeight;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = margin + (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(width - margin, y);
            ctx.stroke();
        }
        
        // Draw lines for X, Y, Z
        const drawLine = (data, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            data.forEach((val, i) => {
                const x = mapX(i);
                const y = mapY(val);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        };
        
        drawLine(this.history.x, '#ff4444');
        drawLine(this.history.y, '#44ff44');
        drawLine(this.history.z, '#4444ff');
        
        // Legend
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('X', 10, 20);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('Y', 30, 20);
        ctx.fillStyle = '#4444ff';
        ctx.fillText('Z', 50, 20);
        
        // Axis labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(maxVal.toFixed(2), 5, margin);
        ctx.fillText(minVal.toFixed(2), 5, height - margin + 10);
    }
}