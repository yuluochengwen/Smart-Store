/**
 * SmartStore Inventory Manager
 * 库存管理系统，支持商品CRUD操作、库存预警、批量管理
 */

class InventoryManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.suppliers = [];
        this.stockAlerts = [];
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initStockMonitoring();
    }

    /* 数据加载 */
    loadData() {
        // 从数据管理器加载数据
        if (typeof dataManager !== 'undefined') {
            this.products = dataManager.products || [];
            this.categories = dataManager.categories || [];
        }

        // 加载供应商数据
        this.suppliers = [
            { id: '1', name: '智能水供应商', contact: '138****1234', email: 'supplier1@example.com' },
            { id: '2', name: '零食批发商', contact: '139****5678', email: 'supplier2@example.com' },
            { id: '3', name: '日用品公司', contact: '137****9012', email: 'supplier3@example.com' },
            { id: '4', name: '电子科技', contact: '136****3456', email: 'supplier4@example.com' }
        ];

        // 初始化库存预警
        this.checkStockLevels();
    }

    setupEventListeners() {
        // 监听库存更新事件
        document.addEventListener('stockUpdated', (e) => {
            this.handleStockUpdate(e.detail);
        });

        // 监听商品添加事件
        document.addEventListener('productAdded', (e) => {
            this.handleProductAdded(e.detail);
        });

        // 监听商品删除事件
        document.addEventListener('productDeleted', (e) => {
            this.handleProductDeleted(e.detail);
        });
    }

    /* 商品管理 */
    addProduct(productData) {
        try {
            // 验证数据
            if (!this.validateProductData(productData)) {
                throw new Error('商品数据验证失败');
            }

            // 生成SKU
            const sku = this.generateSKU(productData);
            
            // 创建新商品
            const newProduct = {
                id: this.generateProductId(),
                sku: sku,
                name: productData.name,
                description: productData.description || '',
                category: productData.category,
                price: parseFloat(productData.price),
                originalPrice: parseFloat(productData.originalPrice) || parseFloat(productData.price),
                stock: parseInt(productData.stock) || 0,
                minStock: parseInt(productData.minStock) || 10,
                images: productData.images || [],
                specifications: productData.specifications || {},
                features: productData.features || [],
                tags: productData.tags || [],
                supplierId: productData.supplierId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sold: 0,
                rating: 0,
                reviews: 0,
                status: 'active'
            };

            this.products.push(newProduct);
            
            // 触发事件
            this.triggerEvent('productAdded', newProduct);
            
            // 检查库存预警
            this.checkStockLevels();
            
            return {
                success: true,
                product: newProduct,
                message: '商品添加成功'
            };
        } catch (error) {
            console.error('Add product failed:', error);
            return {
                success: false,
                message: error.message || '商品添加失败'
            };
        }
    }

    updateProduct(productId, updateData) {
        try {
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('商品不存在');
            }

            // 验证更新数据
            if (!this.validateProductData(updateData, true)) {
                throw new Error('商品数据验证失败');
            }

            // 更新商品信息
            const updatedProduct = {
                ...this.products[productIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            this.products[productIndex] = updatedProduct;
            
            // 触发事件
            this.triggerEvent('productUpdated', updatedProduct);
            
            // 检查库存预警
            this.checkStockLevels();
            
            return {
                success: true,
                product: updatedProduct,
                message: '商品更新成功'
            };
        } catch (error) {
            console.error('Update product failed:', error);
            return {
                success: false,
                message: error.message || '商品更新失败'
            };
        }
    }

    deleteProduct(productId) {
        try {
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('商品不存在');
            }

            const deletedProduct = this.products[productIndex];
            this.products.splice(productIndex, 1);
            
            // 触发事件
            this.triggerEvent('productDeleted', { productId, product: deletedProduct });
            
            return {
                success: true,
                message: '商品删除成功'
            };
        } catch (error) {
            console.error('Delete product failed:', error);
            return {
                success: false,
                message: error.message || '商品删除失败'
            };
        }
    }

    batchDeleteProducts(productIds) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        productIds.forEach(productId => {
            const result = this.deleteProduct(productId);
            results.push({ productId, ...result });
            
            if (result.success) {
                successCount++;
            } else {
                failureCount++;
            }
        });

        return {
            success: failureCount === 0,
            results: results,
            successCount: successCount,
            failureCount: failureCount,
            message: `成功删除 ${successCount} 个商品，失败 ${failureCount} 个`
        };
    }

    /* 库存管理 */
    updateStock(productId, quantity, operation = 'set', reason = '') {
        try {
            const product = this.getProduct(productId);
            if (!product) {
                throw new Error('商品不存在');
            }

            const oldStock = product.stock;
            let newStock = product.stock;

            switch (operation) {
                case 'set':
                    newStock = Math.max(0, quantity);
                    break;
                case 'add':
                    newStock = product.stock + quantity;
                    break;
                case 'subtract':
                    newStock = Math.max(0, product.stock - quantity);
                    break;
                default:
                    throw new Error('无效的操作类型');
            }

            // 更新库存
            product.stock = newStock;
            product.updatedAt = new Date().toISOString();

            // 记录库存变动
            this.recordStockChange(productId, oldStock, newStock, operation, reason);

            // 检查库存预警
            this.checkStockLevel(productId);

            // 触发事件
            this.triggerEvent('stockUpdated', {
                productId,
                oldStock,
                newStock,
                change: newStock - oldStock,
                operation,
                reason
            });

            return {
                success: true,
                oldStock,
                newStock,
                message: '库存更新成功'
            };
        } catch (error) {
            console.error('Update stock failed:', error);
            return {
                success: false,
                message: error.message || '库存更新失败'
            };
        }
    }

    recordStockChange(productId, oldStock, newStock, operation, reason) {
        const changeRecord = {
            id: this.generateStockChangeId(),
            productId,
            oldStock,
            newStock,
            change: newStock - oldStock,
            operation,
            reason,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId()
        };

        // 保存到本地存储
        const stockChanges = this.loadStockChanges();
        stockChanges.push(changeRecord);
        
        // 只保留最近1000条记录
        if (stockChanges.length > 1000) {
            stockChanges.splice(0, stockChanges.length - 1000);
        }
        
        localStorage.setItem('stock_changes', JSON.stringify(stockChanges));
    }

    loadStockChanges() {
        try {
            const changes = localStorage.getItem('stock_changes');
            return changes ? JSON.parse(changes) : [];
        } catch (error) {
            console.error('Failed to load stock changes:', error);
            return [];
        }
    }

    /* 库存预警 */
    initStockMonitoring() {
        // 定期检查库存水平
        setInterval(() => {
            this.checkStockLevels();
        }, 60000); // 每分钟检查一次
    }

    checkStockLevels() {
        const alerts = [];
        
        this.products.forEach(product => {
            const alertLevel = this.checkStockLevel(product.id);
            if (alertLevel !== 'normal') {
                alerts.push({
                    productId: product.id,
                    productName: product.name,
                    currentStock: product.stock,
                    minStock: product.minStock,
                    alertLevel: alertLevel,
                    timestamp: new Date().toISOString()
                });
            }
        });

        if (alerts.length > 0) {
            this.handleStockAlerts(alerts);
        }
    }

    checkStockLevel(productId) {
        const product = this.getProduct(productId);
        if (!product) return 'error';

        if (product.stock === 0) {
            return 'out_of_stock';
        } else if (product.stock <= product.minStock) {
            return 'low_stock';
        } else if (product.stock <= product.minStock * 2) {
            return 'warning';
        }
        
        return 'normal';
    }

    handleStockAlerts(alerts) {
        this.stockAlerts = alerts;
        
        // 触发库存预警事件
        this.triggerEvent('stockAlerts', alerts);
        
        // 显示预警通知
        alerts.forEach(alert => {
            let message = '';
            switch (alert.alertLevel) {
                case 'out_of_stock':
                    message = `商品 "${alert.productName}" 已缺货`;
                    break;
                case 'low_stock':
                    message = `商品 "${alert.productName}" 库存过低（当前：${alert.currentStock}，最低：${alert.minStock}）`;
                    break;
                case 'warning':
                    message = `商品 "${alert.productName}" 库存偏少，建议补货`;
                    break;
            }
            
            if (message) {
                smartStore.showToast(message, 'warning');
            }
        });
    }

    /* 数据分析 */
    getInventoryAnalytics() {
        const totalProducts = this.products.length;
        const totalStockValue = this.products.reduce((sum, p) => sum + (p.stock * p.price), 0);
        const totalStockQuantity = this.products.reduce((sum, p) => sum + p.stock, 0);
        const avgStockPerProduct = totalStockQuantity / totalProducts;
        
        const stockDistribution = {
            outOfStock: this.getOutOfStockProducts().length,
            lowStock: this.getLowStockProducts().length,
            normalStock: this.products.filter(p => p.stock > p.minStock && p.stock <= p.minStock * 2).length,
            highStock: this.products.filter(p => p.stock > p.minStock * 2).length
        };

        const categoryDistribution = {};
        this.categories.forEach(category => {
            categoryDistribution[category.id] = {
                name: category.name,
                count: this.products.filter(p => p.category === category.id).length,
                stockValue: this.products
                    .filter(p => p.category === category.id)
                    .reduce((sum, p) => sum + (p.stock * p.price), 0)
            };
        });

        return {
            totalProducts,
            totalStockValue,
            totalStockQuantity,
            avgStockPerProduct,
            stockDistribution,
            categoryDistribution,
            stockAlerts: this.stockAlerts.length
        };
    }

    getStockTrends(days = 30) {
        const stockChanges = this.loadStockChanges();
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const trends = {};
        
        stockChanges
            .filter(change => {
                const changeDate = new Date(change.timestamp);
                return changeDate >= startDate && changeDate <= endDate;
            })
            .forEach(change => {
                const date = new Date(change.timestamp).toDateString();
                if (!trends[date]) {
                    trends[date] = {};
                }
                
                if (!trends[date][change.productId]) {
                    trends[date][change.productId] = {
                        productName: this.getProduct(change.productId)?.name || 'Unknown',
                        totalChange: 0,
                        changes: []
                    };
                }
                
                trends[date][change.productId].totalChange += change.change;
                trends[date][change.productId].changes.push(change);
            });

        return trends;
    }

    /* 批量操作 */
    batchUpdateStock(updates) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        updates.forEach(update => {
            const result = this.updateStock(
                update.productId,
                update.quantity,
                update.operation,
                update.reason
            );
            
            results.push({
                productId: update.productId,
                ...result
            });
            
            if (result.success) {
                successCount++;
            } else {
                failureCount++;
            }
        });

        return {
            success: failureCount === 0,
            results: results,
            successCount: successCount,
            failureCount: failureCount,
            message: `成功更新 ${successCount} 个商品库存，失败 ${failureCount} 个`
        };
    }

    /* 数据验证 */
    validateProductData(data, isUpdate = false) {
        const requiredFields = ['name', 'price', 'category'];
        
        if (!isUpdate) {
            for (const field of requiredFields) {
                if (!data[field]) {
                    return false;
                }
            }
        }

        // 验证价格
        if (data.price && (isNaN(data.price) || parseFloat(data.price) <= 0)) {
            return false;
        }

        // 验证库存
        if (data.stock && (isNaN(data.stock) || parseInt(data.stock) < 0)) {
            return false;
        }

        // 验证分类
        if (data.category && !this.categories.find(c => c.id === data.category)) {
            return false;
        }

        return true;
    }

    /* 工具方法 */
    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    getProductsByCategory(categoryId) {
        return this.products.filter(p => p.category === categoryId);
    }

    getLowStockProducts() {
        return this.products.filter(p => p.stock <= p.minStock && p.stock > 0);
    }

    getOutOfStockProducts() {
        return this.products.filter(p => p.stock === 0);
    }

    searchProducts(query, filters = {}) {
        let results = this.products;

        // 搜索关键词
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 分类筛选
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }

        // 库存状态筛选
        if (filters.stockStatus) {
            switch (filters.stockStatus) {
                case 'in_stock':
                    results = results.filter(p => p.stock > 0);
                    break;
                case 'out_of_stock':
                    results = results.filter(p => p.stock === 0);
                    break;
                case 'low_stock':
                    results = results.filter(p => p.stock <= p.minStock);
                    break;
            }
        }

        return results;
    }

    generateSKU(productData) {
        const category = this.categories.find(c => c.id === productData.category);
        const categoryCode = category ? category.id.substring(0, 3).toUpperCase() : 'GEN';
        const timestamp = Date.now().toString().slice(-6);
        return `${categoryCode}-${timestamp}`;
    }

    generateProductId() {
        return 'PROD' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    generateStockChangeId() {
        return 'STK' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    getCurrentUserId() {
        // 从会话或本地存储获取当前用户ID
        const user = smartStore.getUser();
        return user ? user.id : 'admin';
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /* 事件处理器 */
    handleStockUpdate(data) {
        // 处理库存更新事件
        console.log('Stock updated:', data);
    }

    handleProductAdded(data) {
        // 处理商品添加事件
        console.log('Product added:', data);
    }

    handleProductDeleted(data) {
        // 处理商品删除事件
        console.log('Product deleted:', data);
    }

    /* 导入导出功能 */
    exportInventory(format = 'csv') {
        const data = this.products.map(product => ({
            SKU: product.sku,
            商品名称: product.name,
            分类: this.getCategoryName(product.category),
            价格: product.price,
            库存: product.stock,
            最低库存: product.minStock,
            描述: product.description
        }));

        if (format === 'csv') {
            return this.convertToCSV(data);
        } else if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    importInventory(csvData) {
        try {
            const lines = csvData.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const results = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const productData = {};
                    
                    headers.forEach((header, index) => {
                        productData[header] = values[index];
                    });

                    // 转换数据类型
                    productData.price = parseFloat(productData.价格);
                    productData.stock = parseInt(productData.库存);
                    productData.minStock = parseInt(productData.最低库存);
                    productData.category = this.getCategoryIdByName(productData.分类);

                    const result = this.addProduct(productData);
                    results.push(result);
                }
            }

            return {
                success: true,
                results: results,
                message: `成功导入 ${results.filter(r => r.success).length} 个商品`
            };
        } catch (error) {
            return {
                success: false,
                message: '导入失败：' + error.message
            };
        }
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }

    getCategoryIdByName(categoryName) {
        const category = this.categories.find(c => c.name === categoryName);
        return category ? category.id : 'other';
    }
}

// 创建全局库存管理器实例
const inventoryManager = new InventoryManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManager;
} else {
    window.inventoryManager = inventoryManager;
}