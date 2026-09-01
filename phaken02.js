document.addEventListener('DOMContentLoaded', function(){
    const navbar = document.querySelector(".navbar");
    const wrapper = document.querySelector(".video-wrapper");

    if(!wrapper) return;

    const video = wrapper.querySelector(".responsive-video");
    const playBtn = wrapper.querySelector(".play-btn");
    let isFullscreen = false;

    function hideNavbar(){
        if(navbar){
            navbar.classList.add("hide");
        }
    }

    function showNavbar(){
        if(navbar){
            navbar.classList.remove("hide");
        }
    }

    function hidePlayBtn(){
        if(playBtn){
            playBtn.style.opacity="0";
            playBtn.style.pointerEvents="none";
        }
    }

    function showPlayBtn(){
        if(playBtn){
            playBtn.style.opacity="1";
            playBtn.style.pointerEvents="auto";
        }
    }

    // ==========================
    // PLAY VIDEO
    // ==========================
    function startVideo() {
        if (!video) return;
        video.play().catch(()=>{});
    }

    // Nút play giữa video
    if(playBtn){
        playBtn.addEventListener("click",(e)=>{
            e.stopPropagation();
            startVideo();
        });
    }

    // Click vào video nhưng bỏ qua controls
    if(video) {
        video.addEventListener("click",(e)=>{
            const rect = video.getBoundingClientRect();
            const y = e.clientY - rect.top;
            // vùng thanh controls dưới video
            if(y > video.clientHeight - 70){
                return;
            }
            if(video.paused){
                startVideo();
            }
        });

        // ==========================
        // VIDEO EVENT
        // ==========================
        video.addEventListener("play",()=>{
            hideNavbar();
            hidePlayBtn();
        });

        video.addEventListener("pause",()=>{
            // SỬA TẠI ĐÂY: Dù fullscreen hay không, cứ hễ dừng video là phải hiện nút Play
            showPlayBtn();
            
            // Chỉ hiện lại Navbar nếu đang ở màn hình thường (tránh đè lên video khi fullscreen)
            if(!isFullscreen){
                showNavbar();
            }
        });

        video.addEventListener("ended",()=>{
            showPlayBtn();
            showNavbar();
        });
    }

    // ==========================
    // FULLSCREEN (ĐÃ SỬA LỖI ĐỒNG BỘ)
    // ==========================
    document.addEventListener("fullscreenchange",()=>{
        isFullscreen = !!document.fullscreenElement;
        
        if(isFullscreen){
            // Khi vào Fullscreen: Ẩn navbar. Nếu đang chạy thì ẩn nút, đang dừng thì hiện nút.
            hideNavbar();
            if(!video.paused){
                hidePlayBtn();
            } else {
                showPlayBtn();
            }
        }
        else{
            // SỬA TẠI ĐÂY: Khi THOÁT Fullscreen
            if(video){
                if(video.paused){
                    // Nếu video đang dừng lúc thoát Fullscreen -> Hiện cả hai
                    showNavbar();
                    showPlayBtn();
                } else {
                    // Nếu video vẫn đang chạy -> Ẩn cả hai
                    hideNavbar();
                    hidePlayBtn();
                }
            }
        }
    });

    // ==========================
    // AUTO PAUSE KHI RỜI VIDEO
    // ==========================
    if(video) {
        const observer = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(
                    !entry.isIntersecting &&
                    !video.paused &&
                    !isFullscreen
                ){
                    video.pause();
                    showNavbar();
                }
            });
        },{
            threshold:0.3
        });

        observer.observe(wrapper);
    }
});
