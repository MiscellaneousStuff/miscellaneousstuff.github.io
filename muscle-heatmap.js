// muscle-heatmap.js

export class MuscleHeatmap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Circular buffer for scrolling heatmap
        this.maxColumns = 200;
        this.columns = [];
    }
    
    updateFrame(muscleData, frame) {
        const muscles = muscleData[frame]; // Array of 96 values
        
        // Add new column
        this.columns.push(muscles);
        if (this.columns.length > this.maxColumns) {
            this.columns.shift();
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
        
        if (this.columns.length === 0) return;
        
        const colWidth = width / this.maxColumns;
        const rowHeight = height / 96;
        
        // Draw heatmap
        this.columns.forEach((column, colIdx) => {
            column.forEach((activation, rowIdx) => {
                const x = colIdx * colWidth;
                const y = rowIdx * rowHeight;
                
                // Color based on activation (0-1)
                const hue = (1 - activation) * 240; // Blue to red
                const saturation = 80;
                const lightness = 30 + activation * 40;
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x, y, Math.ceil(colWidth), Math.ceil(rowHeight));
            });
        });
        
        // Draw grid lines for muscle groups (4 groups of 24)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (i * 24) * rowHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText('Muscles (96)', 5, 15);
        ctx.fillText('Time →', width - 50, height - 5);
    }
}