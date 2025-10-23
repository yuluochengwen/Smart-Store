// Copied from frontend/client/script.js for Flask static serving

// 全局变量
let shoppingCart = [];
let isCameraActive = false;
let detectionInterval = null;
let todayDetections = 0;
let successfulDetections = 0;

// 模拟商品数据库
const productDatabase = [
    { id: 1, name: '苹果', price: 5.99, category: '水果', icon: '🍎' },
    { id: 2, name: '香蕉', price: 3.99, category: '水果', icon: '🍌' },
    { id: 3, name: '牛奶', price: 12.99, category: '饮品', icon: '🥛' },
    { id: 4, name: '面包', price: 8.99, category: '食品', icon: '🍞' },
    { id: 5, name: '鸡蛋', price: 15.99, category: '食品', icon: '🥚' },
    { id: 6, name: '西红柿', price: 4.99, category: '蔬菜', icon: '🍅' },
    { id: 7, name: '胡萝卜', price: 3.99, category: '蔬菜', icon: '🥕' },
    { id: 8, name: '可乐', price: 2.99, category: '饮品', icon: '🥤' },
    { id: 9, name: '薯片', price: 6.99, category: '零食', icon: '🥔' },
    { id: 10, name: '巧克力', price: 9.99, category: '零食', icon: '🍫' }
];

// 推荐商品数据
const recommendedProducts = [
    { id: 11, name: '酸奶', price: 7.99, icon: '🥛' },
    { id: 12, name: '饼干', price: 4.99, icon: '🍪' },
    { id: 13, name: '橙子', price: 6.99, icon: '🍊' }
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadRecommendedProducts();
    updateCartDisplay();
    updateStats();
});

// 初始化应用
function initializeApp() {
    // 加载保存的购物车
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        shoppingCart = JSON.parse(savedCart);
    }
    
    // 加载统计数据
    const savedDetections = localStorage.getItem('todayDetections');
    if (savedDetections) {
        todayDetections = parseInt(savedDetections);
    }
    
    // 设置AI助手输入框事件
    const aiInput = document.getElementById('ai-input');
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });
    }
    
    console.log('智能购物系统已初始化');
}

// 摄像头功能
async function startCamera() {
    try {
        const video = document.getElementById('camera-feed');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        // 尝试获取摄像头权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment'
            } 
        });
        
        video.srcObject = stream;
        isCameraActive = true;
        
        // 更新状态
        statusDot.classList.add('active');
        statusText.textContent = '正在识别商品...';
        
        // 开始模拟商品识别
        startDetectionSimulation();
        
        console.log('摄像头已启动');
        
        // 添加成功提示
        showNotification('摄像头已连接，开始商品识别', 'success');
        
    } catch (error) {
        console.error('无法访问摄像头:', error);
        showNotification('无法访问摄像头，请检查权限设置', 'error');
        
        // 仍然启动模拟识别
        startDetectionSimulation();
    }
}

function stopCamera() {
    const video = document.getElementById('camera-feed');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    isCameraActive = false;
    
    // 更新状态
    statusDot.classList.remove('active');
    statusText.textContent = '识别已停止';
    
    // 停止识别模拟
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // 清除识别框
    clearDetectionBoxes();
    
    console.log('摄像头已停止');
    showNotification('商品识别已停止', 'info');
}

// 模拟商品识别
function startDetectionSimulation() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    
    detectionInterval = setInterval(() => {
        if (isCameraActive && Math.random() > 0.7) {
            detectProduct();
        }
    }, 3000);
}

function detectProduct() {
    // 随机选择一个商品进行识别
    const randomProduct = productDatabase[Math.floor(Math.random() * productDatabase.length)];
    
    // 创建识别框
    createDetectionBox(randomProduct);
    
    // 自动添加到购物车
    setTimeout(() => {
        addToCart(randomProduct);
        clearDetectionBoxes();
    }, 2000);
    
    // 更新统计数据
    todayDetections++;
    successfulDetections++;
    updateStats();
    
    // 保存统计数据
    localStorage.setItem('todayDetections', todayDetections.toString());
    
    console.log('识别到商品:', randomProduct.name);
}

function createDetectionBox(product) {
    const overlay = document.getElementById('detection-overlay');
    
    // 创建识别框
    const box = document.createElement('div');
    box.className = 'detection-box';
    box.style.left = Math.random() * 60 + 20 + '%';
    box.style.top = Math.random() * 60 + 20 + '%';
    box.style.width = Math.random() * 100 + 100 + 'px';
    box.style.height = Math.random() * 100 + 100 + 'px';
    
    // 创建标签
    const label = document.createElement('div');
    label.className = 'detection-label';
    label.textContent = product.name + ' ￥' + product.price;
    
    box.appendChild(label);
    overlay.appendChild(box);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (box.parentNode) {
            box.parentNode.removeChild(box);
        }
    }, 3000);
}

function clearDetectionBoxes() {
    const overlay = document.getElementById('detection-overlay');
    overlay.innerHTML = '';
}

// 购物车功能
function addToCart(product, quantity = 1) {
    // 检查商品是否已在购物车中
    const existingItem = shoppingCart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({
            ...product,
            quantity: quantity,
            addedAt: new Date().toISOString()
        });
    }
    
    updateCartDisplay();
    saveCart();
    showNotification(`已添加 ${product.name} 到购物车`, 'success');
}

function removeFromCart(productId) {
    const product = shoppingCart.find(item => item.id === productId);
    if (product) {
        shoppingCart = shoppingCart.filter(item => item.id !== productId);
        updateCartDisplay();
        saveCart();
        showNotification(`已移除 ${product.name}`, 'info');
    }
}

function updateQuantity(productId, change) {
    const product = shoppingCart.find(item => item.id === productId);
    if (product) {
        product.quantity += change;
        if (product.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
            saveCart();
        }
    }
}

function clearCart() {
    if (shoppingCart.length === 0) {
        showNotification('购物车已经是空的', 'info');
        return;
    }
    
    if (confirm('确定要清空购物车吗？')) {
        shoppingCart = [];
        updateCartDisplay();
        saveCart();
        showNotification('购物车已清空', 'info');
    }
}

function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
}

function updateCartDisplay() {
    const cartList = document.getElementById('shopping-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    // 更新购物车数量和总价
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2);
    
    // 更新购物车显示
    if (shoppingCart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <h3>购物清单为空</h3>
                <p>将商品放入摄像头区域即可自动识别添加</p>
            </div>
        `;
    } else {
        cartList.innerHTML = shoppingCart.map(item => `
            <div class="cart-item">
                <div class="item-image">
                    ${item.icon}
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">￥${item.price.toFixed(2)}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// 推荐商品功能
function loadRecommendedProducts() {
    const recommendedList = document.getElementById('recommended-list');
    
    recommendedList.innerHTML = recommendedProducts.map(product => `
        <div class="recommended-item" onclick="addRecommendedToCart(${product.id})">
            <div class="recommended-item-image">
                ${product.icon}
            </div>
            <div class="recommended-item-details">
                <div class="recommended-item-name">${product.name}</div>
                <div class="recommended-item-price">￥${product.price.toFixed(2)}</div>
            </div>
            <button class="add-recommended-btn" onclick="event.stopPropagation(); addRecommendedToCart(${product.id})">
                添加
            </button>
        </div>
    `).join('');
}

function addRecommendedToCart(productId) {
    const product = recommendedProducts.find(p => p.id === productId);
    if (product) {
        // 检查是否在主商品数据库中
        const mainProduct = productDatabase.find(p => p.name === product.name);
        if (mainProduct) {
            addToCart(mainProduct);
        } else {
            // 添加到购物车（作为新商品）
            addToCart({
                id: productId,
                name: product.name,
                price: product.price,
                icon: product.icon,
                category: '推荐商品'
            });
        }
    }
}

// 结算功能
function proceedToCheckout() {
    if (shoppingCart.length === 0) {
        showNotification('购物车是空的，请先添加商品', 'warning');
        return;
    }
    
    const modal = document.getElementById('checkout-modal');
    const orderItems = document.getElementById('order-items');
    const finalTotal = document.getElementById('final-total');
    
    // 生成订单详情
    orderItems.innerHTML = shoppingCart.map(item => `
        <div class="order-item">
            <div>
                <strong>${item.name}</strong> x ${item.quantity}
            </div>
            <div>￥${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    // 计算总价
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    finalTotal.textContent = total.toFixed(2);
    
    // 显示模态框
    modal.style.display = 'block';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.style.display = 'none';
}

function confirmPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // 模拟支付处理
    showNotification('正在处理支付...', 'info');
    
    setTimeout(() => {
        // 支付成功
        showNotification('支付成功！感谢您的购买', 'success');
        
        // 清空购物车
        shoppingCart = [];
        updateCartDisplay();
        saveCart();
        
        // 关闭模态框
        closeCheckoutModal();
        
        // 生成订单记录
        generateOrderRecord(paymentMethod);
        
    }, 2000);
}

function generateOrderRecord(paymentMethod) {
    const order = {
        id: 'ORDER_' + Date.now(),
        items: [...shoppingCart],
        total: shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };
    
    // 保存订单记录
    const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    orders.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(orders));
    
    console.log('订单已生成:', order);
}

// AI助手功能
function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const chat = document.getElementById('ai-chat');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message';
    userMessage.innerHTML = `
        <div class="message-avatar" style="background: #667eea;">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chat.appendChild(userMessage);
    
    // 清空输入框
    input.value = '';
    
    // 滚动到底部
    chat.scrollTop = chat.scrollHeight;
    
    // 模拟AI回复
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message';
        aiMessage.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${aiResponse}</p>
            </div>
        `;
        chat.appendChild(aiMessage);
        chat.scrollTop = chat.scrollHeight;
    }, 1000);
}

function generateAIResponse(message) {
    const messageLower = message.toLowerCase();
    
    // 简单的AI回复逻辑
    if (messageLower.includes('推荐') || messageLower.includes('建议')) {
        return '根据您的购物历史，我推荐您试试酸奶、饼干和橙子，这些都是很受欢迎的商品哦！';
    } else if (messageLower.includes('价格') || messageLower.includes('多少钱')) {
        return '您可以查看商品详情了解具体价格，我们保证所有商品价格公道合理！';
    } else if (messageLower.includes('优惠') || messageLower.includes('折扣')) {
        return '目前我们有满100减20的活动，还有会员专享折扣，建议您注册会员享受更多优惠！';
    } else if (messageLower.includes('配送') || messageLower.includes('送货')) {
        return '我们提供快速配送服务，一般情况下24小时内送达，满50元免配送费！';
    } else if (messageLower.includes('质量') || messageLower.includes('新鲜')) {
        return '我们承诺所有商品都是新鲜优质的，如有质量问题可以无条件退换！';
    } else {
        return '感谢您的咨询！我是AI购物助手，可以为您提供商品推荐、价格查询、优惠信息等服务。请问还有什么可以帮助您的吗？';
    }
}

// 更新统计数据
function updateStats() {
    const todayDetectionsEl = document.getElementById('today-detections');
    const successRateEl = document.getElementById('success-rate');
    
    if (todayDetectionsEl) {
        todayDetectionsEl.textContent = todayDetections;
    }
    
    if (successRateEl) {
        const rate = todayDetections > 0 ? Math.round((successfulDetections / todayDetections) * 100) : 0;
        successRateEl.textContent = rate + '%';
    }
}

// 通知功能
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl + K 快速打开摄像头
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        startCamera();
    }
    
    // Ctrl + E 快速结算
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        proceedToCheckout();
    }
});
