// Random Name Picker - Main Application

class RandomNamePicker {
    constructor() {
        this.names = [];
        this.currentAnimation = 'wheel';
        this.isSpinning = false;
        
        this.initElements();
        this.initEventListeners();
        this.loadFromStorage();
        this.initAnimations();
    }

    initElements() {
        // Sidebar elements
        this.nameInput = document.getElementById('nameInput');
        this.addNameBtn = document.getElementById('addNameBtn');
        this.bulkInput = document.getElementById('bulkInput');
        this.bulkAddBtn = document.getElementById('bulkAddBtn');
        this.namesList = document.getElementById('namesList');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.loadSampleBtn = document.getElementById('loadSampleBtn');

        // Animation elements
        this.animationBtns = document.querySelectorAll('.animation-btn');
        this.animationDisplays = document.querySelectorAll('.animation-display');
        
        // Wheel
        this.wheelCanvas = document.getElementById('wheelCanvas');
        this.wheelCtx = this.wheelCanvas.getContext('2d');
        this.initWheelCanvas();
        
        // Slots
        this.slotReel = document.getElementById('slotReel');

        // Main elements
        this.pickBtn = document.getElementById('pickBtn');
        
        // Modal elements
        this.winnerModal = document.getElementById('winnerModal');
        this.winnerName = document.getElementById('winnerName');
        this.removeWinnerBtn = document.getElementById('removeWinnerBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.lastWinner = null;
        
        // Confetti
        this.confettiCanvas = document.getElementById('confettiCanvas');
        this.confettiCtx = this.confettiCanvas.getContext('2d');
        this.resizeConfetti();
    }

    initEventListeners() {
        // Add name
        this.addNameBtn.addEventListener('click', () => this.addName());
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addName();
        });

        // Bulk add
        this.bulkAddBtn.addEventListener('click', () => this.bulkAddNames());

        // Clear and sample
        this.clearAllBtn.addEventListener('click', () => this.clearAllNames());
        this.loadSampleBtn.addEventListener('click', () => this.loadSampleNames());

        // Animation selection
        this.animationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectAnimation(btn.dataset.type));
        });

        // Pick button
        this.pickBtn.addEventListener('click', () => this.pickName());

        // Remove winner button
        this.removeWinnerBtn.addEventListener('click', () => this.removeLastWinner());
        
        // Close modal button
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // Close modal on background click
        this.winnerModal.addEventListener('click', (e) => {
            if (e.target === this.winnerModal) this.closeModal();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.resizeConfetti();
            this.initWheelCanvas();
            this.drawWheel();
        });
    }

    // Name Management
    addName() {
        const name = this.nameInput.value.trim();
        if (name && !this.names.includes(name)) {
            this.names.push(name);
            this.nameInput.value = '';
            this.updateNamesList();
            this.saveToStorage();
            this.updateAnimations();
        }
    }

    bulkAddNames() {
        const lines = this.bulkInput.value.split('\n');
        let added = 0;
        lines.forEach(line => {
            const name = line.trim();
            if (name && !this.names.includes(name)) {
                this.names.push(name);
                added++;
            }
        });
        if (added > 0) {
            this.bulkInput.value = '';
            this.updateNamesList();
            this.saveToStorage();
            this.updateAnimations();
        }
    }

    removeName(index) {
        this.names.splice(index, 1);
        this.updateNamesList();
        this.saveToStorage();
        this.updateAnimations();
    }

    clearAllNames() {
        if (this.names.length === 0 || confirm('Clear all names?')) {
            this.names = [];
            this.updateNamesList();
            this.saveToStorage();
            this.updateAnimations();
        }
    }

    loadSampleNames() {
        const sampleNames = [
            'Anna', 'Arthur', 'Charlie', 'Elena', 'Emily', 'Gareth',
            'Ian', 'Isabela', 'Laura', 'Michael', 'Rahul', 'Sam I',
            'Sergi', 'Tessa', 'Xan'
        ];
        sampleNames.forEach(name => {
            if (!this.names.includes(name)) {
                this.names.push(name);
            }
        });
        this.updateNamesList();
        this.saveToStorage();
        this.updateAnimations();
    }

    updateNamesList() {
        this.namesList.innerHTML = '';
        this.names.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'name-item';
            item.innerHTML = `
                <span>${name}</span>
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            item.querySelector('.remove-btn').addEventListener('click', () => this.removeName(index));
            this.namesList.appendChild(item);
        });
    }

    // Storage
    saveToStorage() {
        localStorage.setItem('randomNamePicker_names', JSON.stringify(this.names));
    }

    loadFromStorage() {
        const savedNames = localStorage.getItem('randomNamePicker_names');
        if (savedNames) {
            this.names = JSON.parse(savedNames);
            this.updateNamesList();
        }
    }

    // Animation Selection
    selectAnimation(type) {
        this.currentAnimation = type;
        
        // Update buttons
        this.animationBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Update displays
        this.animationDisplays.forEach(display => {
            display.classList.remove('active');
        });
        document.getElementById(`${type}Display`).classList.add('active');
        
        this.updateAnimations();
    }

    // Initialize Animations
    initAnimations() {
        this.updateAnimations();
    }

    updateAnimations() {
        this.drawWheel();
        this.setupSlots();
    }

    // Pick Name
    async pickName() {
        if (this.names.length < 2) {
            alert('Please add at least 2 names!');
            return;
        }
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.pickBtn.disabled = true;
        this.pickBtn.classList.add('spinning');

        let winner;

        // Run the selected animation
        switch (this.currentAnimation) {
            case 'wheel':
                winner = await this.spinWheel();
                break;
            case 'slots':
                const winnerIndex = Math.floor(Math.random() * this.names.length);
                winner = this.names[winnerIndex];
                await this.spinSlots(winner);
                break;
        }

        // Show winner in modal
        this.winnerName.textContent = winner;
        this.lastWinner = winner;
        this.showModal();
        this.launchConfetti();

        this.isSpinning = false;
        this.pickBtn.disabled = false;
        this.pickBtn.classList.remove('spinning');
    }

    // Wheel Animation
    initWheelCanvas() {
        const canvas = this.wheelCanvas;
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate size based on CSS computed size
        const computedStyle = getComputedStyle(canvas);
        const cssWidth = parseFloat(computedStyle.width);
        const cssHeight = parseFloat(computedStyle.height);
        const size = Math.min(cssWidth, cssHeight) || 650;
        
        // Set the canvas internal size scaled by device pixel ratio
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        
        // Reset and scale the context
        this.wheelCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.wheelCtx.scale(dpr, dpr);
        
        // Store the logical size for drawing calculations
        this.wheelSize = size;
    }

    drawWheel(rotation = 0) {
        const canvas = this.wheelCanvas;
        const ctx = this.wheelCtx;
        const dpr = window.devicePixelRatio || 1;
        const size = this.wheelSize || 400;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = centerX - 10;

        // Clear with proper scaling
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        if (this.names.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#334155';
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '18px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add names to spin!', centerX, centerY);
            ctx.restore();
            return;
        }

        const sliceAngle = (2 * Math.PI) / this.names.length;
        const colors = [
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
            '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
            '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
        ];

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        this.names.forEach((name, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Poppins';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            const displayName = name.length > 14 ? name.substring(0, 12) + '...' : name;
            ctx.fillText(displayName, radius - 25, 0);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.restore();
    }

    spinWheel() {
        return new Promise(resolve => {
            const sliceAngle = (2 * Math.PI) / this.names.length;
            
            // Spin to a random position (5-8 full rotations plus random extra)
            const spins = 5 + Math.random() * 3;
            const randomExtra = Math.random() * 2 * Math.PI;
            const totalRotation = spins * 2 * Math.PI + randomExtra;
            
            const duration = 4000;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease out cubic)
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentRotation = totalRotation * eased;
                
                this.drawWheel(currentRotation);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Calculate which slice is at the top (under the pointer)
                    // The pointer is at -Math.PI/2 (top, 12 o'clock)
                    // After rotation, a point that was at angle A is now at angle A + totalRotation
                    // We need to find which slice contains the angle -Math.PI/2 in the rotated wheel
                    // That means finding which slice's original position, when rotated, equals -Math.PI/2
                    // Original angle + totalRotation = -Math.PI/2 (mod 2*PI)
                    // Original angle = -Math.PI/2 - totalRotation (mod 2*PI)
                    
                    let pointerAngle = (-Math.PI / 2 - totalRotation) % (2 * Math.PI);
                    // Normalize to 0 to 2*PI
                    if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
                    
                    // Find which slice this angle falls into
                    const winnerIndex = Math.floor(pointerAngle / sliceAngle);
                    const winner = this.names[winnerIndex];
                    
                    resolve(winner);
                }
            };
            
            animate();
        });
    }

    // Slot Machine Animation
    setupSlots() {
        this.slotReel.innerHTML = '';
        const displayNames = this.names.length > 0 ? this.names : ['Add names...'];
        
        // Triple the names for smooth scrolling
        [...displayNames, ...displayNames, ...displayNames].forEach(name => {
            const div = document.createElement('div');
            div.className = 'slot-name';
            div.textContent = name;
            this.slotReel.appendChild(div);
        });
    }

    spinSlots(winner) {
        return new Promise(resolve => {
            const itemHeight = 140;
            const duration = 3000;
            const startTime = Date.now();
            
            // Find winner position in middle section
            const winnerIndex = this.names.indexOf(winner);
            const targetPosition = (this.names.length + winnerIndex) * itemHeight;
            const totalDistance = targetPosition + this.names.length * itemHeight * 3;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing
                const eased = 1 - Math.pow(1 - progress, 4);
                const currentPosition = totalDistance * eased;
                
                this.slotReel.style.transform = `translateY(-${currentPosition % (this.names.length * itemHeight * 3)}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.slotReel.style.transform = `translateY(-${targetPosition}px)`;
                    resolve();
                }
            };
            
            animate();
        });
    }

    // Remove last winner
    removeLastWinner() {
        if (this.lastWinner) {
            const index = this.names.indexOf(this.lastWinner);
            if (index > -1) {
                this.names.splice(index, 1);
                this.updateNamesList();
                this.saveToStorage();
                this.updateAnimations();
            }
            this.lastWinner = null;
            this.closeModal();
        }
    }
    
    // Modal methods
    showModal() {
        this.winnerModal.classList.add('show');
    }
    
    closeModal() {
        this.winnerModal.classList.remove('show');
    }

    // Confetti
    resizeConfetti() {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
    }

    launchConfetti() {
        const particles = [];
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#eab308'];
        
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * 5 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        const animate = () => {
            this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            
            let activeParticles = 0;
            particles.forEach(p => {
                if (p.y < this.confettiCanvas.height) {
                    activeParticles++;
                    p.vy += 0.2;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;
                    
                    this.confettiCtx.save();
                    this.confettiCtx.translate(p.x, p.y);
                    this.confettiCtx.rotate(p.rotation * Math.PI / 180);
                    this.confettiCtx.fillStyle = p.color;
                    this.confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    this.confettiCtx.restore();
                }
            });
            
            if (activeParticles > 0) {
                requestAnimationFrame(animate);
            } else {
                this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            }
        };
        
        animate();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new RandomNamePicker();
});
