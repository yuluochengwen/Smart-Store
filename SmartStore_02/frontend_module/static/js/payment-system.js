/**
 * SmartStore Payment System
 * 多模态支付系统，支持人脸支付、二维码支付、银行卡支付
 */

class PaymentSystem {
    constructor() {
        this.currentPayment = null;
        this.paymentMethods = {
            face: { name: '人脸支付', enabled: true },
            qr: { name: '二维码支付', enabled: true },
            card: { name: '银行卡支付', enabled: true },
            wechat: { name: '微信支付', enabled: true },
            alipay: { name: '支付宝', enabled: true }
        };
        this.init();
    }

    init() {
        this.initPaymentMethods();
        this.initSecurityFeatures();
        this.setupEventListeners();
    }

    /* 支付方法初始化 */
    initPaymentMethods() {
        // 检查设备支持的支付方式
        this.checkDeviceCapabilities();
        
        // 初始化各种支付界面
        this.initFacePayment();
        this.initQRPayment();
        this.initCardPayment();
        this.initThirdPartyPayment();
    }

    checkDeviceCapabilities() {
        // 检查摄像头支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.paymentMethods.face.enabled = false;
        }

        // 检查支付API支持
        if (!window.PaymentRequest) {
            this.paymentMethods.card.enabled = false;
        }
    }

    /* 人脸支付 */
    initFacePayment() {
        this.facePayment = {
            isActive: false,
            stream: null,
            detectionInterval: null,
            confidenceThreshold: 0.85
        };
    }

    async startFacePayment(orderData) {
        if (!this.paymentMethods.face.enabled) {
            this.showError('人脸支付暂不可用');
            return false;
        }

        try {
            this.currentPayment = {
                method: 'face',
                orderId: orderData.orderId,
                amount: orderData.amount,
                status: 'initializing'
            };

            // 请求摄像头权限
            this.facePayment.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                }
            });

            // 显示摄像头画面
            this.displayCameraFeed();
            
            // 开始人脸识别
            this.startFaceDetection();
            
            return true;
        } catch (error) {
            console.error('Face payment initialization failed:', error);
            this.showError('无法访问摄像头，请检查权限设置');
            return false;
        }
    }

    displayCameraFeed() {
        const videoElement = document.getElementById('payment-camera');
        if (videoElement && this.facePayment.stream) {
            videoElement.srcObject = this.facePayment.stream;
            videoElement.classList.remove('hidden');
        }
    }

    startFaceDetection() {
        this.updatePaymentStatus('正在检测面部特征...');
        
        // 模拟人脸识别过程
        let detectionSteps = [
            '正在检测面部...',
            '提取面部特征...',
            '匹配用户信息...',
            '验证身份...',
            '处理支付...'
        ];

        let currentStep = 0;
        this.facePayment.detectionInterval = setInterval(() => {
            if (currentStep < detectionSteps.length) {
                this.updatePaymentStatus(detectionSteps[currentStep]);
                currentStep++;
            } else {
                this.completeFacePayment();
            }
        }, 2000);
    }

    completeFacePayment() {
        clearInterval(this.facePayment.detectionInterval);
        
        // 模拟支付验证
        const success = Math.random() > 0.1; // 90% 成功率
        
        if (success) {
            this.currentPayment.status = 'completed';
            this.updatePaymentStatus('支付成功！');
            this.triggerPaymentSuccess();
        } else {
            this.currentPayment.status = 'failed';
            this.updatePaymentStatus('支付失败，请重试');
            this.showRetryOptions();
        }
    }

    stopFacePayment() {
        if (this.facePayment.detectionInterval) {
            clearInterval(this.facePayment.detectionInterval);
        }
        
        if (this.facePayment.stream) {
            this.facePayment.stream.getTracks().forEach(track => track.stop());
            this.facePayment.stream = null;
        }
        
        const videoElement = document.getElementById('payment-camera');
        if (videoElement) {
            videoElement.classList.add('hidden');
        }
    }

    /* 二维码支付 */
    initQRPayment() {
        this.qrPayment = {
            isActive: false,
            qrCode: null,
            checkInterval: null,
            expiresIn: 300 // 5分钟过期
        };
    }

    startQRPayment(orderData, provider = 'wechat') {
        this.currentPayment = {
            method: 'qr',
            provider: provider,
            orderId: orderData.orderId,
            amount: orderData.amount,
            status: 'generating'
        };

        // 生成二维码
        this.generateQRCode(orderData, provider);
        
        // 开始检查支付状态
        this.startPaymentChecking();
        
        return true;
    }

    generateQRCode(orderData, provider) {
        // 模拟生成二维码
        const qrData = {
            orderId: orderData.orderId,
            amount: orderData.amount,
            provider: provider,
            timestamp: Date.now(),
            expires: Date.now() + (this.qrPayment.expiresIn * 1000)
        };

        // 生成二维码图像（实际项目中应使用真实的二维码生成库）
        this.qrPayment.qrCode = this.createQRCodeImage(JSON.stringify(qrData));
        
        this.displayQRCode();
        this.updatePaymentStatus('请使用' + (provider === 'wechat' ? '微信' : '支付宝') + '扫描二维码');
    }

    createQRCodeImage(data) {
        // 简化的二维码生成（实际项目中应使用qrcode.js等库）
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);
        
        // 绘制简单的二维码图案
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(i * 20, j * 20, 20, 20);
                }
            }
        }
        
        return canvas.toDataURL();
    }

    displayQRCode() {
        const qrContainer = document.getElementById('payment-qr');
        if (qrContainer && this.qrPayment.qrCode) {
            qrContainer.innerHTML = `
                <img src="${this.qrPayment.qrCode}" alt="支付二维码" class="w-48 h-48 mx-auto">
                <p class="text-center mt-4 text-gray-600">请使用${this.currentPayment.provider === 'wechat' ? '微信' : '支付宝'}扫描二维码</p>
                <div class="text-center mt-2">
                    <span class="text-sm text-gray-500">二维码将在 <span id="qr-timer">${this.qrPayment.expiresIn}</span> 秒后过期</span>
                </div>
            `;
            
            this.startQRTimer();
        }
    }

    startQRTimer() {
        let timeLeft = this.qrPayment.expiresIn;
        const timerElement = document.getElementById('qr-timer');
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.handleQRCodeExpired();
            }
        }, 1000);
    }

    handleQRCodeExpired() {
        this.currentPayment.status = 'expired';
        this.updatePaymentStatus('二维码已过期，请重新生成');
        this.showRegenerateQROption();
    }

    startPaymentChecking() {
        this.qrPayment.checkInterval = setInterval(() => {
            this.checkPaymentStatus();
        }, 3000); // 每3秒检查一次支付状态
    }

    async checkPaymentStatus() {
        // 模拟检查支付状态
        const isPaid = Math.random() > 0.7; // 30% 概率支付成功
        
        if (isPaid) {
            this.currentPayment.status = 'completed';
            this.updatePaymentStatus('支付成功！');
            this.stopQRPaymentChecking();
            this.triggerPaymentSuccess();
        }
    }

    stopQRPaymentChecking() {
        if (this.qrPayment.checkInterval) {
            clearInterval(this.qrPayment.checkInterval);
            this.qrPayment.checkInterval = null;
        }
    }

    /* 银行卡支付 */
    initCardPayment() {
        this.cardPayment = {
            isActive: false,
            paymentRequest: null,
            formData: {}
        };
    }

    startCardPayment(orderData) {
        this.currentPayment = {
            method: 'card',
            orderId: orderData.orderId,
            amount: orderData.amount,
            status: 'form'
        };

        // 显示银行卡支付表单
        this.displayCardPaymentForm();
        return true;
    }

    displayCardPaymentForm() {
        const formContainer = document.getElementById('card-payment-form');
        if (formContainer) {
            formContainer.classList.remove('hidden');
            this.bindCardFormEvents();
        }
    }

    bindCardFormEvents() {
        const form = document.getElementById('card-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCardPayment(e);
            });
        }

        // 实时验证卡号
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
                this.validateCardNumber(e.target.value);
            });
        }

        // 实时验证有效期
        const expiryInput = document.getElementById('card-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                this.formatExpiryDate(e.target);
            });
        }
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '');
        let formattedValue = '';
        
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        
        input.value = formattedValue;
    }

    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    validateCardNumber(cardNumber) {
        // Luhn算法验证卡号
        const cleanNumber = cardNumber.replace(/\s/g, '');
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return false;
        }

        let sum = 0;
        let isEven = false;
        
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    async processCardPayment(event) {
        const formData = new FormData(event.target);
        const cardData = {
            number: formData.get('card-number').replace(/\s/g, ''),
            expiry: formData.get('card-expiry'),
            cvv: formData.get('card-cvv'),
            name: formData.get('card-name')
        };

        // 验证卡信息
        if (!this.validateCardData(cardData)) {
            this.showError('请检查卡信息是否正确');
            return;
        }

        this.currentPayment.status = 'processing';
        this.updatePaymentStatus('正在处理支付...');

        try {
            // 模拟支付处理
            await this.simulateCardPayment(cardData);
            
            this.currentPayment.status = 'completed';
            this.updatePaymentStatus('支付成功！');
            this.triggerPaymentSuccess();
        } catch (error) {
            this.currentPayment.status = 'failed';
            this.updatePaymentStatus('支付失败，请重试');
            this.showError('支付处理失败');
        }
    }

    validateCardData(cardData) {
        if (!this.validateCardNumber(cardData.number)) {
            return false;
        }

        // 验证有效期
        const [month, year] = cardData.expiry.split('/');
        const currentDate = new Date();
        const cardDate = new Date(`20${year}`, month - 1);
        if (cardDate < currentDate) {
            return false;
        }

        // 验证CVV
        if (!/^\d{3,4}$/.test(cardData.cvv)) {
            return false;
        }

        return true;
    }

    async simulateCardPayment(cardData) {
        // 模拟支付处理时间
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const success = Math.random() > 0.1; // 90% 成功率
                if (success) {
                    resolve();
                } else {
                    reject(new Error('Payment failed'));
                }
            }, 3000);
        });
    }

    /* 第三方支付（微信、支付宝） */
    initThirdPartyPayment() {
        this.thirdPartyPayment = {
            wechat: { appId: 'wx1234567890', enabled: true },
            alipay: { appId: 'alipay123456', enabled: true }
        };
    }

    startThirdPartyPayment(orderData, provider) {
        this.currentPayment = {
            method: 'thirdparty',
            provider: provider,
            orderId: orderData.orderId,
            amount: orderData.amount,
            status: 'redirecting'
        };

        // 生成支付参数
        const paymentParams = this.generatePaymentParams(orderData, provider);
        
        // 重定向到支付页面或打开支付应用
        this.redirectToPaymentApp(paymentParams, provider);
        
        return true;
    }

    generatePaymentParams(orderData, provider) {
        const timestamp = Date.now();
        const nonceStr = Math.random().toString(36).substr(2, 15);
        
        return {
            appId: this.thirdPartyPayment[provider].appId,
            timeStamp: timestamp,
            nonceStr: nonceStr,
            package: `prepay_id=${orderData.orderId}`,
            signType: 'MD5',
            paySign: this.generateSignature(provider, timestamp, nonceStr, orderData.orderId)
        };
    }

    generateSignature(provider, timestamp, nonceStr, prepayId) {
        // 简化的签名生成（实际项目中应使用真实的签名算法）
        const stringA = `appId=${this.thirdPartyPayment[provider].appId}&nonceStr=${nonceStr}&package=prepay_id=${prepayId}&timeStamp=${timestamp}`;
        const stringSignTemp = stringA + '&key=your_api_key';
        return btoa(stringSignTemp).toUpperCase();
    }

    redirectToPaymentApp(paymentParams, provider) {
        // 模拟重定向到支付应用
        const paymentUrl = `${provider}://pay?${new URLSearchParams(paymentParams)}`;
        
        // 在实际项目中，这里会调用相应的支付SDK
        console.log('Redirecting to:', paymentUrl);
        
        // 模拟支付完成回调
        setTimeout(() => {
            this.handleThirdPartyPaymentCallback(paymentParams);
        }, 5000);
    }

    handleThirdPartyPaymentCallback(params) {
        // 处理支付回调
        const isSuccess = params.result === 'success';
        
        if (isSuccess) {
            this.currentPayment.status = 'completed';
            this.triggerPaymentSuccess();
        } else {
            this.currentPayment.status = 'failed';
            this.showError('支付失败');
        }
    }

    /* 安全功能 */
    initSecurityFeatures() {
        this.security = {
            encryptionEnabled: true,
            fraudDetectionEnabled: true,
            maxAttempts: 3,
            currentAttempts: 0
        };
    }

    encryptSensitiveData(data) {
        // 简化的数据加密（实际项目中应使用专业的加密库）
        if (!this.security.encryptionEnabled) return data;
        
        return btoa(JSON.stringify(data));
    }

    detectFraud(paymentData) {
        // 简化的欺诈检测
        const riskScore = Math.random();
        
        if (riskScore > 0.9) {
            this.blockPayment('高风险交易');
            return false;
        }
        
        return true;
    }

    blockPayment(reason) {
        this.currentPayment.status = 'blocked';
        this.showError(`支付被阻止: ${reason}`);
        this.triggerEvent('paymentBlocked', { reason });
    }

    /* 事件处理 */
    setupEventListeners() {
        // 监听支付超时
        document.addEventListener('paymentTimeout', (e) => {
            this.handlePaymentTimeout(e.detail);
        });

        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.handleNetworkChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleNetworkChange(false);
        });
    }

    handlePaymentTimeout(data) {
        if (this.currentPayment && this.currentPayment.status === 'processing') {
            this.currentPayment.status = 'timeout';
            this.showError('支付超时，请重试');
        }
    }

    handleNetworkChange(isOnline) {
        if (!isOnline && this.currentPayment) {
            this.pausePayment();
            this.showWarning('网络连接中断，支付已暂停');
        } else if (isOnline && this.currentPayment && this.currentPayment.status === 'paused') {
            this.resumePayment();
        }
    }

    /* 支付状态管理 */
    updatePaymentStatus(message) {
        const statusElement = document.getElementById('payment-status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    showPaymentProgress(percent) {
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        if (progressPercent) {
            progressPercent.textContent = percent + '%';
        }
    }

    triggerPaymentSuccess() {
        this.triggerEvent('paymentSuccess', this.currentPayment);
        
        // 显示成功页面
        setTimeout(() => {
            this.showPaymentSuccessPage();
        }, 1000);
    }

    showPaymentSuccessPage() {
        // 隐藏支付界面，显示成功页面
        const paymentModal = document.getElementById('face-payment-modal') || 
                           document.getElementById('qr-payment-modal');
        if (paymentModal) {
            smartStore.closeModal(paymentModal.id);
        }
        
        // 显示成功模态框
        smartStore.openModal('payment-success-modal');
    }

    /* 错误处理和重试 */
    showError(message) {
        smartStore.showToast(message, 'error');
    }

    showWarning(message) {
        smartStore.showToast(message, 'warning');
    }

    showRetryOptions() {
        this.updatePaymentStatus('支付失败，请选择重试或其他支付方式');
        
        // 显示重试按钮
        const retryBtn = document.getElementById('retry-face-payment') || 
                        document.getElementById('retry-payment');
        if (retryBtn) {
            retryBtn.classList.remove('hidden');
        }
    }

    showRegenerateQROption() {
        // 显示重新生成二维码按钮
        const regenerateBtn = document.getElementById('regenerate-qr');
        if (regenerateBtn) {
            regenerateBtn.classList.remove('hidden');
        }
    }

    /* 工具方法 */
    formatAmount(amount) {
        return `¥${amount.toFixed(2)}`;
    }

    generateOrderId() {
        return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4);
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /* 支付历史记录 */
    savePaymentHistory(paymentData) {
        const history = this.loadPaymentHistory();
        history.push({
            ...paymentData,
            timestamp: Date.now(),
            id: this.generatePaymentId()
        });
        
        // 只保留最近50条记录
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('payment_history', JSON.stringify(history));
    }

    loadPaymentHistory() {
        try {
            const history = localStorage.getItem('payment_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Failed to load payment history:', error);
            return [];
        }
    }

    generatePaymentId() {
        return 'PAY' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    /* 退款处理 */
    async processRefund(paymentId, amount, reason) {
        // 模拟退款处理
        return new Promise((resolve) => {
            setTimeout(() => {
                const refundData = {
                    refundId: 'REF' + Date.now(),
                    paymentId: paymentId,
                    amount: amount,
                    reason: reason,
                    status: 'completed',
                    timestamp: Date.now()
                };
                
                this.saveRefundRecord(refundData);
                resolve(refundData);
            }, 2000);
        });
    }

    saveRefundRecord(refundData) {
        const refunds = this.loadRefundHistory();
        refunds.push(refundData);
        localStorage.setItem('refund_history', JSON.stringify(refunds));
    }

    loadRefundHistory() {
        try {
            const refunds = localStorage.getItem('refund_history');
            return refunds ? JSON.parse(refunds) : [];
        } catch (error) {
            console.error('Failed to load refund history:', error);
            return [];
        }
    }
}

// 创建全局支付系统实例
const paymentSystem = new PaymentSystem();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentSystem;
} else {
    window.paymentSystem = paymentSystem;
}