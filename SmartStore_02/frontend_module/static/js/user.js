/**
 * SmartStore User JavaScript
 * 用户登录、会员中心和支付相关功能
 */

class UserManager {
    constructor() {
        this.isFaceLoginActive = false;
        this.cameraStream = null;
        this.init();
    }

    init() {
        this.initLoginForm();
        this.initFaceLogin();
        this.initPaymentMethods();
        this.initMemberCenter();
        this.initModals();
    }

    /* Login Form */
    initLoginForm() {
        const loginForm = document.getElementById('traditional-login-form');
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTraditionalLogin(e);
            });
        }

        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                togglePassword.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
        }

        // Quick login buttons
        this.initQuickLogin();
    }

    async handleTraditionalLogin(e) {
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            smartStore.showToast('请填写用户名和密码', 'warning');
            return;
        }

        try {
            smartStore.showLoading();
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, method: 'password' })
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                const userData = data.user;
                smartStore.login(userData);
                smartStore.showToast('登录成功！', 'success');
                setTimeout(() => {
                    window.location.href = '/user/member_center';
                }, 800);
            } else {
                smartStore.showToast(data.message || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            smartStore.showToast('网络异常，请稍后再试', 'error');
        } finally {
            smartStore.hideLoading();
        }
    }

    /* Face Recognition Login */
    initFaceLogin() {
        const startFaceLoginBtn = document.getElementById('start-face-login');
        const registerFaceBtn = document.getElementById('register-face');
        const cameraFeed = document.getElementById('camera-feed');
        const statusText = document.getElementById('status-text');

        if (startFaceLoginBtn) {
            startFaceLoginBtn.addEventListener('click', () => {
                this.startFaceLogin();
            });
        }

        if (registerFaceBtn) {
            registerFaceBtn.addEventListener('click', () => {
                this.showFaceRegistration();
            });
        }
    }

    async startFaceLogin() {
        const cameraFeed = document.getElementById('camera-feed');
        const statusText = document.getElementById('status-text');
        const scanOverlay = document.getElementById('scan-overlay');

        if (!cameraFeed || !statusText) return;

        try {
            // Request camera access
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });

            cameraFeed.srcObject = this.cameraStream;
            cameraFeed.classList.remove('hidden');
            scanOverlay.style.display = 'none';

            statusText.textContent = '正在识别面部特征...';

            // Simulate face recognition process
            await this.simulateFaceRecognition();

        } catch (error) {
            console.error('Face login error:', error);
            statusText.textContent = '无法访问摄像头，请检查权限设置';
            smartStore.showToast('摄像头访问失败，请使用传统登录方式', 'warning');
        }
    }

    async simulateFaceRecognition() {
        const statusText = document.getElementById('status-text');
        const scanFrame = document.querySelector('.scan-frame');

        // Animate scan frame
        if (scanFrame) {
            anime({
                targets: scanFrame,
                scale: [1, 1.1, 1],
                duration: 2000,
                easing: 'easeInOutSine',
                loop: true
            });
        }

        // Simulate recognition steps
        const steps = [
            '正在检测面部...',
            '提取面部特征...',
            '匹配用户信息...',
            '验证身份...'
        ];

        for (let i = 0; i < steps.length; i++) {
            statusText.textContent = steps[i];
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Simulate success/failure
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
            statusText.textContent = '识别成功！正在登录...';
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.completeFaceLogin();
        } else {
            statusText.textContent = '识别失败，请重试或使用传统登录';
            this.stopCamera();
        }
    }

    async completeFaceLogin() {
        try {
            smartStore.showLoading();
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'face' })
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                const userData = data.user;
                smartStore.login(userData);
                smartStore.showToast('人脸登录成功！', 'success');
                this.stopCamera();
                setTimeout(() => {
                    window.location.href = '/user/member_center';
                }, 800);
            } else {
                this.stopCamera();
                smartStore.showToast(data.message || '人脸登录失败，请重试', 'error');
            }
        } catch (error) {
            console.error('Face login completion error:', error);
            this.stopCamera();
            smartStore.showToast('网络异常，请稍后再试', 'error');
        } finally {
            smartStore.hideLoading();
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }

        const cameraFeed = document.getElementById('camera-feed');
        const scanOverlay = document.getElementById('scan-overlay');
        const statusText = document.getElementById('status-text');

        if (cameraFeed) {
            cameraFeed.classList.add('hidden');
        }
        if (scanOverlay) {
            scanOverlay.style.display = 'flex';
        }
        if (statusText) {
            statusText.textContent = '点击开始人脸识别';
        }
    }

    showFaceRegistration() {
        smartStore.openModal('face-registration-modal');
        this.initFaceRegistration();
    }

    initFaceRegistration() {
            const completeBtn = document.getElementById('complete-registration');
            const cancelBtn = document.getElementById('cancel-registration');
            const captureBtn = document.getElementById('capture-face');
            const cameraVideo = document.getElementById('face-registration-camera');
            const canvas = document.getElementById('face-registration-canvas');
            const previewImg = document.getElementById('face-registration-preview');
            const statusSpan = document.getElementById('face-capture-status');

            // 摄像头预览
            if (cameraVideo) {
                navigator.mediaDevices.getUserMedia({ video: { width: 240, height: 180, facingMode: 'user' } })
                    .then(stream => {
                        cameraVideo.srcObject = stream;
                        cameraVideo.classList.remove('hidden');
                    })
                    .catch(() => {
                        statusSpan.textContent = '无法访问摄像头';
                        statusSpan.classList.add('text-red-600');
                    });
            }

            // 采集人脸
            if (captureBtn && cameraVideo && canvas && previewImg && completeBtn) {
                captureBtn.addEventListener('click', () => {
                    canvas.getContext('2d').drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
                    const imgData = canvas.toDataURL('image/png');
                    previewImg.src = imgData;
                    previewImg.classList.remove('hidden');
                    statusSpan.textContent = '人脸已采集';
                    statusSpan.classList.remove('text-red-600');
                    statusSpan.classList.add('text-green-600');
                    completeBtn.disabled = false;
                    // 存储采集数据
                    this.faceRegistrationData = imgData;
                });
            }

            // 完成注册
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.completeFaceRegistration();
                });
            }

            // 取消注册
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    // 关闭摄像头
                    if (cameraVideo && cameraVideo.srcObject) {
                        cameraVideo.srcObject.getTracks().forEach(track => track.stop());
                    }
                    smartStore.closeModal('face-registration-modal');
                });
            }
    }

    async completeFaceRegistration() {
        smartStore.showLoading();
        try {
            // 获取当前用户ID
            const user = smartStore.getUser();
            if (!user || !user.id) {
                smartStore.hideLoading();
                smartStore.showToast('请先登录后再进行人脸注册', 'warning');
                return;
            }
            // 获取采集到的人脸图片数据
            const faceImage = this.faceRegistrationData;
            if (!faceImage) {
                smartStore.hideLoading();
                smartStore.showToast('请先采集人脸信息', 'warning');
                return;
            }
            // 发送图片数据到后端
            const resp = await fetch('/api/face/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, faceImage })
            });
            const data = await resp.json();
            smartStore.hideLoading();
            if (resp.ok && data.success) {
                smartStore.showToast('人脸信息注册成功！', 'success');
                // 关闭摄像头
                const cameraVideo = document.getElementById('face-registration-camera');
                if (cameraVideo && cameraVideo.srcObject) {
                    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                smartStore.closeModal('face-registration-modal');
            } else {
                smartStore.showToast(data.message || '注册失败，请重试', 'error');
            }
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('注册失败，请重试', 'error');
        }
    }

    /* Quick Login Methods */
    initQuickLogin() {
        const qrLoginBtn = document.getElementById('qr-login');
        const smsLoginBtn = document.getElementById('sms-login');
        const wechatLoginBtn = document.getElementById('wechat-login');

        if (qrLoginBtn) {
            qrLoginBtn.addEventListener('click', () => this.showQRLogin());
        }

        if (smsLoginBtn) {
            smsLoginBtn.addEventListener('click', () => this.showSMSLogin());
        }

        if (wechatLoginBtn) {
            wechatLoginBtn.addEventListener('click', () => this.showWeChatLogin());
        }
    }

    showQRLogin() {
        smartStore.openModal('qr-modal');
        this.generateQRCode();
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            // Mock QR code generation
            qrContainer.innerHTML = `
                <div class="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                        <i class="fas fa-qrcode text-4xl text-gray-600 mb-2"></i>
                        <p class="text-xs text-gray-600">扫码登录</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">请使用SmartStore APP扫码</p>
            `;

            // Simulate QR code scan after 5 seconds
            setTimeout(() => {
                smartStore.showToast('二维码已扫描，正在登录...', 'info');
                setTimeout(() => {
                    smartStore.closeModal('qr-modal');
                    this.handleQRLoginSuccess();
                }, 2000);
            }, 5000);
        }
    }

    async handleQRLoginSuccess() {
        try {
            const userData = {
                id: '3',
                username: 'qr_user',
                email: 'qr@example.com',
                phone: '137****7777',
                avatar: 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=扫码',
                points: 890,
                level: '普通会员',
                joinDate: '2024-01-10'
            };

            smartStore.login(userData);
            smartStore.showToast('扫码登录成功！', 'success');
            
            setTimeout(() => {
                window.location.href = '/user/member_center';
            }, 1000);
            
        } catch (error) {
            smartStore.showToast('扫码登录失败', 'error');
        }
    }

    showSMSLogin() {
        smartStore.showToast('短信登录功能开发中...', 'info');
    }

    showWeChatLogin() {
        smartStore.showToast('微信登录功能开发中...', 'info');
    }

    /* Payment Methods */
    initPaymentMethods() {
        const paymentMethods = document.querySelectorAll('.payment-method');
        const proceedBtn = document.getElementById('proceed-payment');

        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method);
            });
        });

        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                this.proceedToPayment();
            });
        }

        // Initialize order summary
        this.initOrderSummary();
    }

    selectPaymentMethod(selectedMethod) {
        const paymentMethods = document.querySelectorAll('.payment-method');
        const proceedBtn = document.getElementById('proceed-payment');

        paymentMethods.forEach(method => {
            method.classList.remove('border-green-500', 'border-blue-500', 'border-purple-500');
            method.classList.add('border-gray-200');
            
            const radio = method.querySelector('.payment-radio');
            radio.classList.remove('bg-blue-600', 'border-blue-600');
            radio.classList.add('border-gray-300');
        });

        selectedMethod.classList.remove('border-gray-200');
        const methodType = selectedMethod.dataset.method;
        
        if (methodType === 'face') {
            selectedMethod.classList.add('border-green-500');
        } else if (methodType === 'qr') {
            selectedMethod.classList.add('border-blue-500');
        } else if (methodType === 'card') {
            selectedMethod.classList.add('border-purple-500');
        }

        const radio = selectedMethod.querySelector('.payment-radio');
        radio.classList.remove('border-gray-300');
        radio.classList.add('bg-blue-600', 'border-blue-600');

        // Enable proceed button
        if (proceedBtn) {
            proceedBtn.disabled = false;
        }

        this.selectedPaymentMethod = methodType;
    }

    initOrderSummary() {
        // Mock order data
        const orderItems = [
            { name: '智能矿泉水', price: 3.50, quantity: 2 },
            { name: '有机薯片', price: 8.90, quantity: 1 }
        ];

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = 0; // Free shipping
        const discount = 2.00; // Mock discount
        const total = subtotal + shippingFee - discount;

        // Update order summary
        document.getElementById('subtotal').textContent = `¥${subtotal.toFixed(2)}`;
        document.getElementById('shipping-fee').textContent = `¥${shippingFee.toFixed(2)}`;
        document.getElementById('discount').textContent = `-¥${discount.toFixed(2)}`;
        document.getElementById('total-amount').textContent = `¥${total.toFixed(2)}`;
        document.getElementById('payment-amount').textContent = total.toFixed(2);

        // Render order items
        const orderItemsContainer = document.getElementById('order-items');
        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = orderItems.map(item => `
                <div class="flex justify-between items-center py-2">
                    <div>
                        <span class="text-gray-900">${item.name}</span>
                        <span class="text-gray-600 text-sm ml-2">x${item.quantity}</span>
                    </div>
                    <span class="font-medium">¥${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }
    }

    proceedToPayment() {
        if (!this.selectedPaymentMethod) {
            smartStore.showToast('请选择支付方式', 'warning');
            return;
        }

        switch (this.selectedPaymentMethod) {
            case 'face':
                this.startFacePayment();
                break;
            case 'qr':
                this.startQRPayment();
                break;
            case 'card':
                this.startCardPayment();
                break;
        }
    }

    startFacePayment() {
        smartStore.openModal('face-payment-modal');
        this.initFacePayment();
    }

    initFacePayment() {
        const cancelBtn = document.getElementById('cancel-face-payment');
        const retryBtn = document.getElementById('retry-face-payment');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelFacePayment();
            });
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.retryFacePayment();
            });
        }

        // Start face recognition for payment
        this.startPaymentFaceRecognition();
    }

    async startPaymentFaceRecognition() {
        const paymentCamera = document.getElementById('payment-camera');
        const paymentStatusText = document.getElementById('payment-status-text');
        const paymentProgress = document.getElementById('payment-progress');

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });

            paymentCamera.srcObject = stream;
            paymentCamera.classList.remove('hidden');

            paymentStatusText.textContent = '正在识别面部特征...';

            // Simulate payment face recognition
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                    this.completeFacePayment();
                }
                
                document.getElementById('progress-bar').style.width = progress + '%';
                document.getElementById('progress-percent').textContent = Math.round(progress) + '%';
                
                paymentProgress.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error('Payment face recognition error:', error);
            paymentStatusText.textContent = '摄像头访问失败';
        }
    }

    completeFacePayment() {
        const paymentStatusText = document.getElementById('payment-status-text');
        paymentStatusText.textContent = '支付成功！';
        
        // Close modal and show success
        setTimeout(() => {
            smartStore.closeModal('face-payment-modal');
            this.showPaymentSuccess();
        }, 1000);
    }

    cancelFacePayment() {
        this.stopPaymentCamera();
        smartStore.closeModal('face-payment-modal');
    }

    retryFacePayment() {
        document.getElementById('payment-progress').classList.add('hidden');
        document.getElementById('retry-face-payment').classList.add('hidden');
        this.startPaymentFaceRecognition();
    }

    stopPaymentCamera() {
        const paymentCamera = document.getElementById('payment-camera');
        if (paymentCamera && paymentCamera.srcObject) {
            paymentCamera.srcObject.getTracks().forEach(track => track.stop());
        }
    }

    startQRPayment() {
        smartStore.openModal('qr-payment-modal');
        this.generatePaymentQR();
    }

    generatePaymentQR() {
        const paymentQR = document.getElementById('payment-qr');
        if (paymentQR) {
            paymentQR.innerHTML = `
                <div class="w-48 h-48 bg-white border-4 border-gray-300 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                        <i class="fas fa-qrcode text-6xl text-gray-600 mb-4"></i>
                        <p class="text-gray-600">支付二维码</p>
                        <p class="text-sm text-gray-500">订单号: #${Date.now()}</p>
                    </div>
                </div>
            `;

            // Simulate QR payment completion
            setTimeout(() => {
                this.showPaymentSuccess();
                smartStore.closeModal('qr-payment-modal');
            }, 8000);
        }
    }

    startCardPayment() {
        smartStore.showToast('银行卡支付功能开发中...', 'info');
    }

    showPaymentSuccess() {
        smartStore.openModal('payment-success-modal');
        
        // Update success modal content
        document.getElementById('order-number').textContent = `#${Date.now()}`;
        document.getElementById('paid-amount').textContent = document.getElementById('total-amount').textContent;

        // Add event listeners for success modal buttons
        const viewOrderBtn = document.getElementById('view-order');
        const continueShoppingBtn = document.getElementById('continue-shopping');

        if (viewOrderBtn) {
            viewOrderBtn.addEventListener('click', () => {
                smartStore.closeModal('payment-success-modal');
                window.location.href = '/user/member_center';
            });
        }

        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                smartStore.closeModal('payment-success-modal');
                window.location.href = '/products';
            });
        }
    }

    /* Member Center */
    initMemberCenter() {
        this.loadMemberData();
        this.loadRecentOrders();
        this.loadRecommendedProducts();
    }

    async loadMemberData() {
        const cached = smartStore.getUser();
        if (!cached) {
            if (window.location.pathname.startsWith('/user/member_center')) {
                smartStore.showToast('请先登录', 'warning');
                setTimeout(() => window.location.href = '/user/login', 800);
            }
            return;
        }

        // 先用本地缓存渲染，提升首屏速度
        this.updateMemberUI(cached);

        // 再尝试向后端拉取最新资料进行刷新
        try {
            const resp = await fetch(`/api/user/profile?userId=${encodeURIComponent(cached.id || '')}`);
            if (resp.ok) {
                const profile = await resp.json();
                // 合并关键字段并刷新 UI
                const merged = {
                    ...cached,
                    ...profile
                };
                this.updateMemberUI(merged);
                // 更新缓存
                smartStore.login(merged);
            }
        } catch (e) {
            // 静默失败，不影响页面
            console.warn('加载用户资料失败: ', e);
        }
    }

    updateMemberUI(user) {
        if (!user) return;
        const nameEl = document.getElementById('member-name');
        const pointsEl = document.getElementById('member-points');
        const levelEl = document.getElementById('member-level');
        if (nameEl) nameEl.textContent = user.username || '用户名';
        if (pointsEl) pointsEl.textContent = user.points != null ? user.points : 0;
        if (levelEl) levelEl.textContent = user.level || user.membershipLevel || '会员';

        const avatar = user.avatar;
        const topAvatar = document.getElementById('member-avatar');
        const topFallback = document.getElementById('member-avatar-fallback');
        const sideAvatar = document.getElementById('member-avatar-side');
        const sideFallback = document.getElementById('member-avatar-side-fallback');
        if (avatar) {
            if (topAvatar) { topAvatar.src = avatar; topAvatar.classList.remove('hidden'); }
            if (topFallback) topFallback.classList.add('hidden');
            if (sideAvatar) { sideAvatar.src = avatar; sideAvatar.classList.remove('hidden'); }
            if (sideFallback) sideFallback.classList.add('hidden');
        } else {
            if (topAvatar) topAvatar.classList.add('hidden');
            if (topFallback) topFallback.classList.remove('hidden');
            if (sideAvatar) sideAvatar.classList.add('hidden');
            if (sideFallback) sideFallback.classList.remove('hidden');
        }
    }

    loadRecentOrders() {
        const recentOrders = document.getElementById('recent-orders');
        if (!recentOrders) return;

        fetch('/api/orders')
            .then(r => r.json())
            .then(orders => {
                recentOrders.innerHTML = orders.map(order => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="font-medium text-gray-900">#${order.id}</span>
                        <span class="text-sm text-gray-500">${order.date}</span>
                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">${order.status}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        ${order.items.map(i => i.name).join('、')}
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-gray-900">¥${order.total.toFixed(2)}</div>
                    <button class="text-blue-600 text-sm hover:text-blue-700 transition-colors">查看详情</button>
                </div>
            </div>
        `).join('');
            })
            .catch(() => {
                recentOrders.innerHTML = '<p class="text-gray-500">暂无订单数据</p>';
            });
    }

    loadRecommendedProducts() {
        const recommendedProducts = document.getElementById('recommended-products');
        if (!recommendedProducts) return;

        // 尝试用已登录用户推荐接口
        const user = smartStore.getUser();
        const url = user ? `/api/user/recommendations?userId=${encodeURIComponent(user.id)}` : '/api/recommendations/trending';
        fetch(url)
            .then(r => r.json())
            .then(recommendations => {
                recommendedProducts.innerHTML = recommendations.map(product => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover">
                <div class="p-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name}</h4>
                    <p class="text-blue-600 font-semibold mb-3">¥${product.price.toFixed(2)}</p>
                    <button onclick="userManager.addToCart('${product.id}')" 
                            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        加入购物篮
                    </button>
                </div>
            </div>
        `).join('');
            })
            .catch(() => {
                recommendedProducts.innerHTML = '<p class="text-gray-500">暂无推荐数据</p>';
            });
    }

    addToCart(productId) {
        // Mock add to cart
        smartStore.showToast('商品已加入购物篮', 'success');
    }

    /* Modal Management */
    initModals() {
        // QR Modal
        const closeQRModal = document.getElementById('close-qr-modal');
        if (closeQRModal) {
            closeQRModal.addEventListener('click', () => {
                smartStore.closeModal('qr-modal');
            });
        }

        // 退出登录按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                smartStore.logout && smartStore.logout();
                smartStore.showToast('已退出登录', 'info');
                setTimeout(() => {
                    window.location.href = '/';
                }, 600);
            });
        }
    }
}

// Initialize user manager
const userManager = new UserManager();

// Export for global use
window.userManager = userManager;