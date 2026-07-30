document.addEventListener('DOMContentLoaded', () => {
    // 1. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const hoverElements = document.querySelectorAll('a, .project-card, .logo');

    // Only apply custom cursor on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hovered');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hovered');
            });
        });
    }

    // 2. Scroll Reveal Animations (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal-up');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    };

    const revealOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Flicker Animation Logic
    const flickerSection = document.querySelector('.flicker-section');
    const flickerItems = document.querySelectorAll('.flicker-item');
    const flickerFinal = document.querySelector('.flicker-final');
    
    if (flickerSection && flickerItems.length > 0 && flickerFinal) {
        let currentIndex = 0;
        let flickerInterval = null;
        let loopTimeout = null;
        const frameDuration = 180; // ms per brand
        
        let audioCtx;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        function playNoise() {
            if (!audioCtx) return;
            const bufferSize = audioCtx.sampleRate * 0.05; // 50ms
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
            
            noise.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start();
        }

        function playPopSound() {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine'; // clean tone
            // Drop frequency rapidly to create a "pop"
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
            
            // Envelope for quick fade out
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }

        function stopFlicker() {
            if (flickerInterval) clearInterval(flickerInterval);
            if (loopTimeout) clearTimeout(loopTimeout);
            flickerItems.forEach(el => el.classList.remove('active'));
            flickerFinal.classList.remove('active');
            currentIndex = 0;
            flickerSection.classList.remove('is-playing');
        }

        function playFlicker() {
            // Reset
            flickerItems.forEach(el => el.classList.remove('active'));
            flickerFinal.classList.remove('active');
            currentIndex = 0;
            flickerSection.classList.add('is-playing');
            
            flickerInterval = setInterval(() => {
                if (currentIndex > 0) {
                    flickerItems[currentIndex - 1].classList.remove('active');
                }
                
                if (currentIndex < flickerItems.length) {
                    flickerItems[currentIndex].classList.add('active');
                    playNoise();
                    currentIndex++;
                } else {
                    clearInterval(flickerInterval);
                    // Show final massive JR icon and play pop sound
                    flickerFinal.classList.add('active');
                    playPopSound();
                    
                    // Wait, then loop
                    loopTimeout = setTimeout(() => {
                        flickerFinal.classList.remove('active');
                        loopTimeout = setTimeout(playFlicker, 500); // short pause before looping
                    }, 2000); // duration of the JR pop out
                }
            }, frameDuration);
        }
        
        // Hover events
        flickerSection.addEventListener('mouseenter', () => {
            initAudio();
            stopFlicker();
            playFlicker();
        });
        
        flickerSection.addEventListener('mouseleave', () => {
            stopFlicker();
        });
        
        // For mobile (touch), start on touch
        flickerSection.addEventListener('touchstart', (e) => {
            initAudio();
            if(!flickerSection.classList.contains('is-playing')){
                playFlicker();
            }
        });
    }

    // 4. How I Work Slider Logic
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        const slides = sliderContainer.querySelectorAll('.slide');
        const prevBtn = sliderContainer.querySelector('.prev-btn');
        const nextBtn = sliderContainer.querySelector('.next-btn');
        const dotsContainer = sliderContainer.querySelector('.slider-dots');
        let currentSlide = 0;

        // Create dots
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.dot');

        function goToSlide(index) {
            if (index === currentSlide) return;
            
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            // Determine exit direction
            if (index > currentSlide) {
                slides[currentSlide].classList.add('exiting-left');
                slides[currentSlide].classList.remove('exiting-right');
            } else {
                slides[currentSlide].classList.add('exiting-right');
                slides[currentSlide].classList.remove('exiting-left');
            }
            
            // Set enter direction for new slide (remove exit classes)
            slides[index].classList.remove('exiting-left', 'exiting-right');

            currentSlide = index;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        prevBtn.addEventListener('click', () => {
            let nextIndex = currentSlide - 1;
            if (nextIndex < 0) nextIndex = slides.length - 1;
            goToSlide(nextIndex);
        });

        nextBtn.addEventListener('click', () => {
            let nextIndex = currentSlide + 1;
            if (nextIndex >= slides.length) nextIndex = 0;
            goToSlide(nextIndex);
        });
    }
});

