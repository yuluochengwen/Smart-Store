/**
 * SmartStore User Manager
 * 用户管理系统，支持会员等级、积分系统、个性化推荐
 */

class UserManager {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.membershipLevels = [];
        this.userActivities = [];
        this.init();
    }

    init() {
        this.initMembershipLevels();
        this.loadUserData();
        this.setupEventListeners();
    }

    /* 会员等级系统 */
    initMembershipLevels() {
        this.membershipLevels = [
            {
                id: 'bronze',
                name: '铜牌会员',
                minPoints: 0,
                maxPoints: 999,
                discount: 0.95,
                benefits: ['基础折扣', '生日优惠', '积分兑换']
            },
            {
                id: 'silver',
                name: '银牌会员',
                minPoints: 1000,
                maxPoints: 4999,
                discount: 0.90,
                benefits: ['银牌折扣', '免费配送', '优先客服', '专属活动']
            },
            {
                id: 'gold',
                name: '金牌会员',
                minPoints: 5000,
                maxPoints: 19999,
                discount: 0.85,
                benefits: ['金牌折扣', '免费配送', '专属客服', 'VIP活动', '新品优先']
            },
            {
                id: 'platinum',
                name: '铂金会员',
                minPoints: 20000,
                maxPoints: Infinity,
                discount: 0.80,
                benefits: ['铂金折扣', '免费配送', '专属客服', 'VIP活动', '新品优先', '定制服务']
            }
        ];
    }

    /* 用户数据管理 */
    loadUserData() {
        // 加载用户数据
        this.users = [
            {
                id: '1',
                username: 'test_user',
                email: 'test@example.com',
                phone: '138****8888',
                avatar: 'https://via.placeholder.com/100x100/3b82f6/ffffff?text=用户',
                password: 'hashed_password',
                createdAt: '2023-01-15T10:00:00Z',
                lastLoginAt: '2024-01-15T14:30:25Z',
                points: 1280,
                totalSpent: 2847.50,
                orderCount: 15,
                membershipLevel: 'silver',
                preferences: {
                    categories: ['beverages', 'snacks'],
                    priceRange: [0, 50],
                    notifications: {
                        email: true,
                        sms: false,
                        push: true
                    }
                },
                addresses: [
                    {
                        id: 'addr1',
                        name: '张三',
                        phone: '138****8888',
                        province: '北京市',
                        city: '北京市',
                        district: '朝阳区',
                        detail: '科技园A座101室',
                        isDefault: true
                    }
                ],
                faceData: null,
                isActive: true
            }
        ];

        this.currentUser = this.users[0]; // 模拟当前登录用户
    }

    setupEventListeners() {
        // 监听用户登录事件
        document.addEventListener('userLoggedIn', (e) => {
            this.handleUserLogin(e.detail);
        });

        // 监听订单完成事件
        document.addEventListener('orderCompleted', (e) => {
            this.handleOrderCompleted(e.detail);
        });

        // 监听支付成功事件
        document.addEventListener('paymentSuccess', (e) => {
            this.handlePaymentSuccess(e.detail);
        });
    }

    /* 用户认证 */
    async login(credentials) {
        try {
            const { username, password, method = 'password' } = credentials;
            
            let user = null;
            
            if (method === 'password') {
                user = this.users.find(u => 
                    (u.username === username || u.email === username) && 
                    u.password === password
                );
            } else if (method === 'face') {
                user = await this.authenticateByFace(credentials.faceData);
            } else if (method === 'sms') {
                user = await this.authenticateBySMS(credentials.phone, credentials.code);
            }

            if (!user) {
                return {
                    success: false,
                    message: '用户名或密码错误'
                };
            }

            if (!user.isActive) {
                return {
                    success: false,
                    message: '账户已被禁用'
                };
            }

            // 更新最后登录时间
            user.lastLoginAt = new Date().toISOString();
            this.currentUser = user;

            // 记录登录活动
            this.recordUserActivity(user.id, 'login', {
                method: method,
                ip: '127.0.0.1', // 实际项目中应获取真实IP
                userAgent: navigator.userAgent
            });

            // 触发登录事件
            this.triggerEvent('userLoggedIn', user);

            return {
                success: true,
                user: this.sanitizeUserData(user),
                message: '登录成功'
            };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: '登录失败，请稍后重试'
            };
        }
    }

    async authenticateByFace(faceData) {
        // 模拟人脸识别认证
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = this.users.find(u => u.faceData && Math.random() > 0.1);
                resolve(user || null);
            }, 2000);
        });
    }

    async authenticateBySMS(phone, code) {
        // 模拟短信验证码认证
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = this.users.find(u => u.phone === phone && code === '123456');
                resolve(user || null);
            }, 1000);
        });
    }

    logout() {
        if (this.currentUser) {
            this.recordUserActivity(this.currentUser.id, 'logout');
            this.currentUser = null;
            this.triggerEvent('userLoggedOut');
        }
    }

    /* 用户注册 */
    async register(userData) {
        try {
            // 验证用户数据
            if (!this.validateUserData(userData)) {
                throw new Error('用户数据验证失败');
            }

            // 检查用户名和邮箱是否已存在
            if (this.users.some(u => u.username === userData.username)) {
                throw new Error('用户名已存在');
            }

            if (this.users.some(u => u.email === userData.email)) {
                throw new Error('邮箱已被注册');
            }

            // 创建新用户
            const newUser = {
                id: this.generateUserId(),
                username: userData.username,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.avatar || this.generateAvatar(userData.username),
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString(),
                lastLoginAt: null,
                points: 100, // 注册奖励积分
                totalSpent: 0,
                orderCount: 0,
                membershipLevel: 'bronze',
                preferences: {
                    categories: [],
                    priceRange: [0, 1000],
                    notifications: {
                        email: true,
                        sms: false,
                        push: true
                    }
                },
                addresses: [],
                faceData: null,
                isActive: true
            };

            this.users.push(newUser);

            // 记录注册活动
            this.recordUserActivity(newUser.id, 'register');

            // 触发注册事件
            this.triggerEvent('userRegistered', newUser);

            return {
                success: true,
                user: this.sanitizeUserData(newUser),
                message: '注册成功'
            };
        } catch (error) {
            console.error('Registration failed:', error);
            return {
                success: false,
                message: error.message || '注册失败'
            };
        }
    }

    /* 积分系统 */
    addPoints(userId, points, reason = '') {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        const oldPoints = user.points;
        user.points += points;

        // 检查会员等级是否需要更新
        this.updateMembershipLevel(userId);

        // 记录积分变动
        this.recordPointsTransaction(userId, points, 'add', reason, oldPoints, user.points);

        // 触发积分更新事件
        this.triggerEvent('pointsUpdated', {
            userId,
            oldPoints,
            newPoints: user.points,
            change: points,
            reason
        });

        return true;
    }

    deductPoints(userId, points, reason = '') {
        const user = this.users.find(u => u.id === userId);
        if (!user || user.points < points) return false;

        const oldPoints = user.points;
        user.points -= points;

        // 检查会员等级是否需要更新
        this.updateMembershipLevel(userId);

        // 记录积分变动
        this.recordPointsTransaction(userId, points, 'deduct', reason, oldPoints, user.points);

        // 触发积分更新事件
        this.triggerEvent('pointsUpdated', {
            userId,
            oldPoints,
            newPoints: user.points,
            change: -points,
            reason
        });

        return true;
    }

    updateMembershipLevel(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        const oldLevel = user.membershipLevel;
        const newLevel = this.calculateMembershipLevel(user.points);

        if (oldLevel !== newLevel) {
            user.membershipLevel = newLevel;

            // 记录等级变动
            this.recordUserActivity(userId, 'level_up', {
                oldLevel,
                newLevel
            });

            // 触发等级更新事件
            this.triggerEvent('membershipLevelUpdated', {
                userId,
                oldLevel,
                newLevel
            });

            return true;
        }

        return false;
    }

    calculateMembershipLevel(points) {
        for (const level of this.membershipLevels) {
            if (points >= level.minPoints && points < level.maxPoints) {
                return level.id;
            }
        }
        return 'bronze';
    }

    getMembershipLevel(levelId) {
        return this.membershipLevels.find(l => l.id === levelId);
    }

    getDiscount(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return 1;

        const level = this.getMembershipLevel(user.membershipLevel);
        return level ? level.discount : 1;
    }

    /* 个性化推荐 */
    getPersonalizedRecommendations(userId, limit = 6) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return [];

        const recommendations = [];

        // 基于购买历史的推荐
        const purchaseHistory = this.getUserPurchaseHistory(userId);
        const preferredCategories = this.getPreferredCategories(userId);
        
        // 获取用户未购买过的商品
        const purchasedProductIds = new Set(purchaseHistory.map(p => p.productId));
        const availableProducts = this.getAvailableProducts().filter(p => 
            !purchasedProductIds.has(p.id)
        );

        // 按偏好分类排序
        const scoredProducts = availableProducts.map(product => {
            let score = 0;
            
            // 分类偏好得分
            if (preferredCategories.includes(product.category)) {
                score += 10;
            }
            
            // 价格范围得分
            const [minPrice, maxPrice] = user.preferences.priceRange;
            if (product.price >= minPrice && product.price <= maxPrice) {
                score += 5;
            }
            
            // 评分得分
            score += product.rating * 2;
            
            // 销量得分
            score += Math.min(product.sold / 10, 5);
            
            return { product, score };
        });

        // 按得分排序并返回前N个
        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    }

    getPreferredCategories(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return [];

        // 从用户偏好和购买历史分析
        const categories = new Set(user.preferences.categories);
        
        // 添加购买历史中的分类
        const purchaseHistory = this.getUserPurchaseHistory(userId);
        purchaseHistory.forEach(purchase => {
            const product = this.getProduct(purchase.productId);
            if (product) {
                categories.add(product.category);
            }
        });

        return Array.from(categories);
    }

    getUserPurchaseHistory(userId) {
        // 从订单数据获取购买历史
        const orders = this.getUserOrders(userId);
        const history = [];

        orders.forEach(order => {
            order.items.forEach(item => {
                history.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    date: order.date
                });
            });
        });

        return history;
    }

    /* 用户活动记录 */
    recordUserActivity(userId, action, data = {}) {
        const activity = {
            id: this.generateActivityId(),
            userId: userId,
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1', // 实际项目中应获取真实IP
            userAgent: navigator.userAgent
        };

        this.userActivities.push(activity);

        // 只保留最近1000条活动记录
        if (this.userActivities.length > 1000) {
            this.userActivities.splice(0, this.userActivities.length - 1000);
        }

        // 保存到本地存储
        this.saveUserActivities();
    }

    getUserActivities(userId, limit = 20) {
        return this.userActivities
            .filter(activity => activity.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    getUserOrders(userId) {
        // 从数据管理器获取用户订单
        if (typeof dataManager !== 'undefined') {
            return dataManager.getUserOrders(userId);
        }
        return [];
    }

    getProduct(productId) {
        // 从数据管理器获取商品信息
        if (typeof dataManager !== 'undefined') {
            return dataManager.getProduct(productId);
        }
        return null;
    }

    getAvailableProducts() {
        // 从数据管理器获取可用商品
        if (typeof dataManager !== 'undefined') {
            return dataManager.products || [];
        }
        return [];
    }

    /* 用户偏好设置 */
    updateUserPreferences(userId, preferences) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        user.preferences = { ...user.preferences, ...preferences };
        
        this.recordUserActivity(userId, 'preferences_updated', preferences);
        
        return true;
    }

    /* 地址管理 */
    addAddress(userId, addressData) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        const newAddress = {
            id: this.generateAddressId(),
            ...addressData,
            isDefault: user.addresses.length === 0
        };

        user.addresses.push(newAddress);
        
        this.recordUserActivity(userId, 'address_added', newAddress);
        
        return newAddress;
    }

    updateAddress(userId, addressId, updateData) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        const addressIndex = user.addresses.findIndex(a => a.id === addressId);
        if (addressIndex === -1) return false;

        user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...updateData };
        
        this.recordUserActivity(userId, 'address_updated', updateData);
        
        return true;
    }

    deleteAddress(userId, addressId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        const addressIndex = user.addresses.findIndex(a => a.id === addressId);
        if (addressIndex === -1) return false;

        user.addresses.splice(addressIndex, 1);
        
        this.recordUserActivity(userId, 'address_deleted', { addressId });
        
        return true;
    }

    setDefaultAddress(userId, addressId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        user.addresses.forEach(address => {
            address.isDefault = address.id === addressId;
        });
        
        this.recordUserActivity(userId, 'default_address_set', { addressId });
        
        return true;
    }

    /* 人脸识别数据管理 */
    registerFace(userId, faceData) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        user.faceData = faceData;
        
        this.recordUserActivity(userId, 'face_registered');
        
        return true;
    }

    unregisterFace(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;

        user.faceData = null;
        
        this.recordUserActivity(userId, 'face_unregistered');
        
        return true;
    }

    /* 事件处理器 */
    handleUserLogin(userData) {
        console.log('User logged in:', userData);
    }

    handleOrderCompleted(orderData) {
        // 订单完成后的处理
        const userId = orderData.userId;
        const totalAmount = orderData.total;
        
        // 添加积分（消费金额的10%）
        const pointsEarned = Math.floor(totalAmount * 10);
        this.addPoints(userId, pointsEarned, '购物奖励');
        
        // 更新消费总额
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.totalSpent += totalAmount;
            user.orderCount += 1;
        }
    }

    handlePaymentSuccess(paymentData) {
        console.log('Payment success:', paymentData);
    }

    /* 积分交易记录 */
    recordPointsTransaction(userId, points, type, reason, oldBalance, newBalance) {
        const transaction = {
            id: this.generateTransactionId(),
            userId: userId,
            points: points,
            type: type,
            reason: reason,
            oldBalance: oldBalance,
            newBalance: newBalance,
            timestamp: new Date().toISOString()
        };

        // 保存到本地存储
        const transactions = this.loadPointsTransactions();
        transactions.push(transaction);
        
        // 只保留最近1000条记录
        if (transactions.length > 1000) {
            transactions.splice(0, transactions.length - 1000);
        }
        
        localStorage.setItem('points_transactions', JSON.stringify(transactions));
    }

    loadPointsTransactions() {
        try {
            const transactions = localStorage.getItem('points_transactions');
            return transactions ? JSON.parse(transactions) : [];
        } catch (error) {
            console.error('Failed to load points transactions:', error);
            return [];
        }
    }

    getPointsTransactions(userId, limit = 20) {
        const transactions = this.loadPointsTransactions();
        return transactions
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /* 用户活动记录 */
    saveUserActivities() {
        try {
            localStorage.setItem('user_activities', JSON.stringify(this.userActivities));
        } catch (error) {
            console.error('Failed to save user activities:', error);
        }
    }

    loadUserActivities() {
        try {
            const activities = localStorage.getItem('user_activities');
            this.userActivities = activities ? JSON.parse(activities) : [];
        } catch (error) {
            console.error('Failed to load user activities:', error);
            this.userActivities = [];
        }
    }

    /* 数据工具方法 */
    getUser(userId) {
        return this.users.find(u => u.id === userId);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    sanitizeUserData(user) {
        // 移除敏感信息
        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.faceData;
        return sanitized;
    }

    validateUserData(userData) {
        // 验证用户数据
        if (!userData.username || userData.username.length < 3) {
            return false;
        }
        
        if (!userData.email || !this.isValidEmail(userData.email)) {
            return false;
        }
        
        if (!userData.password || userData.password.length < 6) {
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    hashPassword(password) {
        // 简化的密码哈希（实际项目中应使用bcrypt等库）
        return btoa(password);
    }

    generateAvatar(username) {
        // 生成用户头像URL
        const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', '06b6d4'];
        const color = colors[username.length % colors.length];
        return `https://via.placeholder.com/100x100/${color}/ffffff?text=${username.charAt(0)}`;
    }

    generateUserId() {
        return 'USER' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    generateActivityId() {
        return 'ACT' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    generateTransactionId() {
        return 'TXN' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    generateAddressId() {
        return 'ADDR' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
}

// 创建全局用户管理器实例
const userManager = new UserManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
} else {
    window.userManager = userManager;
}