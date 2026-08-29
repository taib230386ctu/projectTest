document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');
    const btnSubmit = document.getElementById('btnSubmit');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async function (e) {
        // 1. Chặn chuyển hướng trang mặc định của Formspree
        e.preventDefault();

        const FORMSPREE_URL = 'https://formspree.io/f/mzebzgyp';

        // 2. Hiệu ứng nút khi đang gửi
        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        btnSubmit.disabled = true;

        try {
            // 3. Lấy dữ liệu từ form
            const formData = new FormData(contactForm);

            // 4. Gửi dữ liệu ngầm bằng fetch API
            const response = await fetch(FORMSPREE_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Hiển thị thông báo SweetAlert2 chuẩn phong cách Phá Kén
                Swal.fire({
                    title: 'Đã gửi thông điệp! 🌱',
                    text: 'Cảm ơn bạn đã chia sẻ. Kén sẽ phản hồi bạn trong thời gian sớm nhất nhé!',
                    icon: 'success',
                    confirmButtonText: 'Đồng ý',
                    confirmButtonColor: '#164092'
                });

                contactForm.reset(); // Xóa dữ liệu các ô nhập liệu
            } else {
                throw new Error('Gửi dữ liệu thất bại');
            }
        } catch (error) {
            console.error('Lỗi khi gửi mail:', error);
            Swal.fire({
                title: 'Có lỗi xảy ra!',
                text: 'Không thể gửi thông điệp lúc này. Bạn vui lòng kiểm tra kết nối và thử lại sau nhé!',
                icon: 'error',
                confirmButtonText: 'Đóng',
                confirmButtonColor: '#164092'
            });
        } finally {
            // Phục hồi lại nút bấm ban đầu
            btnSubmit.innerHTML = originalBtnText;
            btnSubmit.disabled = false;
        }
    });
});