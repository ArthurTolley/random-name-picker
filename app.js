class RandomNamePicker {
    constructor() {
        this.names = [];
        this.weights = []; // Weight for each name (1-4)
        this.weightsEnabled = false;
        this.currentAnimation = 'wheel';
        this.isSpinning = false;
        this.animationCancelled = false;
        this.firstClawGame = true; // First claw game of the session always succeeds
        this.durationMultiplier = 1; // Animation speed multiplier (higher = slower)
        
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
        this.weightsToggle = document.getElementById('weightsToggle');

        // Animation elements
        this.animationBtns = document.querySelectorAll('.animation-btn');
        this.animationDisplays = document.querySelectorAll('.animation-display');
        
        // Wheel
        this.wheelCanvas = document.getElementById('wheelCanvas');
        this.wheelCtx = this.wheelCanvas.getContext('2d');
        this.initWheelCanvas();
        
        // Slots
        this.slotReel = document.getElementById('slotReel');

        // Claw Machine
        this.clawCanvas = document.getElementById('clawCanvas');
        this.clawCtx = this.clawCanvas.getContext('2d');

        // Race
        this.raceCanvas = document.getElementById('raceCanvas');
        this.raceCtx = this.raceCanvas.getContext('2d');

        // Battle Royale
        this.battleCanvas = document.getElementById('battleCanvas');
        this.battleCtx = this.battleCanvas.getContext('2d');

        // Spotlight
        this.spotlightCanvas = document.getElementById('spotlightCanvas');
        this.spotlightCtx = this.spotlightCanvas.getContext('2d');

        // Main elements
        this.pickBtn = document.getElementById('pickBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
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

        // Duration slider
        this.durationSlider = document.getElementById('durationSlider');
        this.durationValue = document.getElementById('durationValue');
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

        // Stop button
        this.stopBtn.addEventListener('click', () => this.stopAnimation());

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

        // Duration slider
        this.durationSlider.addEventListener('input', () => this.updateDuration());

        // Weights toggle
        this.weightsToggle.addEventListener('change', () => this.toggleWeights());
    }

    toggleWeights() {
        this.weightsEnabled = this.weightsToggle.checked;
        this.namesList.classList.toggle('weights-enabled', this.weightsEnabled);
        this.saveToStorage();
    }

    updateWeight(index, weight) {
        const parsedWeight = parseInt(weight) || 1;
        this.weights[index] = Math.max(1, parsedWeight); // Ensure minimum of 1
        this.saveToStorage();
        this.updateAnimations(); // Refresh previews to show new weights
    }

    // Weighted random selection - returns index
    getWeightedRandomIndex() {
        if (!this.weightsEnabled) {
            return Math.floor(Math.random() * this.names.length);
        }
        
        // Build weighted array
        const weightedIndices = [];
        for (let i = 0; i < this.names.length; i++) {
            const weight = this.weights[i] || 1;
            for (let j = 0; j < weight; j++) {
                weightedIndices.push(i);
            }
        }
        
        return weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
    }

    updateDuration() {
        this.durationMultiplier = parseFloat(this.durationSlider.value);
        this.durationValue.textContent = `${this.durationMultiplier.toFixed(2)}x`;
    }

    // Name Management
    addName() {
        if (this.isSpinning) return;
        const name = this.nameInput.value.trim();
        if (name && !this.names.includes(name)) {
            this.names.push(name);
            this.weights.push(1); // Default weight of 1
            this.nameInput.value = '';
            this.updateNamesList();
            this.saveToStorage();
            this.updateAnimations();
        }
    }

    bulkAddNames() {
        if (this.isSpinning) return;
        const lines = this.bulkInput.value.split('\n');
        let added = 0;
        lines.forEach(line => {
            const name = line.trim();
            if (name && !this.names.includes(name)) {
                this.names.push(name);
                this.weights.push(1); // Default weight of 1
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
        if (this.isSpinning) return;
        this.names.splice(index, 1);
        this.weights.splice(index, 1);
        this.updateNamesList();
        this.saveToStorage();
        this.updateAnimations();
    }

    clearAllNames() {
        if (this.isSpinning) return;
        if (this.names.length === 0 || confirm('Clear all names?')) {
            this.names = [];
            this.weights = [];
            this.updateNamesList();
            this.saveToStorage();
            this.updateAnimations();
        }
    }

    loadSampleNames() {
        if (this.isSpinning) return;
        const sampleNames = [
            'Anna', 'Arthur', 'Charlie', 'Elena', 'Emily', 'Gareth',
            'Ian', 'Isabela', 'Laura', 'Michael', 'Rahul', 'Sam I',
            'Sergi', 'Tanmaya', 'Tessa', 'Xan'
        ];
        sampleNames.forEach(name => {
            if (!this.names.includes(name)) {
                this.names.push(name);
                this.weights.push(1); // Default weight of 1
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
            const currentWeight = this.weights[index] || 1;
            item.innerHTML = `
                <span class="name-text">${name}</span>
                <div class="weight-selector">
                    <span class="weight-label">×</span>
                    <input type="number" min="1" value="${currentWeight}" data-index="${index}">
                </div>
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            item.querySelector('.remove-btn').addEventListener('click', () => this.removeName(index));
            item.querySelector('input').addEventListener('change', (e) => this.updateWeight(index, e.target.value));
            this.namesList.appendChild(item);
        });
    }

    // Storage
    saveToStorage() {
        localStorage.setItem('randomNamePicker_names', JSON.stringify(this.names));
        localStorage.setItem('randomNamePicker_weights', JSON.stringify(this.weights));
        localStorage.setItem('randomNamePicker_weightsEnabled', JSON.stringify(this.weightsEnabled));
    }

    loadFromStorage() {
        const savedNames = localStorage.getItem('randomNamePicker_names');
        if (savedNames) {
            this.names = JSON.parse(savedNames);
        }
        
        const savedWeights = localStorage.getItem('randomNamePicker_weights');
        if (savedWeights) {
            this.weights = JSON.parse(savedWeights);
        }
        // Ensure weights array matches names array length
        while (this.weights.length < this.names.length) {
            this.weights.push(1);
        }
        
        const savedWeightsEnabled = localStorage.getItem('randomNamePicker_weightsEnabled');
        if (savedWeightsEnabled) {
            this.weightsEnabled = JSON.parse(savedWeightsEnabled);
            this.weightsToggle.checked = this.weightsEnabled;
            this.namesList.classList.toggle('weights-enabled', this.weightsEnabled);
        }
        
        this.updateNamesList();
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
        this.drawClawPreview();
        this.drawRacePreview();
        this.drawBattlePreview();
        this.drawSpotlightPreview();
    }

    // Pick Name
    async pickName() {
        if (this.names.length < 2) {
            alert('Please add at least 2 names!');
            return;
        }
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.animationCancelled = false;
        this.pickBtn.disabled = true;
        this.pickBtn.classList.add('spinning');
        this.stopBtn.style.display = 'inline-flex';

        let winner;

        // Run the selected animation
        switch (this.currentAnimation) {
            case 'wheel':
                winner = await this.spinWheel();
                break;
            case 'slots':
                const winnerIndex = this.getWeightedRandomIndex();
                winner = this.names[winnerIndex];
                await this.spinSlots(winner);
                break;
            case 'claw':
                winner = await this.runClawMachine();
                break;
            case 'race':
                winner = await this.runRace();
                break;
            case 'battle':
                winner = await this.runBattleRoyale();
                break;
            case 'spotlight':
                winner = await this.runSpotlight();
                break;
        }

        this.stopBtn.style.display = 'none';

        // Only show winner if animation wasn't cancelled
        if (!this.animationCancelled) {
            this.winnerName.textContent = winner;
            this.lastWinner = winner;
            this.showModal();
            this.launchConfetti();
        } else {
            // Reset animations to their initial state
            this.updateAnimations();
        }

        this.isSpinning = false;
        this.animationCancelled = false;
        this.pickBtn.disabled = false;
        this.pickBtn.classList.remove('spinning');
    }

    stopAnimation() {
        this.animationCancelled = true;
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

    // Calculate total weight for wheel slice sizing
    getTotalWeight() {
        if (!this.weightsEnabled) return this.names.length;
        return this.weights.reduce((sum, w, i) => i < this.names.length ? sum + (w || 1) : sum, 0);
    }

    // Get slice angles for each name based on weight
    getSliceAngles() {
        const totalWeight = this.getTotalWeight();
        const angles = [];
        let currentAngle = 0;
        
        this.names.forEach((name, i) => {
            const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
            const sliceAngle = (weight / totalWeight) * 2 * Math.PI;
            angles.push({
                start: currentAngle,
                end: currentAngle + sliceAngle,
                name: name,
                index: i
            });
            currentAngle += sliceAngle;
        });
        
        return angles;
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

        const sliceAngles = this.getSliceAngles();
        const colors = [
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
            '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
            '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
        ];

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        sliceAngles.forEach((slice, i) => {
            const startAngle = slice.start;
            const endAngle = slice.end;
            const sliceAngle = endAngle - startAngle;

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
            ctx.fillText(slice.name, radius - 25, 0);
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
            const sliceAngles = this.getSliceAngles();
            
            // Spin to a random position (5-8 full rotations plus random extra)
            const spins = 5 + Math.random() * 3;
            const randomExtra = Math.random() * 2 * Math.PI;
            const totalRotation = spins * 2 * Math.PI + randomExtra;
            
            const duration = 4000 * this.durationMultiplier;
            const startTime = Date.now();
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve(null);
                    return;
                }
                
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
                    
                    // Find which slice this angle falls into (works with weighted slices)
                    let winner = this.names[0];
                    for (const slice of sliceAngles) {
                        if (pointerAngle >= slice.start && pointerAngle < slice.end) {
                            winner = slice.name;
                            break;
                        }
                    }
                    
                    resolve(winner);
                }
            };
            
            animate();
        });
    }

    // Slot Machine Animation
    setupSlots() {
        this.slotReel.innerHTML = '';
        
        // Build weighted names list - each name appears based on their weight
        let weightedNames = [];
        if (this.names.length > 0) {
            this.names.forEach((name, i) => {
                const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
                for (let w = 0; w < weight; w++) {
                    weightedNames.push(name);
                }
            });
        } else {
            weightedNames = ['Add names...'];
        }
        
        // Shuffle weighted names for better visual distribution
        weightedNames = weightedNames.sort(() => Math.random() - 0.5);
        
        // Repeat the weighted list for smooth wrapping during spin
        const repeats = Math.ceil(50 / weightedNames.length); // Ensure enough items
        const displayNames = [];
        for (let r = 0; r < repeats; r++) {
            displayNames.push(...weightedNames);
        }
        
        displayNames.forEach(name => {
            const div = document.createElement('div');
            div.className = 'slot-name';
            div.textContent = name;
            this.slotReel.appendChild(div);
        });
        
        // Start at middle section so we have room to scroll
        const itemHeight = 100;
        const totalItems = displayNames.length;
        this.slotReel.style.transform = `translateY(-${Math.floor(totalItems / 3) * itemHeight}px)`;
    }

    spinSlots(winner) {
        return new Promise(resolve => {
            const itemHeight = 100;
            const duration = 3000 * this.durationMultiplier;
            const startTime = Date.now();
            
            // Get total number of displayed items
            const totalItems = this.slotReel.querySelectorAll('.slot-name').length;
            
            // Get current position
            const transform = this.slotReel.style.transform;
            const match = transform.match(/translateY\(-?(\d+)px\)/);
            let startPosition = match ? parseInt(match[1]) : totalItems / 2 * itemHeight;
            
            // Find a winner position in the second half of the reel
            const items = Array.from(this.slotReel.querySelectorAll('.slot-name'));
            const midPoint = Math.floor(items.length / 2);
            let targetIndex = -1;
            
            // Find an instance of the winner in the middle section
            for (let i = midPoint; i < items.length - 2; i++) {
                if (items[i].textContent === winner) {
                    targetIndex = i;
                    break;
                }
            }
            
            // Fallback: find any instance
            if (targetIndex === -1) {
                targetIndex = items.findIndex(item => item.textContent === winner);
            }
            
            // Calculate target position (offset by -1 to center in view)
            let targetPosition = (targetIndex - 1) * itemHeight;
            
            // Ensure minimum spin distance
            const minSpinDistance = totalItems / 4 * itemHeight * this.durationMultiplier;
            let spinDistance = targetPosition - startPosition;
            
            // If we would spin backwards or not enough, add more distance
            while (spinDistance < minSpinDistance) {
                // Find next instance of winner
                let nextWinnerOffset = items.slice(targetIndex + 1).findIndex(item => item.textContent === winner);
                if (nextWinnerOffset !== -1) {
                    targetIndex = targetIndex + 1 + nextWinnerOffset;
                    targetPosition = (targetIndex - 1) * itemHeight;
                    spinDistance = targetPosition - startPosition;
                } else {
                    spinDistance += totalItems / 2 * itemHeight;
                }
            }
            
            const finalPosition = startPosition + spinDistance;
            
            const slotWindow = this.slotReel.parentElement;
            slotWindow.classList.remove('stopped');
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve();
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Use a more balanced easing curve - cubic ease-out for smoother deceleration
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentPosition = startPosition + spinDistance * eased;
                
                this.slotReel.style.transform = `translateY(-${currentPosition}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.slotReel.style.transform = `translateY(-${finalPosition}px)`;
                    slotWindow.classList.add('stopped');
                    this.highlightCenterSlot();
                    resolve();
                }
            };
            
            animate();
        });
    }

    highlightCenterSlot() {
        // Remove previous center highlights
        this.slotReel.querySelectorAll('.slot-name').forEach(el => el.classList.remove('center'));
        
        // Calculate which item is in the center based on current transform
        const transform = this.slotReel.style.transform;
        const match = transform.match(/translateY\(-?(\d+)px\)/);
        if (match) {
            const offset = parseInt(match[1]);
            const itemHeight = 100;
            const centerIndex = Math.round(offset / itemHeight) + 1; // +1 for center position
            const items = this.slotReel.querySelectorAll('.slot-name');
            if (items[centerIndex]) {
                items[centerIndex].classList.add('center');
            }
        }
    }

    // Claw Machine Preview
    drawClawPreview() {
        if (this.names.length === 0) return;
        
        const canvas = this.clawCanvas;
        const ctx = this.clawCtx;
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        
        const animalEmojis = ['🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🦊', '🐶', '🐱', '🐮', '🐔', '🐧', '🐺', '🐹', '🦉', '🐦', '🐤', '🐙', '🐝', '🐢'];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
        
        // Draw arcade machine frame
        ctx.fillStyle = '#2d1f3d';
        ctx.fillRect(0, 0, width, 80);
        ctx.fillStyle = '#3d2f4d';
        ctx.fillRect(0, height - 150, width, 150);
        
        // Glass area
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(10, 85, width - 20, height - 240);
        
        // Chute
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(width - 120, 80);
        ctx.lineTo(width - 40, 80);
        ctx.lineTo(width - 60, height - 30);
        ctx.lineTo(width - 100, height - 30);
        ctx.closePath();
        ctx.fill();
        
        // Build weighted animals for preview
        const weightedAnimals = [];
        this.names.forEach((name, i) => {
            const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
            for (let w = 0; w < weight; w++) {
                weightedAnimals.push({
                    name,
                    emoji: animalEmojis[i % animalEmojis.length],
                    color: colors[i % colors.length]
                });
            }
        });
        
        // Draw animals in pit
        const pitWidth = width - 160;
        const animalSize = 45;
        const maxPerRow = Math.floor(pitWidth / animalSize);
        const totalAnimals = weightedAnimals.length;
        const numRows = Math.ceil(totalAnimals / maxPerRow);
        
        weightedAnimals.forEach((animal, i) => {
            const rowIndex = Math.floor(i / maxPerRow);
            const colIndex = i % maxPerRow;
            const itemsInRow = rowIndex < numRows - 1 ? maxPerRow : ((totalAnimals - 1) % maxPerRow) + 1;
            const rowSpacing = pitWidth / itemsInRow;
            
            const x = 40 + colIndex * rowSpacing + rowSpacing / 2;
            const y = height - 70 - rowIndex * 45;
            
            ctx.save();
            ctx.translate(x, y);
            
            // Circular background
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = animal.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Emoji
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(animal.emoji, 0, 2);
            
            // Name tag (smaller)
            ctx.fillStyle = animal.color;
            ctx.fillRect(-18, 22, 36, 12);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 7px Poppins';
            ctx.fillText(animal.name.substring(0, 6), 0, 29);
            
            ctx.restore();
        });
        
        // Draw claw at top center
        const clawX = width / 2;
        const clawY = 50;
        ctx.save();
        ctx.translate(clawX, clawY);
        ctx.fillStyle = '#888';
        ctx.fillRect(-8, -50, 16, 50);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.save();
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 35);
        ctx.lineTo(-10, 45);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 35);
        ctx.lineTo(10, 45);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        
        // Claw rail
        ctx.fillStyle = '#444';
        ctx.fillRect(20, 40, width - 40, 8);
    }

    // Race Preview
    drawRacePreview() {
        if (this.names.length === 0) return;
        
        const canvas = this.raceCanvas;
        const ctx = this.raceCtx;
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        
        const racerEmojis = ['🐎', '🚗', '🐢', '🚀', '🏃', '🐇', '🦊', '🐕', '🚲', '🛵'];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
        
        const laneHeight = Math.min(60, (height - 100) / this.names.length);
        const startX = 80;
        const finishX = width - 100;
        
        // Sky
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height * 0.6);
        
        // Grass
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        // Track
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(0, 30, width, height - 60);
        
        // Lanes
        this.names.forEach((_, i) => {
            const y = 50 + i * laneHeight;
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]);
        });
        
        // Start line
        ctx.fillStyle = '#fff';
        ctx.fillRect(startX - 5, 30, 10, height - 60);
        
        // Finish line (checkered)
        for (let i = 0; i < Math.ceil((height - 60) / 15); i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#000' : '#fff';
                ctx.fillRect(finishX + j * 15, 30 + i * 15, 15, 15);
            }
        }
        
        // Draw racers at start
        this.names.forEach((name, i) => {
            const x = startX;
            const y = 50 + i * laneHeight + laneHeight / 2;
            const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
            
            ctx.save();
            ctx.translate(x, y);
            
            // Draw weight balls behind the racer (if weights enabled and weight > 1)
            if (this.weightsEnabled && weight > 1) {
                const numBalls = weight - 1;
                const ballRadius = 8;
                
                for (let b = 0; b < numBalls; b++) {
                    const ballX = -30 - (b * (ballRadius * 2 + 5));
                    
                    // Chain
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(b === 0 ? -22 : ballX + ballRadius * 2 + 5, 0);
                    ctx.lineTo(ballX + ballRadius, 0);
                    ctx.stroke();
                    
                    // Ball
                    ctx.fillStyle = '#333';
                    ctx.beginPath();
                    ctx.arc(ballX, 0, ballRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // W on ball
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 9px Poppins';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('W', ballX, 0);
                }
            }
            
            // Circular background
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors[i % colors.length];
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Emoji
            const noFlipEmojis = ['🚀'];
            const emoji = racerEmojis[i % racerEmojis.length];
            ctx.save();
            if (!noFlipEmojis.includes(emoji)) {
                ctx.scale(-1, 1);
            }
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 0, 0);
            ctx.restore();
            
            // Name tag
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(-30, -35, 60, 18);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 0, -26);
            
            ctx.restore();
        });
    }

    // Battle Royale Preview
    drawBattlePreview() {
        if (this.names.length === 0) return;
        
        const canvas = this.battleCanvas;
        const ctx = this.battleCtx;
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
        
        // Dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Title
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 24px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️ BATTLE ROYALE - ${this.names.length} Contestants ⚔️`, width / 2, 30);
        
        // Grid of contestants
        const cols = Math.ceil(Math.sqrt(this.names.length));
        const rows = Math.ceil(this.names.length / cols);
        const cellWidth = (width - 40) / cols;
        const cellHeight = (height - 100) / rows;
        
        this.names.forEach((name, i) => {
            const x = 20 + (i % cols) * cellWidth + cellWidth / 2;
            const y = 50 + Math.floor(i / cols) * cellHeight + cellHeight / 2;
            
            // Get weight as lives
            const lives = this.weightsEnabled ? (this.weights[i] || 1) : 1;
            
            ctx.save();
            ctx.translate(x, y);
            
            const boxWidth = cellWidth - 10;
            const boxHeight = cellHeight - 10;
            ctx.fillStyle = colors[i % colors.length];
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 8);
            ctx.fill();
            ctx.stroke();
            
            // Draw lives as hearts in top-right corner
            if (lives > 0) {
                const heartSize = Math.min(12, cellWidth / 8);
                const heartsX = boxWidth/2 - 4;
                const heartsY = -boxHeight/2 + 4;
                
                ctx.font = `${heartSize}px Arial`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                
                let heartStr = '';
                for (let h = 0; h < lives; h++) {
                    heartStr = '❤️' + heartStr;
                }
                ctx.fillText(heartStr, heartsX, heartsY);
            }
            
            ctx.fillStyle = '#000';
            ctx.font = `bold ${Math.min(16, cellWidth / 6)}px Poppins`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 0, 0);
            
            ctx.restore();
        });
    }

    // Spotlight Preview
    drawSpotlightPreview() {
        if (this.names.length === 0) return;
        
        const canvas = this.spotlightCanvas;
        const ctx = this.spotlightCtx;
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
        
        // Dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Grid of names
        const cols = Math.ceil(Math.sqrt(this.names.length));
        const rows = Math.ceil(this.names.length / cols);
        const cellWidth = (width - 60) / cols;
        const cellHeight = (height - 80) / rows;
        
        this.names.forEach((name, i) => {
            const x = 30 + (i % cols) * cellWidth + cellWidth / 2;
            const y = 60 + Math.floor(i / cols) * cellHeight + cellHeight / 2;
            
            // Get weight for font size scaling
            const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
            const fontScale = 1 + (weight - 1) * 0.3; // 1.0, 1.3, 1.6, 1.9 for weights 1-4
            const fontSize = Math.round(16 * fontScale);
            
            ctx.fillStyle = colors[i % colors.length] + '66'; // Semi-dimmed
            ctx.font = `bold ${fontSize}px Poppins`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, x, y);
        });
        
        // Draw spotlight hint in center
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 100);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Claw Machine Animation
    runClawMachine() {
        return new Promise(resolve => {
            const canvas = this.clawCanvas;
            const ctx = this.clawCtx;
            const dpr = window.devicePixelRatio || 1;
            
            // Set canvas size
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const width = rect.width;
            const height = rect.height;
            
            // Animal emojis and colors
            const animalEmojis = ['🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🦊', '🐶', '🐱', '🐮', '🐔', '🐧', '🐺', '🐹', '🦉', '🐦', '🐤', '🐙', '🐝', '🐢'];
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            // Build weighted animals list - each person gets more animals based on weight
            const weightedAnimals = [];
            this.names.forEach((name, i) => {
                const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
                for (let w = 0; w < weight; w++) {
                    weightedAnimals.push({
                        name,
                        originalIndex: i,
                        emoji: animalEmojis[i % animalEmojis.length],
                        color: colors[i % colors.length]
                    });
                }
            });
            
            // Create animals with names - arrange in rows
            const pitWidth = width - 160; // Leave space for chute on right
            const animalSize = 45; // Width each animal takes up (smaller for more animals)
            const maxPerRow = Math.floor(pitWidth / animalSize);
            
            // Calculate rows needed
            const totalAnimals = weightedAnimals.length;
            const numRows = Math.ceil(totalAnimals / maxPerRow);
            
            const animals = weightedAnimals.map((animalData, i) => {
                const rowIndex = Math.floor(i / maxPerRow);
                const colIndex = i % maxPerRow;
                const itemsInRow = rowIndex < numRows - 1 ? maxPerRow : ((totalAnimals - 1) % maxPerRow) + 1;
                const rowSpacing = pitWidth / itemsInRow;
                
                const x = 40 + colIndex * rowSpacing + rowSpacing / 2;
                const y = height - 70 - rowIndex * 50; // Stack rows upward
                
                return {
                    name: animalData.name,
                    originalIndex: animalData.originalIndex,
                    x,
                    y,
                    radius: 22,
                    emoji: animalData.emoji,
                    color: animalData.color,
                    vx: 0,
                    vy: 0
                };
            });
            
            // Claw state
            const claw = {
                x: width / 2,
                y: 50,
                openAngle: 0.4,
                state: 'moving', // moving, descending, grabbing, ascending, dropping
                targetX: 0,
                grabbedAnimal: null
            };
            
            // Pick winner (may change if fumble happens) - pick from weighted animals array
            let targetAnimalIndex = Math.floor(Math.random() * animals.length);
            let targetAnimal = animals[targetAnimalIndex];
            let winner = targetAnimal.name;
            claw.targetX = targetAnimal.x;
            
            // Fumble chances: 17% double fumble, 16% single fumble, 67% no fumble
            // But first claw game of the session always succeeds!
            let fumbleCount = 0;
            if (this.firstClawGame) {
                this.firstClawGame = false; // Mark that we've played once
                fumbleCount = 0; // No fumble on first game
            } else {
                const fumbleRoll = Math.random();
                if (fumbleRoll < 0.16) {
                    fumbleCount = 2; // 16% chance for double fumble
                } else if (fumbleRoll < 0.33) {
                    fumbleCount = 1; // 16% chance for single fumble
                }
            }
            let phase = 0;
            const startTime = Date.now();
            
            const drawClaw = (x, y, open, holding) => {
                ctx.save();
                ctx.translate(x, y);
                
                // Claw arm
                ctx.fillStyle = '#888';
                ctx.fillRect(-8, -50, 16, 50);
                
                // Claw mechanism
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Claw prongs
                const angle = open ? 0.5 : 0.15;
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                
                // Left prong
                ctx.save();
                ctx.rotate(-angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 35);
                ctx.lineTo(-10, 45);
                ctx.stroke();
                ctx.restore();
                
                // Right prong
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 35);
                ctx.lineTo(10, 45);
                ctx.stroke();
                ctx.restore();
                
                ctx.restore();
            };
            
            const drawAnimal = (animal, highlight = false) => {
                ctx.save();
                ctx.translate(animal.x, animal.y);
                
                // Circular background
                ctx.beginPath();
                ctx.arc(0, 0, animal.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = highlight ? '#fff' : animal.color;
                ctx.lineWidth = highlight ? 4 : 3;
                ctx.stroke();
                
                // Emoji
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(animal.emoji, 0, 2);
                
                // Name tag below
                ctx.fillStyle = animal.color;
                ctx.fillRect(-25, animal.radius + 2, 50, 14);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 8px Poppins';
                ctx.fillText(animal.name, 0, animal.radius + 10);
                
                ctx.restore();
            };
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve(null);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                
                // Clear canvas
                ctx.clearRect(0, 0, width, height);
                
                // Draw arcade machine frame
                ctx.fillStyle = '#2d1f3d';
                ctx.fillRect(0, 0, width, 80); // Top
                ctx.fillStyle = '#3d2f4d';
                ctx.fillRect(0, height - 150, width, 150); // Bottom pit
                
                // Glass reflection
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(10, 85, width - 20, height - 240);
                
                // Chute (draw early so it's behind the animals)
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.moveTo(width - 120, 80);
                ctx.lineTo(width - 40, 80);
                ctx.lineTo(width - 60, height - 30);
                ctx.lineTo(width - 100, height - 30);
                ctx.closePath();
                ctx.fill();
                
                // Draw animals in pit
                animals.forEach((animal, i) => {
                    if (animal !== claw.grabbedAnimal) {
                        drawAnimal(animal);
                    }
                });
                
                // Claw movement logic
                const speedFactor = 1 / this.durationMultiplier;
                switch (claw.state) {
                    case 'moving':
                        const moveSpeed = 3 * speedFactor;
                        if (Math.abs(claw.x - claw.targetX) > moveSpeed) {
                            claw.x += claw.targetX > claw.x ? moveSpeed : -moveSpeed;
                        } else {
                            claw.x = claw.targetX;
                            claw.state = 'descending';
                        }
                        break;
                        
                    case 'descending':
                        claw.y += 4 * speedFactor;
                        if (claw.y >= targetAnimal.y - 30) {
                            claw.state = 'grabbing';
                            claw.openAngle = 0.5;
                            setTimeout(() => {
                                claw.openAngle = 0.15;
                                if (fumbleCount > 0) {
                                    fumbleCount--;
                                    setTimeout(() => {
                                        claw.openAngle = 0.5;
                                        claw.state = 'ascending';
                                    }, 300 * this.durationMultiplier);
                                } else {
                                    claw.grabbedAnimal = targetAnimal;
                                    claw.state = 'ascending';
                                }
                            }, 400 * this.durationMultiplier);
                        }
                        break;
                        
                    case 'ascending':
                        claw.y -= 6 * speedFactor;
                        if (claw.grabbedAnimal) {
                            claw.grabbedAnimal.x = claw.x;
                            claw.grabbedAnimal.y = claw.y + 50;
                        }
                        if (claw.y <= 50) {
                            if (claw.grabbedAnimal) {
                                claw.state = 'moveToChute';
                            } else {
                                // Fumbled - pick a new random target from animals!
                                targetAnimalIndex = Math.floor(Math.random() * animals.length);
                                targetAnimal = animals[targetAnimalIndex];
                                winner = targetAnimal.name;
                                claw.targetX = targetAnimal.x;
                                claw.state = 'moving';
                            }
                        }
                        break;
                        
                    case 'moveToChute':
                        const chuteX = width - 80;
                        if (claw.x < chuteX) {
                            claw.x += 4 * speedFactor;
                            claw.grabbedAnimal.x = claw.x;
                        } else {
                            claw.state = 'dropping';
                            claw.openAngle = 0.5;
                            claw.grabbedAnimal.vy = 2 * speedFactor;
                        }
                        break;
                        
                    case 'dropping':
                        if (claw.grabbedAnimal) {
                            claw.grabbedAnimal.vy += 0.5 * speedFactor;
                            claw.grabbedAnimal.y += claw.grabbedAnimal.vy;
                            
                            if (claw.grabbedAnimal.y > height - 50) {
                                claw.state = 'done';
                            }
                        }
                        break;
                }
                
                // Draw grabbed animal
                if (claw.grabbedAnimal) {
                    drawAnimal(claw.grabbedAnimal, true);
                }
                
                // Draw claw
                drawClaw(claw.x, claw.y, claw.openAngle > 0.3, claw.grabbedAnimal !== null);
                
                // Draw claw rail
                ctx.fillStyle = '#444';
                ctx.fillRect(20, 40, width - 40, 8);
                
                if (claw.state !== 'done') {
                    requestAnimationFrame(animate);
                } else {
                    setTimeout(() => resolve(winner), 800);
                }
            };
            
            animate();
        });
    }

    // Race Animation
    runRace() {
        return new Promise(resolve => {
            const canvas = this.raceCanvas;
            const ctx = this.raceCtx;
            const dpr = window.devicePixelRatio || 1;
            
            // Set canvas size
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const width = rect.width;
            const height = rect.height;
            
            // Racing emojis
            const racerEmojis = ['🐎', '🚗', '🐢', '🚀', '🏃', '🐇', '🦊', '🐕', '🚲', '🛵'];
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            // Create racers
            const laneHeight = Math.min(60, (height - 100) / this.names.length);
            const startX = 80;
            const finishX = width - 100;
            const raceDistance = finishX - startX;
            
            // Pre-determine loser (race always picks the loser)
            const pickedIndex = this.getWeightedRandomIndex();
            const isLoserMode = true; // Race always picks the loser
            const picked = this.names[pickedIndex];
            
            // Create racers with individual race profiles
            const racers = this.names.map((name, i) => {
                // Each racer gets a base speed - keep them VERY close together
                const isPicked = i === pickedIndex;
                // In loser mode, picked person is slightly slowest; otherwise slightly fastest
                // Much tighter distribution now - only ~5% speed difference
                let baseSpeed;
                if (isLoserMode) {
                    baseSpeed = isPicked ? 0.38 : 0.40 + Math.random() * 0.03;
                } else {
                    baseSpeed = isPicked ? 0.43 : 0.39 + Math.random() * 0.03;
                }
                
                // Get weight for this racer
                const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
                
                return {
                    name,
                    x: startX,
                    y: 50 + i * laneHeight + laneHeight / 2,
                    progress: 0, // 0 to 1
                    baseSpeed,
                    currentSpeed: 0,
                    emoji: racerEmojis[i % racerEmojis.length],
                    color: colors[i % colors.length],
                    finished: false,
                    finishOrder: 0,
                    weight: weight, // Store weight for drawing
                    // Pre-generate speed variation curve for natural movement
                    speedVariations: Array.from({length: 30}, () => 0.95 + Math.random() * 0.1)
                };
            });
            
            let raceStarted = false;
            let countdown = 3;
            let raceFinished = false;
            let finishCounter = 0;
            const startTime = Date.now();
            const raceDuration = 20000 * this.durationMultiplier; // 20 seconds - longer race
            
            const drawTrack = () => {
                // Sky
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, width, height * 0.6);
                
                // Grass
                ctx.fillStyle = '#228B22';
                ctx.fillRect(0, height * 0.6, width, height * 0.4);
                
                // Track
                ctx.fillStyle = '#d4a574';
                ctx.fillRect(0, 30, width, height - 60);
                
                // Lanes
                racers.forEach((_, i) => {
                    const y = 50 + i * laneHeight;
                    ctx.strokeStyle = '#fff';
                    ctx.setLineDash([10, 10]);
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
                
                // Start line
                ctx.fillStyle = '#fff';
                ctx.fillRect(startX - 5, 30, 10, height - 60);
                
                // Finish line (checkered)
                for (let i = 0; i < Math.ceil((height - 60) / 15); i++) {
                    for (let j = 0; j < 3; j++) {
                        ctx.fillStyle = (i + j) % 2 === 0 ? '#000' : '#fff';
                        ctx.fillRect(finishX + j * 15, 30 + i * 15, 15, 15);
                    }
                }
            };
            
            const drawRacer = (racer) => {
                ctx.save();
                ctx.translate(racer.x, racer.y);
                
                // Draw weight balls behind the racer (if weights enabled and weight > 1)
                if (this.weightsEnabled && racer.weight > 1) {
                    const numBalls = racer.weight - 1;
                    const ballRadius = 8;
                    const chainLength = 15;
                    
                    for (let b = 0; b < numBalls; b++) {
                        const ballX = -30 - (b * (ballRadius * 2 + 5));
                        
                        // Chain
                        ctx.strokeStyle = '#666';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(b === 0 ? -22 : ballX + ballRadius * 2 + 5, 0);
                        ctx.lineTo(ballX + ballRadius, 0);
                        ctx.stroke();
                        
                        // Ball
                        ctx.fillStyle = '#333';
                        ctx.beginPath();
                        ctx.arc(ballX, 0, ballRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        
                        // Weight number on ball
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 9px Poppins';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('W', ballX, 0);
                    }
                }
                
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(0, 15, 20, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Circular background for emoji (makes it more solid/visible)
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = racer.color;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Emoji - some need flipping, some don't
                // Emojis that already face right or are symmetrical: 🚀
                const noFlipEmojis = ['🚀'];
                const shouldFlip = !noFlipEmojis.includes(racer.emoji);
                
                ctx.save();
                if (shouldFlip) {
                    ctx.scale(-1, 1); // Flip horizontally
                }
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(racer.emoji, 0, 0);
                ctx.restore();
                
                // Name tag
                ctx.fillStyle = racer.color;
                ctx.fillRect(-30, -35, 60, 18);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px Poppins';
                ctx.fillText(racer.name, 0, -26);
                
                ctx.restore();
            };
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve(null);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                
                ctx.clearRect(0, 0, width, height);
                drawTrack();
                
                // Countdown
                if (elapsed < 3000) {
                    countdown = 3 - Math.floor(elapsed / 1000);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(0, 0, width, height);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 100px Poppins';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(countdown > 0 ? countdown : 'GO!', width / 2, height / 2);
                    
                    racers.forEach(drawRacer);
                    requestAnimationFrame(animate);
                    return;
                }
                
                if (!raceStarted) {
                    raceStarted = true;
                }
                
                // Calculate race time progress (0 to 1)
                const raceTime = elapsed - 3000;
                const timeProgress = Math.min(1, raceTime / raceDuration);
                
                // Update racer positions
                racers.forEach((racer, i) => {
                    if (racer.finished) return;
                    
                    // Get speed variation based on current progress
                    const variationIndex = Math.floor(racer.progress * 29);
                    const speedVariation = racer.speedVariations[variationIndex];
                    
                    // Calculate target speed with smooth acceleration
                    let targetSpeed = racer.baseSpeed * speedVariation;
                    
                    // Add exciting moments - random surges for non-picked racers
                    if (i !== pickedIndex && Math.random() < 0.02 && timeProgress > 0.3 && timeProgress < 0.85) {
                        targetSpeed *= 1.15; // Occasional surge to create drama
                    }
                    
                    // Picked person gets slight disadvantage only in final stretch
                    if (i === pickedIndex && timeProgress > 0.85) {
                        targetSpeed *= isLoserMode ? 0.92 : 1.08;
                    }
                    
                    // Keep everyone bunched together until final stretch
                    const avgProgress = racers.reduce((sum, r) => sum + r.progress, 0) / racers.length;
                    if (timeProgress < 0.75) {
                        // Rubber-banding: slow down leaders, speed up stragglers
                        if (racer.progress > avgProgress + 0.03) {
                            targetSpeed *= 0.95;
                        } else if (racer.progress < avgProgress - 0.03) {
                            targetSpeed *= 1.05;
                        }
                    }
                    
                    // Smooth speed changes (no sudden jumps)
                    racer.currentSpeed += (targetSpeed - racer.currentSpeed) * 0.08;
                    
                    // Update progress
                    racer.progress += racer.currentSpeed * 0.014; // slightly slower tick
                    racer.progress = Math.min(1, racer.progress);
                    
                    // Update position (smooth, no wobble)
                    racer.x = startX + raceDistance * racer.progress;
                    
                    // Check finish
                    if (racer.progress >= 1 && !racer.finished) {
                        racer.finished = true;
                        finishCounter++;
                        racer.finishOrder = finishCounter;
                        if (!isLoserMode && i === pickedIndex) {
                            raceFinished = true;
                        }
                    }
                });
                
                // In loser mode, check if picked person is last
                if (isLoserMode && !raceFinished) {
                    const finishedCount = racers.filter(r => r.finished).length;
                    const pickedRacer = racers[pickedIndex];
                    // If everyone except picked has finished, or picked is clearly last
                    if (finishedCount === racers.length - 1 && !pickedRacer.finished) {
                        raceFinished = true;
                    }
                }
                
                // Nail-biter finish: only separate them in the final 15% of the race
                if (!raceFinished && timeProgress > 0.85) {
                    const pickedRacer = racers[pickedIndex];
                    racers.forEach((racer, i) => {
                        if (i !== pickedIndex && !racer.finished) {
                            if (isLoserMode) {
                                // In loser mode, others should pull ahead slightly at the very end
                                if (racer.progress < pickedRacer.progress + 0.01 && pickedRacer.progress > 0.85) {
                                    racer.progress += 0.002; // Gentle nudge forward
                                }
                            } else {
                                // In winner mode, others should fall slightly behind at the very end
                                if (racer.progress > pickedRacer.progress - 0.01 && pickedRacer.progress > 0.85) {
                                    racer.progress -= 0.002; // Gentle slowdown
                                }
                            }
                        }
                    });
                }
                
                // Draw racers
                racers.forEach(drawRacer);
                
                // Check if race is done
                if (raceFinished) {
                    // Result banner
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(width / 2 - 150, height / 2 - 50, 300, 100);
                    ctx.strokeStyle = isLoserMode ? '#ff6b6b' : '#ffd700';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(width / 2 - 150, height / 2 - 50, 300, 100);
                    
                    ctx.fillStyle = isLoserMode ? '#ff6b6b' : '#ffd700';
                    ctx.font = 'bold 20px Poppins';
                    ctx.textAlign = 'center';
                    ctx.fillText(isLoserMode ? '🐢 PICKED! 🐢' : '🏆 WINNER! 🏆', width / 2, height / 2 - 20);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 28px Poppins';
                    ctx.fillText(picked, width / 2, height / 2 + 20);
                    
                    setTimeout(() => resolve(picked), 1500);
                    return;
                }
                
                requestAnimationFrame(animate);
            };
            
            animate();
        });
    }

    // Battle Royale Animation
    runBattleRoyale() {
        return new Promise(resolve => {
            const canvas = this.battleCanvas;
            const ctx = this.battleCtx;
            const dpr = window.devicePixelRatio || 1;
            
            // Set canvas size
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const width = rect.width;
            const height = rect.height;
            
            // Pick winner ahead of time
            const winnerIndex = this.getWeightedRandomIndex();
            const winner = this.names[winnerIndex];
            
            // Create contestants
            const cols = Math.ceil(Math.sqrt(this.names.length));
            const rows = Math.ceil(this.names.length / cols);
            const cellWidth = (width - 40) / cols;
            const cellHeight = (height - 100) / rows;
            
            const contestants = this.names.map((name, i) => {
                // Get weight as lives (1-4 lives based on weight)
                const lives = this.weightsEnabled ? (this.weights[i] || 1) : 1;
                
                return {
                    name,
                    x: 20 + (i % cols) * cellWidth + cellWidth / 2,
                    y: 50 + Math.floor(i / cols) * cellHeight + cellHeight / 2,
                    alive: true,
                    opacity: 1,
                    scale: 1,
                    maxLives: lives,
                    lives: lives, // Current lives
                    eliminated: false,
                    eliminationTime: 0,
                    lastHitTime: 0, // Track when last hit for flash effect
                    isWinner: name === winner
                };
            });
            
            let lastHitTime = 0;
            let baseInterval = 600 * this.durationMultiplier;
            const startTime = Date.now();
            
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve(null);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                
                // Clear canvas
                ctx.clearRect(0, 0, width, height);
                
                // Dark background
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, width, height);
                
                // Title
                ctx.fillStyle = '#ff6b6b';
                ctx.font = 'bold 24px Poppins';
                ctx.textAlign = 'center';
                const aliveCount = contestants.filter(c => c.alive).length;
                ctx.fillText(`⚔️ BATTLE ROYALE - ${aliveCount} Remaining ⚔️`, width / 2, 30);
                
                // Process hits - randomly target alive non-winners with equal probability
                const aliveTargets = contestants.filter(c => c.alive && !c.isWinner);
                
                if (aliveTargets.length > 0) {
                    // Speed up as fewer contestants remain
                    const progress = 1 - (aliveTargets.length / (contestants.length - 1));
                    const interval = Math.max(80, baseInterval * (1 - progress * 0.85));
                    
                    if (elapsed - lastHitTime > interval) {
                        // Randomly pick from alive contestants (equal chance for everyone)
                        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                        target.lives--;
                        target.lastHitTime = elapsed;
                        
                        if (target.lives <= 0) {
                            target.alive = false;
                            target.eliminated = true;
                            target.eliminationTime = elapsed;
                        }
                        
                        lastHitTime = elapsed;
                    }
                }
                
                // Draw contestants
                contestants.forEach((c, i) => {
                    if (c.eliminated) {
                        // Fade out and shrink animation
                        const timeSinceElim = elapsed - c.eliminationTime;
                        c.opacity = Math.max(0, 1 - timeSinceElim / 500);
                        c.scale = Math.max(0, 1 - timeSinceElim / 500);
                    }
                    
                    if (c.opacity <= 0) return;
                    
                    ctx.save();
                    ctx.globalAlpha = c.opacity;
                    ctx.translate(c.x, c.y);
                    ctx.scale(c.scale, c.scale);
                    
                    // Flash red when hit
                    const timeSinceHit = elapsed - c.lastHitTime;
                    const isFlashing = timeSinceHit < 200 && c.lastHitTime > 0;
                    
                    // Background box
                    const boxWidth = cellWidth - 10;
                    const boxHeight = cellHeight - 10;
                    
                    if (isFlashing) {
                        ctx.fillStyle = '#ff0000';
                    } else {
                        ctx.fillStyle = c.alive ? colors[i % colors.length] : '#333';
                    }
                    ctx.strokeStyle = c.alive ? '#fff' : '#666';
                    ctx.lineWidth = c.isWinner && aliveCount === 1 ? 4 : 2;
                    
                    // Rounded rectangle
                    const radius = 8;
                    ctx.beginPath();
                    ctx.roundRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, radius);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Draw lives as hearts in top-right corner
                    if (c.alive || c.opacity > 0) {
                        const heartSize = Math.min(12, cellWidth / 8);
                        const heartsX = boxWidth/2 - 4;
                        const heartsY = -boxHeight/2 + 4;
                        
                        ctx.font = `${heartSize}px Arial`;
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'top';
                        
                        // Draw remaining lives as red hearts, lost lives as grey/empty
                        let heartStr = '';
                        for (let h = 0; h < c.maxLives; h++) {
                            if (h < c.lives) {
                                heartStr = '❤️' + heartStr; // Red heart for remaining lives
                            } else {
                                heartStr = '🖤' + heartStr; // Black heart for lost lives
                            }
                        }
                        ctx.fillText(heartStr, heartsX, heartsY);
                    }
                    
                    // Name
                    ctx.fillStyle = c.alive ? '#000' : '#666';
                    ctx.font = `bold ${Math.min(16, cellWidth / 6)}px Poppins`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(c.name, 0, 0);
                    
                    // Strike through if eliminated
                    if (!c.alive && c.opacity > 0) {
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(-boxWidth/2 + 5, 0);
                        ctx.lineTo(boxWidth/2 - 5, 0);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                });
                
                // Check if done - only winner remains alive
                if (aliveCount === 1) {
                    // Draw winner celebration
                    const winnerContestant = contestants.find(c => c.isWinner);
                    
                    ctx.save();
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 30;
                    ctx.fillStyle = '#ffd700';
                    ctx.font = 'bold 28px Poppins';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑 SURVIVOR! 👑', width / 2, height - 40);
                    ctx.restore();
                    
                    setTimeout(() => resolve(winner), 1500);
                    return;
                }
                
                requestAnimationFrame(animate);
            };
            
            animate();
        });
    }

    // Spotlight Animation
    runSpotlight() {
        return new Promise(resolve => {
            const canvas = this.spotlightCanvas;
            const ctx = this.spotlightCtx;
            const dpr = window.devicePixelRatio || 1;
            
            // Set canvas size
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const width = rect.width;
            const height = rect.height;
            
            // Pick winner
            const winnerIndex = this.getWeightedRandomIndex();
            const winner = this.names[winnerIndex];
            
            // Create name positions in a grid
            const cols = Math.ceil(Math.sqrt(this.names.length));
            const rows = Math.ceil(this.names.length / cols);
            const cellWidth = (width - 60) / cols;
            const cellHeight = (height - 80) / rows;
            
            const namePositions = this.names.map((name, i) => {
                // Get weight for font size scaling
                const weight = this.weightsEnabled ? (this.weights[i] || 1) : 1;
                const fontScale = 1 + (weight - 1) * 0.3; // 1.0, 1.3, 1.6, 1.9 for weights 1-4
                
                return {
                    name,
                    x: 30 + (i % cols) * cellWidth + cellWidth / 2,
                    y: 60 + Math.floor(i / cols) * cellHeight + cellHeight / 2,
                    isWinner: name === winner,
                    fontScale: fontScale,
                    weight: weight
                };
            });
            
            // Spotlight state
            let spotlightX = width / 2;
            let spotlightY = height / 2;
            let spotlightRadius = 100;
            
            // Randomize duration (5-9 seconds) and sweep speed
            const sweepDuration = (3000 + Math.random() * 3000) * this.durationMultiplier; // 3-6 seconds sweeping
            const homingDuration = 500 * this.durationMultiplier; // 0.5 seconds homing
            const duration = sweepDuration + homingDuration + 1000 * this.durationMultiplier; // Plus 1s locked
            
            const startTime = Date.now();
            let phase = 'sweeping'; // sweeping, homing, locked
            let homingStart = 0;
            let lockedTime = 0;
            
            // Pre-calculate the winner position
            const winnerPos = namePositions.find(p => p.isWinner);
            
            // Create a smooth sweep path that visits different areas and ends near the winner
            // Randomize the sweep pattern each time
            const sweepPoints = [];
            const numSweeps = 2 + Math.floor(Math.random() * 3); // 2-4 sweeps (varies more)
            
            // Generate random sweep waypoints, with the last one near the winner
            for (let i = 0; i < numSweeps; i++) {
                if (i === numSweeps - 1) {
                    // Last waypoint should be near (but not exactly on) the winner
                    sweepPoints.push({
                        x: winnerPos.x + (Math.random() - 0.5) * 100,
                        y: winnerPos.y + (Math.random() - 0.5) * 50
                    });
                } else {
                    // Random positions across the canvas
                    sweepPoints.push({
                        x: 50 + Math.random() * (width - 100),
                        y: 50 + Math.random() * (height - 100)
                    });
                }
            }
            
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            const animate = () => {
                // Check if animation was cancelled
                if (this.animationCancelled) {
                    resolve(null);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                // Clear canvas
                ctx.clearRect(0, 0, width, height);
                
                // Draw all names (dimmed)
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, width, height);
                
                namePositions.forEach((pos, i) => {
                    ctx.fillStyle = colors[i % colors.length] + '33'; // Very dimmed
                    const fontSize = Math.round(16 * pos.fontScale);
                    ctx.font = `bold ${fontSize}px Poppins`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(pos.name, pos.x, pos.y);
                });
                
                // Update spotlight position based on phase
                if (phase === 'sweeping') {
                    // Sweep through waypoints
                    const sweepProgress = Math.min(1, elapsed / sweepDuration);
                    
                    // Figure out which segment we're in
                    const totalSegments = sweepPoints.length;
                    const segmentProgress = sweepProgress * totalSegments;
                    const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
                    const segmentT = segmentProgress - currentSegment;
                    
                    // Ease the segment transition
                    const easedT = segmentT < 0.5 
                        ? 2 * segmentT * segmentT 
                        : 1 - Math.pow(-2 * segmentT + 2, 2) / 2;
                    
                    // Get start and end points for this segment
                    const startPoint = currentSegment === 0 
                        ? { x: width / 2, y: height / 2 } 
                        : sweepPoints[currentSegment - 1];
                    const endPoint = sweepPoints[currentSegment];
                    
                    // Interpolate position
                    spotlightX = startPoint.x + (endPoint.x - startPoint.x) * easedT;
                    spotlightY = startPoint.y + (endPoint.y - startPoint.y) * easedT;
                    
                    // Transition to homing phase
                    if (elapsed > sweepDuration) {
                        phase = 'homing';
                        homingStart = Date.now();
                    }
                } else if (phase === 'homing') {
                    // Smoothly home in on the winner
                    const homeElapsed = Date.now() - homingStart;
                    const homeProgress = Math.min(1, homeElapsed / homingDuration);
                    
                    // Ease out cubic for smooth deceleration
                    const eased = 1 - Math.pow(1 - homeProgress, 3);
                    
                    // Interpolate from current position to winner
                    const startX = sweepPoints[sweepPoints.length - 1].x;
                    const startY = sweepPoints[sweepPoints.length - 1].y;
                    spotlightX = startX + (winnerPos.x - startX) * eased;
                    spotlightY = startY + (winnerPos.y - startY) * eased;
                    
                    // Shrink spotlight slightly as we focus
                    spotlightRadius = 100 - homeProgress * 30;
                    
                    if (homeElapsed > homingDuration) {
                        phase = 'locked';
                        lockedTime = Date.now();
                    }
                } else if (phase === 'locked') {
                    // Snap to winner and hold
                    spotlightX = winnerPos.x;
                    spotlightY = winnerPos.y;
                    spotlightRadius = 70;
                }
                
                // Create spotlight effect using clipping
                ctx.save();
                
                // Draw spotlight gradient
                const gradient = ctx.createRadialGradient(
                    spotlightX, spotlightY, 0,
                    spotlightX, spotlightY, spotlightRadius * 1.5
                );
                gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                
                ctx.beginPath();
                ctx.arc(spotlightX, spotlightY, spotlightRadius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Draw illuminated names
                namePositions.forEach((pos, i) => {
                    const dist = Math.sqrt(Math.pow(pos.x - spotlightX, 2) + Math.pow(pos.y - spotlightY, 2));
                    // Larger spotlight detection radius for bigger names
                    const detectionRadius = spotlightRadius * (1.2 + (pos.fontScale - 1) * 0.3);
                    if (dist < detectionRadius) {
                        const brightness = 1 - dist / detectionRadius;
                        ctx.fillStyle = colors[i % colors.length];
                        ctx.globalAlpha = brightness;
                        const fontSize = Math.round(18 * pos.fontScale);
                        ctx.font = `bold ${fontSize}px Poppins`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pos.name, pos.x, pos.y);
                        ctx.globalAlpha = 1;
                    }
                });
                
                ctx.restore();
                
                // Draw spotlight beam from top
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.moveTo(width / 2 - 20, 0);
                ctx.lineTo(width / 2 + 20, 0);
                ctx.lineTo(spotlightX + spotlightRadius / 2, spotlightY - spotlightRadius);
                ctx.lineTo(spotlightX - spotlightRadius / 2, spotlightY - spotlightRadius);
                ctx.closePath();
                const beamGradient = ctx.createLinearGradient(width / 2, 0, spotlightX, spotlightY);
                beamGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
                beamGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                ctx.fillStyle = beamGradient;
                ctx.fill();
                ctx.restore();
                
                // Check if done
                if (phase === 'locked' && Date.now() - lockedTime > 1500) {
                    // Final reveal
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(0, 0, width, height);
                    
                    // Winner spotlight
                    const winnerPos = namePositions.find(p => p.isWinner);
                    const finalGradient = ctx.createRadialGradient(
                        winnerPos.x, winnerPos.y, 0,
                        winnerPos.x, winnerPos.y, 100
                    );
                    finalGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                    finalGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                    ctx.beginPath();
                    ctx.arc(winnerPos.x, winnerPos.y, 100, 0, Math.PI * 2);
                    ctx.fillStyle = finalGradient;
                    ctx.fill();
                    
                    ctx.fillStyle = '#ffd700';
                    ctx.font = 'bold 24px Poppins';
                    ctx.textAlign = 'center';
                    ctx.fillText('🔔 ' + winner + ' 🔔', winnerPos.x, winnerPos.y);
                    
                    setTimeout(() => resolve(winner), 1000);
                    return;
                }
                
                requestAnimationFrame(animate);
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
                this.weights.splice(index, 1);
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
        // Reset slot machine position for next spin
        this.resetSlotPosition();
    }

    resetSlotPosition() {
        if (this.names.length > 0) {
            const itemHeight = 100;
            this.slotReel.style.transform = `translateY(-${this.names.length * itemHeight}px)`;
            // Remove stopped state and center highlight
            const slotWindow = this.slotReel.parentElement;
            if (slotWindow) {
                slotWindow.classList.remove('stopped');
            }
            this.slotReel.querySelectorAll('.slot-name').forEach(el => el.classList.remove('center'));
        }
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
