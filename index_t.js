document.addEventListener('DOMContentLoaded', function() {
    // 1. Tìm các phần tử trong khối video pk2
    const wrapper = document.querySelector('.video-wrapper');
    
    // Nếu trang web có khối video này thì mới chạy tiếp (tránh lỗi ở các trang khác)
    if (wrapper) {
        const video = wrapper.querySelector('.responsive-video');
        const playBtn = wrapper.querySelector('.play-btn');

        // 2. Hàm xử lý Bật / Tắt video
        function togglePlay() {
            if (video.paused) {
                video.play();
                playBtn.style.opacity = '0';          // Ẩn nút khi video đang phát
                playBtn.style.pointerEvents = 'none';   // Vô hiệu hóa nút để click được vào video bên dưới
            } else {
                video.pause();
                playBtn.style.opacity = '1';          // Hiện lại nút khi video dừng
                playBtn.style.pointerEvents = 'auto';   // Kích hoạt lại nút để bấm được
            }
        }

        // 3. Lắng nghe sự kiện click (Bấm nút hay bấm vào video đều chạy)
        playBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);
    }
});
