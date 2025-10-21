/**
 * SmartStore Data Manager
 * 数据管理和API交互模块
 */

class DataManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.users = [];
        this.orders = [];
        this.init();
    }

    init() {
        this.initializeMockData();
        this.setupEventListeners();
    }

    /* 初始化模拟数据 */
    initializeMockData() {
        // 商品分类
        this.categories = [
            { id: 'beverages', name: '饮料', icon: 'fas fa-glass-whiskey', color: 'blue' },
            { id: 'snacks', name: '零食', icon: 'fas fa-cookie-bite', color: 'green' },
            { id: 'daily', name: '日用品', icon: 'fas fa-toothbrush', color: 'purple' },
            { id: 'electronics', name: '电子产品', icon: 'fas fa-headphones', color: 'orange' }
        ];

        // 商品数据
        this.products = [
            {
                id: '1',
                name: '智能矿泉水',
                price: 3.50,
                originalPrice: 4.00,
                category: 'beverages',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/assets.puxiang.com/c591e88411d456604070ac89fbdced39691b1e13.jpeg',
                    'https://via.placeholder.com/600x600/1e40af/ffffff?text=矿泉水详情1',
                    'https://via.placeholder.com/600x600/1d4ed8/ffffff?text=矿泉水详情2'
                ],
                description: '这款智能矿泉水采用最先进的净化技术，源自深层地下水，经过多重过滤和矿化处理，保留人体所需的矿物质元素。智能包装能够实时监测水质状态，确保每一滴水都新鲜纯净。',
                specifications: {
                    '品牌': 'SmartWater',
                    '规格': '550ml',
                    '保质期': '12个月',
                    '储存条件': '阴凉干燥处',
                    '生产日期': '2024-01-15',
                    '营养成分': '富含钙、镁、钾等矿物质',
                    '包装材质': '食品级PET材料',
                    '智能功能': '水质监测、温度显示'
                },
                stock: 150,
                minStock: 20,
                sold: 45,
                rating: 4.5,
                reviews: 128,
                tags: ['智能', '健康', '矿物质'],
                features: ['水质监测', '温度显示', '便携设计']
            },
            {
                id: '2',
                name: '有机薯片',
                price: 8.90,
                originalPrice: 10.90,
                category: 'snacks',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/img.freepik.com/9dd5455dbb76c6c37b8e5e42302b94a21eaebcba.jpg',
                    'https://via.placeholder.com/600x600/f59e0b/ffffff?text=薯片详情1',
                    'https://via.placeholder.com/600x600/d97706/ffffff?text=薯片详情2'
                ],
                description: '选用优质土豆，采用低温真空油炸技术，保留土豆的天然风味和营养成分。无添加防腐剂，口感酥脆，是健康美味的零食选择。',
                specifications: {
                    '品牌': 'Organic Chips',
                    '净含量': '100g',
                    '口味': '原味',
                    '保质期': '9个月',
                    '储存方法': '阴凉干燥处，避免阳光直射',
                    '原料': '土豆、植物油、食用盐',
                    '认证': '有机产品认证'
                },
                stock: 80,
                minStock: 15,
                sold: 123,
                rating: 4.2,
                reviews: 89,
                tags: ['有机', '健康', '酥脆'],
                features: ['无防腐剂', '低温油炸', '有机认证']
            },
            {
                id: '3',
                name: '智能牙刷',
                price: 29.90,
                originalPrice: 39.90,
                category: 'daily',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/cdnp1.stackassets.com/81582b1cf64eeeb00725e13ac9e2808b69b91a07.jpg',
                    'https://via.placeholder.com/600x600/10b981/ffffff?text=牙刷详情1',
                    'https://via.placeholder.com/600x600/059669/ffffff?text=牙刷详情2'
                ],
                description: 'AI智能感应电动牙刷，配备多种清洁模式，智能提醒更换刷头。采用声波技术，每分钟震动31000次，深度清洁牙齿，保护牙龈健康。',
                specifications: {
                    '品牌': 'SmartBrush',
                    '型号': 'SB-2024',
                    '震动频率': '31000次/分钟',
                    '电池容量': '2000mAh',
                    '充电时间': '4小时',
                    '使用时间': '30天',
                    '防水等级': 'IPX7',
                    '智能功能': '压力感应、定时提醒、刷头更换提醒'
                },
                stock: 45,
                minStock: 10,
                sold: 67,
                rating: 4.8,
                reviews: 156,
                tags: ['智能', '声波', '防水'],
                features: ['AI智能感应', '多种模式', '长续航']
            },
            {
                id: '4',
                name: '无线耳机',
                price: 199.00,
                originalPrice: 299.00,
                category: 'electronics',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/img.freepik.com/db1f3a183e6927edd9c5ad2a6b9061883caf567b.jpg',
                    'https://via.placeholder.com/600x600/8b5cf6/ffffff?text=耳机详情1',
                    'https://via.placeholder.com/600x600/7c3aed/ffffff?text=耳机详情2'
                ],
                description: '高品质真无线蓝牙耳机，采用先进的降噪技术，提供沉浸式音乐体验。支持快速充电，单次使用可达8小时，配合充电盒总续航32小时。',
                specifications: {
                    '品牌': 'SoundWave',
                    '型号': 'SW-TWS2024',
                    '蓝牙版本': '5.3',
                    '降噪深度': '35dB',
                    '电池续航': '8小时+24小时',
                    '充电时间': '1.5小时',
                    '防水等级': 'IPX5',
                    '音频编码': 'AAC, SBC'
                },
                stock: 25,
                minStock: 5,
                sold: 89,
                rating: 4.6,
                reviews: 234,
                tags: ['无线', '降噪', '长续航'],
                features: ['主动降噪', '快速充电', '高清音质']
            },
            {
                id: '5',
                name: '功能饮料',
                price: 6.50,
                originalPrice: 8.00,
                category: 'beverages',
                images: [
                    'https://via.placeholder.com/300x300/ef4444/ffffff?text=功能饮料',
                    'https://via.placeholder.com/600x600/ef4444/ffffff?text=饮料详情1',
                    'https://via.placeholder.com/600x600/dc2626/ffffff?text=饮料详情2'
                ],
                description: '专业运动功能饮料，含有牛磺酸、维生素B族和电解质，能够快速补充能量，缓解疲劳。适合运动、工作、学习等多种场景。',
                specifications: {
                    '品牌': 'Energy+',
                    '规格': '250ml',
                    '口味': '柑橘味',
                    '保质期': '18个月',
                    '储存条件': '常温保存，避免高温',
                    '主要成分': '牛磺酸、维生素B族、电解质',
                    '适用场景': '运动、工作、学习'
                },
                stock: 120,
                minStock: 30,
                sold: 234,
                rating: 4.3,
                reviews: 178,
                tags: ['功能', '提神', '运动'],
                features: ['快速补充能量', '缓解疲劳', '多种场景适用']
            },
            {
                id: '6',
                name: '坚果组合',
                price: 15.90,
                originalPrice: 18.90,
                category: 'snacks',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/www.hamptonfarms.com/3e5ab16cc671fc5588bbe90b74e2043e71c7d278.jpg',
                    'https://via.placeholder.com/600x600/84cc16/ffffff?text=坚果详情1',
                    'https://via.placeholder.com/600x600/65a30d/ffffff?text=坚果详情2'
                ],
                description: '精选多种坚果混合，包括核桃、杏仁、腰果、榛子等，富含蛋白质、不饱和脂肪酸和维生素E。无添加，天然健康，是理想的营养零食。',
                specifications: {
                    '品牌': 'NutMix',
                    '净含量': '200g',
                    '配料': '核桃、杏仁、腰果、榛子',
                    '保质期': '12个月',
                    '储存方法': '密封保存，避免潮湿',
                    '营养成分': '蛋白质、不饱和脂肪酸、维生素E',
                    '适用人群': '所有人群'
                },
                stock: 60,
                minStock: 15,
                sold: 156,
                rating: 4.7,
                reviews: 203,
                tags: ['坚果', '健康', '营养'],
                features: ['多种坚果混合', '无添加', '营养丰富']
            },
            {
                id: '7',
                name: '护手霜',
                price: 12.80,
                originalPrice: 16.80,
                category: 'daily',
                images: [
                    'https://via.placeholder.com/300x300/f97316/ffffff?text=护手霜',
                    'https://via.placeholder.com/600x600/f97316/ffffff?text=护手霜详情1',
                    'https://via.placeholder.com/600x600/ea580c/ffffff?text=护手霜详情2'
                ],
                description: '滋润保湿护手霜，含有天然植物精华和维生素E，能够快速渗透肌肤，深层滋润，修复干燥粗糙的双手。质地清爽不油腻，适合日常使用。',
                specifications: {
                    '品牌': 'HandCare',
                    '规格': '50ml',
                    '香型': '淡雅花香',
                    '保质期': '3年',
                    '主要成分': '甘油、维生素E、芦荟提取物',
                    '适用肤质': '所有肤质',
                    '功效': '滋润保湿、修复干裂'
                },
                stock: 90,
                minStock: 20,
                sold: 78,
                rating: 4.4,
                reviews: 145,
                tags: ['滋润', '保湿', '修复'],
                features: ['快速渗透', '清爽不油腻', '天然成分']
            },
            {
                id: '8',
                name: '充电宝',
                price: 89.00,
                originalPrice: 129.00,
                category: 'electronics',
                images: [
                    'https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/c03ed9ae6d6a0026ffdcdb29b7d176ed545c7246.jpg',
                    'https://via.placeholder.com/600x600/6366f1/ffffff?text=充电宝详情1',
                    'https://via.placeholder.com/600x600/4f46e5/ffffff?text=充电宝详情2'
                ],
                description: '大容量快充移动电源，20000mAh大容量，支持PD快充协议，可为多种设备快速充电。配备LED数显屏，实时显示剩余电量。多重安全保护，使用更安心。',
                specifications: {
                    '品牌': 'PowerBoost',
                    '容量': '20000mAh',
                    '输入接口': 'USB-C, Micro-USB',
                    '输出接口': '2 x USB-A, 1 x USB-C',
                    '快充协议': 'PD3.0, QC3.0, AFC, FCP',
                    '尺寸': '150 x 70 x 25mm',
                    '重量': '450g',
                    '安全保护': '过充、过放、短路、温度保护'
                },
                stock: 35,
                minStock: 8,
                sold: 145,
                rating: 4.5,
                reviews: 267,
                tags: ['快充', '大容量', '便携'],
                features: ['PD快充', 'LED数显', '多重保护']
            }
        ];

        // 用户数据
        this.users = [
            {
                id: '1',
                username: 'test_user',
                email: 'test@example.com',
                phone: '138****8888',
                avatar: 'https://via.placeholder.com/100x100/3b82f6/ffffff?text=用户',
                points: 1280,
                level: 'VIP会员',
                joinDate: '2023-01-15',
                faceRegistered: false
            }
        ];

        // 订单数据
        this.orders = [
            {
                id: '2024123456789',
                userId: '1',
                items: [
                    { productId: '1', quantity: 2, price: 3.50 },
                    { productId: '2', quantity: 1, price: 8.90 }
                ],
                total: 16.80,
                status: 'completed',
                date: '2024-01-15 14:30:25',
                paymentMethod: 'face_payment'
            },
            {
                id: '2024123456790',
                userId: '1',
                items: [
                    { productId: '3', quantity: 1, price: 29.90 },
                    { productId: '7', quantity: 1, price: 12.80 }
                ],
                total: 42.70,
                status: 'processing',
                date: '2024-01-10 10:15:30',
                paymentMethod: 'qr_payment'
            }
        ];
    }

    /* 事件监听器 */
    setupEventListeners() {
        // 监听购物车更新事件
        document.addEventListener('cartUpdated', (e) => {
            this.updateCartAnalytics(e.detail);
        });

        // 监听用户登录事件
        document.addEventListener('userLoggedIn', (e) => {
            this.updateUserSession(e.detail);
        });

        // 监听支付完成事件
        document.addEventListener('paymentCompleted', (e) => {
            this.processOrder(e.detail);
        });
    }

    /* 商品相关方法 */
    getProducts(filters = {}) {
        let filtered = [...this.products];

        // 分类筛选
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // 价格筛选
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(p => {
                if (max) {
                    return p.price >= min && p.price <= max;
                }
                return p.price >= min;
            });
        }

        // 搜索筛选
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 排序
        if (filters.sort) {
            switch (filters.sort) {
                case 'price-low':
                    filtered.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filtered.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    filtered.sort((a, b) => b.rating - a.rating);
                    break;
                case 'sold':
                    filtered.sort((a, b) => b.sold - a.sold);
                    break;
                default:
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        return filtered;
    }

    getProduct(id) {
        return this.products.find(p => p.id === id);
    }

    getProductsByCategory(categoryId) {
        return this.products.filter(p => p.category === categoryId);
    }

    getRelatedProducts(productId, limit = 4) {
        const product = this.getProduct(productId);
        if (!product) return [];

        return this.products
            .filter(p => p.id !== productId && p.category === product.category)
            .slice(0, limit);
    }

    searchProducts(query, limit = 10) {
        const results = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        );
        return results.slice(0, limit);
    }

    /* 库存管理 */
    updateStock(productId, quantity, operation = 'set') {
        const product = this.getProduct(productId);
        if (!product) return false;

        if (operation === 'set') {
            product.stock = Math.max(0, quantity);
        } else if (operation === 'add') {
            product.stock += quantity;
        } else if (operation === 'subtract') {
            product.stock = Math.max(0, product.stock - quantity);
        }

        // 触发库存更新事件
        this.triggerEvent('stockUpdated', { productId, stock: product.stock });
        return true;
    }

    checkStock(productId, quantity = 1) {
        const product = this.getProduct(productId);
        return product ? product.stock >= quantity : false;
    }

    getLowStockProducts() {
        return this.products.filter(p => p.stock <= p.minStock);
    }

    getOutOfStockProducts() {
        return this.products.filter(p => p.stock === 0);
    }

    /* 用户管理 */
    getUser(userId) {
        return this.users.find(u => u.id === userId);
    }

    updateUser(userId, userData) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;

        this.users[userIndex] = { ...this.users[userIndex], ...userData };
        this.triggerEvent('userUpdated', this.users[userIndex]);
        return true;
    }

    registerFace(userId, faceData) {
        const user = this.getUser(userId);
        if (!user) return false;

        user.faceRegistered = true;
        user.faceData = faceData;
        this.triggerEvent('faceRegistered', { userId });
        return true;
    }

    /* 订单管理 */
    createOrder(userId, items, paymentMethod) {
        const orderId = 'ORD' + Date.now();
        let total = 0;

        // 计算总价并检查库存
        for (const item of items) {
            const product = this.getProduct(item.productId);
            if (!product || !this.checkStock(item.productId, item.quantity)) {
                return { success: false, message: '库存不足' };
            }
            total += product.price * item.quantity;
        }

        // 创建订单
        const order = {
            id: orderId,
            userId: userId,
            items: items.map(item => {
                const product = this.getProduct(item.productId);
                return {
                    productId: item.productId,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.images[0]
                };
            }),
            total: total,
            status: 'pending',
            date: new Date().toISOString(),
            paymentMethod: paymentMethod
        };

        this.orders.push(order);

        // 扣减库存
        for (const item of items) {
            this.updateStock(item.productId, item.quantity, 'subtract');
        }

        this.triggerEvent('orderCreated', order);
        return { success: true, orderId: orderId };
    }

    getUserOrders(userId) {
        return this.orders.filter(o => o.userId === userId);
    }

    updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return false;

        order.status = status;
        this.triggerEvent('orderStatusUpdated', { orderId, status });
        return true;
    }

    /* 推荐系统 */
    getRecommendations(userId, type = 'personalized', limit = 6) {
        const user = this.getUser(userId);
        if (!user) return this.getPopularProducts(limit);

        switch (type) {
            case 'personalized':
                return this.getPersonalizedRecommendations(userId, limit);
            case 'popular':
                return this.getPopularProducts(limit);
            case 'recent':
                return this.getRecentProducts(limit);
            default:
                return this.getPopularProducts(limit);
        }
    }

    getPersonalizedRecommendations(userId, limit = 6) {
        const userOrders = this.getUserOrders(userId);
        const purchasedCategories = new Set();

        // 获取用户购买过的商品分类
        userOrders.forEach(order => {
            order.items.forEach(item => {
                const product = this.getProduct(item.productId);
                if (product) {
                    purchasedCategories.add(product.category);
                }
            });
        });

        // 推荐同类别的其他商品
        const recommendations = this.products.filter(p => 
            purchasedCategories.has(p.category) &&
            !userOrders.some(order => 
                order.items.some(item => item.productId === p.id)
            )
        );

        return recommendations.slice(0, limit);
    }

    getPopularProducts(limit = 6) {
        return this.products
            .sort((a, b) => b.sold - a.sold)
            .slice(0, limit);
    }

    getRecentProducts(limit = 6) {
        return this.products
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    /* 搜索功能 */
    searchProducts(query, filters = {}) {
        let results = this.products.filter(product => {
            const matchesQuery = 
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase()) ||
                product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

            const matchesCategory = !filters.category || product.category === filters.category;
            const matchesPrice = !filters.priceRange || this.matchesPriceRange(product.price, filters.priceRange);

            return matchesQuery && matchesCategory && matchesPrice;
        });

        // 排序
        if (filters.sort) {
            results = this.sortProducts(results, filters.sort);
        }

        return {
            results: results,
            total: results.length,
            query: query
        };
    }

    matchesPriceRange(price, range) {
        const [min, max] = range.split('-').map(p => p ? parseFloat(p) : null);
        if (min && max) {
            return price >= min && price <= max;
        } else if (min) {
            return price >= min;
        } else if (max) {
            return price <= max;
        }
        return true;
    }

    sortProducts(products, sortBy) {
        const sorted = [...products];
        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'sold':
                return sorted.sort((a, b) => b.sold - a.sold);
            case 'newest':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            default:
                return sorted;
        }
    }

    /* 分析统计 */
    getAnalytics() {
        const totalProducts = this.products.length;
        const totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);
        const lowStockProducts = this.getLowStockProducts().length;
        const outOfStockProducts = this.getOutOfStockProducts().length;
        const totalSales = this.products.reduce((sum, p) => sum + (p.sold * p.price), 0);

        return {
            totalProducts,
            totalStock,
            lowStockProducts,
            outOfStockProducts,
            totalSales,
            avgRating: this.products.reduce((sum, p) => sum + p.rating, 0) / this.products.length
        };
    }

    /* 事件系统 */
    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /* 工具方法 */
    formatPrice(price) {
        return `¥${price.toFixed(2)}`;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /* 本地存储 */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.dataManager = dataManager;
}