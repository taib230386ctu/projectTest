document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // VIDEO + NAVBAR
    // =========================================================
    const video = document.getElementById("myVideo");
    const btn = document.querySelector(".play-btn");
    const navbar = document.querySelector(".navbar");
    const videoWrapper = document.querySelector(".video-wrapper");
    let isFullscreen = false;

    function hideNavbar() {
        if (navbar) navbar.classList.add("hide");
    }

    function showNavbar() {
        if (navbar) navbar.classList.remove("hide");
    }

    function hidePlayButton() {
        if (btn) btn.style.display = "none";
    }

    function showPlayButton() {
        if (btn) btn.style.display = "flex";
    }

    // =========================================================
    // PLAY VIDEO + SCROLL
    // =========================================================
    function startVideo() {
        if (!video) return;
        video.play().catch(()=>{});
    }

    // =========================================================
    // NÚT PLAY CUSTOM
    // =========================================================
    if (btn && video) {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            startVideo();
        });
    }

    // =========================================================
    // CLICK VIDEO
    // =========================================================
    if (video) {
        video.addEventListener("click", (e) => {
            const rect = video.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            // bỏ qua thanh controls dưới video
            if (clickY > video.clientHeight - 70) {
                return;
            }
            if (video.paused) {
                startVideo();
            }
        });

        // Khi video chạy
        video.addEventListener("play", () => {
            hideNavbar();
            hidePlayButton();
        });

        // Khi video dừng
        video.addEventListener("pause", () => {
            if (!isFullscreen) {
                showNavbar();
                showPlayButton();
            }
        });

        // Video hết
        video.addEventListener("ended", () => {
            showNavbar();
            showPlayButton();
        });
    }

    // =========================================================
    // FULLSCREEN (ĐÃ SỬA LỖI KHÔNG HIỆN NÚT KHI THOÁT)
    // =========================================================
    document.addEventListener("fullscreenchange", () => {
        isFullscreen = !!document.fullscreenElement;
        
        if (isFullscreen) {
            // Khi vào toàn màn hình: Ẩn tất cả cho gọn
            hideNavbar();
            hidePlayButton();
        } else {
            // Khi THOÁT toàn màn hình:
            if (video) {
                if (video.paused) {
                    // LỖI CŨ Ở ĐÂY: Nếu video đang tạm dừng, phải hiện lại thanh điều hướng và nút phát
                    showNavbar();
                    showPlayButton();
                } else {
                    // Nếu video vẫn đang chạy thì tiếp tục ẩn đi
                    hideNavbar();
                    hidePlayButton();
                }
            }
        }
    });

    // =========================================================
    // TỰ PAUSE KHI SCROLL KHỎI VIDEO
    // =========================================================
    if (videoWrapper && video) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !video.paused && !isFullscreen) {
                    video.pause();
                    showNavbar();
                }
            });
        }, {
            threshold: 0.2
        });
        observer.observe(videoWrapper);
    }

    // =========================================================
    // SLIDESHOW FADE
    // =========================================================
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');

    function showSlides() {
        slides.forEach(slide => {
            slide.style.opacity = 0;
        });
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].style.opacity = 1;
    }

    if (slides.length > 0) {
        slides[0].style.opacity = 1;
        setInterval(showSlides, 6000);
    }

    // =========================================================
    // SLIDESHOW CAROUSEL
    // =========================================================
    let index2n1d = 0;
    const slides2n1d = document.querySelectorAll('.slide-2n1d');

    function autoSlide2n1d() {
        if (slides2n1d.length <= 1) return;
        slides2n1d[index2n1d].classList.remove('active');
        slides2n1d[index2n1d].classList.add('exit');
        index2n1d = (index2n1d + 1) % slides2n1d.length;
        slides2n1d[index2n1d].classList.remove('exit');
        slides2n1d[index2n1d].classList.add('active');
        setTimeout(() => {
            slides2n1d.forEach(s => {
                s.classList.remove('exit');
            });
        }, 5000);
    }

    if (slides2n1d.length > 0) {
        slides2n1d[0].classList.add('active');
        setInterval(autoSlide2n1d, 5000);
    }
});
