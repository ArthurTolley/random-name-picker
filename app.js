// Random Name Picker - Main Application

class RandomNamePicker {
    constructor() {
        this.names = [];
        this.currentAnimation = 'wheel';
        this.isSpinning = false;
        this.firstClawGame = true; // First claw game of the session always succeeds
        
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
            'Sergi', 'Tanmaya', 'Tessa', 'Xan'
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
            ctx.fillText(name, radius - 25, 0);
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
            
            // Create animals with names - arrange in two neat rows
            const pitWidth = width - 160; // Leave space for chute on right
            const animalSize = 55; // Width each animal takes up
            const maxPerRow = Math.floor(pitWidth / animalSize);
            
            // Split into two rows if needed
            const totalAnimals = this.names.length;
            let row1Count, row2Count;
            if (totalAnimals <= maxPerRow) {
                // Single row
                row1Count = totalAnimals;
                row2Count = 0;
            } else {
                // Two rows - split evenly
                row1Count = Math.ceil(totalAnimals / 2);
                row2Count = totalAnimals - row1Count;
            }
            
            const animals = this.names.map((name, i) => {
                let x, y;
                if (i < row1Count) {
                    // First row (front/bottom)
                    const rowSpacing = pitWidth / row1Count;
                    x = 40 + i * rowSpacing + rowSpacing / 2;
                    y = height - 70;
                } else {
                    // Second row (back/top)
                    const rowIndex = i - row1Count;
                    const rowSpacing = pitWidth / row2Count;
                    x = 40 + rowIndex * rowSpacing + rowSpacing / 2;
                    y = height - 125;
                }
                
                return {
                    name,
                    x,
                    y,
                    radius: 25,
                    emoji: animalEmojis[i % animalEmojis.length],
                    color: colors[i % colors.length],
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
            
            // Pick winner (may change if fumble happens)
            let winnerIndex = Math.floor(Math.random() * this.names.length);
            let winner = this.names[winnerIndex];
            let targetAnimal = animals[winnerIndex];
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
                switch (claw.state) {
                    case 'moving':
                        const moveSpeed = 3;
                        if (Math.abs(claw.x - claw.targetX) > moveSpeed) {
                            claw.x += claw.targetX > claw.x ? moveSpeed : -moveSpeed;
                        } else {
                            claw.x = claw.targetX;
                            claw.state = 'descending';
                        }
                        break;
                        
                    case 'descending':
                        claw.y += 4;
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
                                    }, 300);
                                } else {
                                    claw.grabbedAnimal = targetAnimal;
                                    claw.state = 'ascending';
                                }
                            }, 400);
                        }
                        break;
                        
                    case 'ascending':
                        claw.y -= 6;
                        if (claw.grabbedAnimal) {
                            claw.grabbedAnimal.x = claw.x;
                            claw.grabbedAnimal.y = claw.y + 50;
                        }
                        if (claw.y <= 50) {
                            if (claw.grabbedAnimal) {
                                claw.state = 'moveToChute';
                            } else {
                                // Fumbled - pick a new random target!
                                winnerIndex = Math.floor(Math.random() * this.names.length);
                                winner = this.names[winnerIndex];
                                targetAnimal = animals[winnerIndex];
                                claw.targetX = targetAnimal.x;
                                claw.state = 'moving';
                            }
                        }
                        break;
                        
                    case 'moveToChute':
                        const chuteX = width - 80;
                        if (claw.x < chuteX) {
                            claw.x += 4;
                            claw.grabbedAnimal.x = claw.x;
                        } else {
                            claw.state = 'dropping';
                            claw.openAngle = 0.5;
                            claw.grabbedAnimal.vy = 2;
                        }
                        break;
                        
                    case 'dropping':
                        if (claw.grabbedAnimal) {
                            claw.grabbedAnimal.vy += 0.5;
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
            const pickedIndex = Math.floor(Math.random() * this.names.length);
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
                    // Pre-generate speed variation curve for natural movement
                    speedVariations: Array.from({length: 30}, () => 0.95 + Math.random() * 0.1)
                };
            });
            
            let raceStarted = false;
            let countdown = 3;
            let raceFinished = false;
            let finishCounter = 0;
            const startTime = Date.now();
            const raceDuration = 20000; // 20 seconds - longer race
            
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
            const winnerIndex = Math.floor(Math.random() * this.names.length);
            const winner = this.names[winnerIndex];
            
            // Create contestants
            const cols = Math.ceil(Math.sqrt(this.names.length));
            const rows = Math.ceil(this.names.length / cols);
            const cellWidth = (width - 40) / cols;
            const cellHeight = (height - 100) / rows;
            
            const contestants = this.names.map((name, i) => ({
                name,
                x: 20 + (i % cols) * cellWidth + cellWidth / 2,
                y: 50 + Math.floor(i / cols) * cellHeight + cellHeight / 2,
                alive: true,
                opacity: 1,
                scale: 1,
                eliminated: false,
                eliminationTime: 0,
                isWinner: name === winner
            }));
            
            // Create elimination order (winner is never eliminated)
            const eliminationOrder = contestants
                .filter(c => !c.isWinner)
                .sort(() => Math.random() - 0.5);
            
            let eliminationIndex = 0;
            let lastEliminationTime = 0;
            let baseInterval = 800; // Start slower
            const startTime = Date.now();
            
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            const animate = () => {
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
                
                // Eliminate contestants with accelerating speed
                if (eliminationIndex < eliminationOrder.length) {
                    // Speed up as we go
                    const progress = eliminationIndex / eliminationOrder.length;
                    const interval = Math.max(100, baseInterval * (1 - progress * 0.9));
                    
                    if (elapsed - lastEliminationTime > interval) {
                        eliminationOrder[eliminationIndex].alive = false;
                        eliminationOrder[eliminationIndex].eliminated = true;
                        eliminationOrder[eliminationIndex].eliminationTime = elapsed;
                        eliminationIndex++;
                        lastEliminationTime = elapsed;
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
                    
                    // Background box
                    const boxWidth = cellWidth - 10;
                    const boxHeight = cellHeight - 10;
                    ctx.fillStyle = c.alive ? colors[i % colors.length] : '#333';
                    ctx.strokeStyle = c.alive ? '#fff' : '#666';
                    ctx.lineWidth = c.isWinner && aliveCount === 1 ? 4 : 2;
                    
                    // Rounded rectangle
                    const radius = 8;
                    ctx.beginPath();
                    ctx.roundRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, radius);
                    ctx.fill();
                    ctx.stroke();
                    
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
                
                // Check if done
                if (aliveCount === 1 && eliminationIndex >= eliminationOrder.length) {
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
            const winnerIndex = Math.floor(Math.random() * this.names.length);
            const winner = this.names[winnerIndex];
            
            // Create name positions in a grid
            const cols = Math.ceil(Math.sqrt(this.names.length));
            const rows = Math.ceil(this.names.length / cols);
            const cellWidth = (width - 60) / cols;
            const cellHeight = (height - 80) / rows;
            
            const namePositions = this.names.map((name, i) => ({
                name,
                x: 30 + (i % cols) * cellWidth + cellWidth / 2,
                y: 60 + Math.floor(i / cols) * cellHeight + cellHeight / 2,
                isWinner: name === winner
            }));
            
            // Spotlight state
            let spotlightX = width / 2;
            let spotlightY = height / 2;
            let targetX = width / 2;
            let targetY = height / 2;
            let spotlightRadius = 80;
            
            const duration = 8000; // 8 seconds total
            const startTime = Date.now();
            let phase = 'searching'; // searching, narrowing, locked
            let narrowingStart = 0;
            let lockedTime = 0;
            
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'];
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                // Clear canvas
                ctx.clearRect(0, 0, width, height);
                
                // Draw all names (dimmed)
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, width, height);
                
                namePositions.forEach((pos, i) => {
                    ctx.fillStyle = colors[i % colors.length] + '33'; // Very dimmed
                    ctx.font = 'bold 16px Poppins';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(pos.name, pos.x, pos.y);
                });
                
                // Update spotlight position based on phase
                if (phase === 'searching') {
                    // Erratic movement - pick random targets
                    if (Math.random() < 0.05 || (targetX === spotlightX && targetY === spotlightY)) {
                        const randomPos = namePositions[Math.floor(Math.random() * namePositions.length)];
                        targetX = randomPos.x;
                        targetY = randomPos.y;
                    }
                    
                    // Move towards target with some wobble
                    const speed = 0.08;
                    spotlightX += (targetX - spotlightX) * speed + (Math.random() - 0.5) * 10;
                    spotlightY += (targetY - spotlightY) * speed + (Math.random() - 0.5) * 10;
                    
                    // Keep in bounds
                    spotlightX = Math.max(50, Math.min(width - 50, spotlightX));
                    spotlightY = Math.max(50, Math.min(height - 50, spotlightY));
                    
                    // Transition to narrowing phase
                    if (progress > 0.7) {
                        phase = 'narrowing';
                        narrowingStart = Date.now();
                        // Find winner position
                        const winnerPos = namePositions.find(p => p.isWinner);
                        targetX = winnerPos.x;
                        targetY = winnerPos.y;
                    }
                } else if (phase === 'narrowing') {
                    // Slow down and sweep between two names before locking
                    const narrowElapsed = Date.now() - narrowingStart;
                    const winnerPos = namePositions.find(p => p.isWinner);
                    
                    // Oscillate near winner
                    const oscillation = Math.sin(narrowElapsed / 200) * 100 * Math.max(0, 1 - narrowElapsed / 2000);
                    targetX = winnerPos.x + oscillation;
                    targetY = winnerPos.y;
                    
                    spotlightX += (targetX - spotlightX) * 0.1;
                    spotlightY += (targetY - spotlightY) * 0.1;
                    
                    // Shrink spotlight
                    spotlightRadius = Math.max(50, 80 - narrowElapsed / 50);
                    
                    if (narrowElapsed > 2000) {
                        phase = 'locked';
                        lockedTime = Date.now();
                        targetX = winnerPos.x;
                        targetY = winnerPos.y;
                    }
                } else if (phase === 'locked') {
                    // Lock onto winner
                    const winnerPos = namePositions.find(p => p.isWinner);
                    spotlightX += (winnerPos.x - spotlightX) * 0.3;
                    spotlightY += (winnerPos.y - spotlightY) * 0.3;
                    spotlightRadius = 60;
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
                    if (dist < spotlightRadius * 1.2) {
                        const brightness = 1 - dist / (spotlightRadius * 1.2);
                        ctx.fillStyle = colors[i % colors.length];
                        ctx.globalAlpha = brightness;
                        ctx.font = 'bold 18px Poppins';
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
