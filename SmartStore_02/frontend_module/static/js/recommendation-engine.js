/**
 * SmartStore Recommendation Engine
 * 智能推荐系统，基于用户行为和内容分析提供个性化推荐
 */

class RecommendationEngine {
    constructor() {
        this.userProfiles = new Map();
        this.itemProfiles = new Map();
        this.userItemMatrix = new Map();
        this.similarityCache = new Map();
        this.recommendationCache = new Map();
        this.config = {
            maxRecommendations: 10,
            minSimilarity: 0.1,
            cacheTimeout: 300000, // 5分钟
            enableContentBased: true,
            enableCollaborative: true,
            enableHybrid: true
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.buildInitialProfiles();
    }

    /* 数据加载和初始化 */
    loadData() {
        // 加载用户行为数据
        this.loadUserBehaviorData();
        
        // 加载商品内容数据
        this.loadItemContentData();
        
        // 构建用户-商品矩阵
        this.buildUserItemMatrix();
    }

    loadUserBehaviorData() {
        // 模拟用户行为数据
        if (typeof dataManager !== 'undefined' && typeof userManager !== 'undefined') {
            const users = userManager.users;
            const orders = dataManager.orders;
            
            users.forEach(user => {
                const userOrders = orders.filter(o => o.userId === user.id);
                const userBehaviors = {
                    purchases: [],
                    views: [],
                    searches: [],
                    ratings: []
                };
                
                userOrders.forEach(order => {
                    order.items.forEach(item => {
                        userBehaviors.purchases.push({
                            itemId: item.productId,
                            timestamp: order.date,
                            rating: 4.0, // 默认评分
                            implicit: true
                        });
                    });
                });
                
                this.userProfiles.set(user.id, {
                    id: user.id,
                    behaviors: userBehaviors,
                    preferences: user.preferences || {},
                    profileVector: this.buildUserProfileVector(user, userBehaviors)
                });
            });
        }
    }

    loadItemContentData() {
        // 加载商品内容特征
        if (typeof dataManager !== 'undefined') {
            const products = dataManager.products;
            
            products.forEach(product => {
                const itemProfile = {
                    id: product.id,
                    features: {
                        category: product.category,
                        price: product.price,
                        rating: product.rating,
                        tags: product.tags || [],
                        specifications: product.specifications || {},
                        features: product.features || []
                    },
                    contentVector: this.buildItemContentVector(product),
                    popularity: this.calculateItemPopularity(product)
                };
                
                this.itemProfiles.set(product.id, itemProfile);
            });
        }
    }

    buildInitialProfiles() {
        // 为所有用户构建初始推荐档案
        this.userProfiles.forEach((userProfile, userId) => {
            this.updateUserProfile(userId);
        });
    }

    /* 用户档案构建 */
    buildUserProfileVector(user, behaviors) {
        const vector = {
            categories: {},
            pricePreference: [0, 1000],
            brandPreference: {},
            featurePreference: {},
            temporalPattern: this.analyzeTemporalPattern(behaviors)
        };
        
        // 分析分类偏好
        behaviors.purchases.forEach(behavior => {
            const product = this.getProduct(behavior.itemId);
            if (product) {
                vector.categories[product.category] = 
                    (vector.categories[product.category] || 0) + 1;
            }
        });
        
        // 分析价格偏好
        const prices = behaviors.purchases
            .map(b => this.getProduct(b.itemId))
            .filter(p => p)
            .map(p => p.price);
        
        if (prices.length > 0) {
            vector.pricePreference = [
                Math.min(...prices) * 0.8,
                Math.max(...prices) * 1.2
            ];
        }
        
        return vector;
    }

    buildItemContentVector(item) {
        const vector = {
            category: item.category,
            price: item.price,
            rating: item.rating,
            popularity: item.sold || 0,
            recency: this.calculateRecencyScore(item),
            tags: item.tags || [],
            features: item.features || []
        };
        
        // 归一化处理
        return this.normalizeVector(vector);
    }

    calculateItemPopularity(product) {
        const recencyWeight = 0.3;
        const ratingWeight = 0.4;
        const salesWeight = 0.3;
        
        const recencyScore = this.calculateRecencyScore(product);
        const ratingScore = product.rating / 5.0;
        const salesScore = Math.min(product.sold / 1000, 1.0);
        
        return recencyWeight * recencyScore + 
               ratingWeight * ratingScore + 
               salesWeight * salesScore;
    }

    calculateRecencyScore(item) {
        if (!item.createdAt) return 0.5;
        
        const now = new Date();
        const createdAt = new Date(item.createdAt);
        const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
        
        // 指数衰减，30天内为1，超过90天为0
        return Math.exp(-daysDiff / 30);
    }

    analyzeTemporalPattern(behaviors) {
        const patterns = {
            hourOfDay: {},
            dayOfWeek: {},
            seasonality: {}
        };
        
        behaviors.purchases.forEach(behavior => {
            const date = new Date(behavior.timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            
            patterns.hourOfDay[hour] = (patterns.hourOfDay[hour] || 0) + 1;
            patterns.dayOfWeek[dayOfWeek] = (patterns.dayOfWeek[dayOfWeek] || 0) + 1;
        });
        
        return patterns;
    }

    /* 推荐算法 */
    getRecommendations(userId, options = {}) {
        const config = { ...this.config, ...options };
        const cacheKey = this.generateCacheKey(userId, config);
        
        // 检查缓存
        const cached = this.getCachedRecommendations(cacheKey);
        if (cached) {
            return cached;
        }
        
        let recommendations = [];
        
        if (config.enableHybrid && config.enableContentBased && config.enableCollaborative) {
            recommendations = this.getHybridRecommendations(userId, config);
        } else if (config.enableContentBased) {
            recommendations = this.getContentBasedRecommendations(userId, config);
        } else if (config.enableCollaborative) {
            recommendations = this.getCollaborativeRecommendations(userId, config);
        }
        
        // 缓存结果
        this.cacheRecommendations(cacheKey, recommendations);
        
        return recommendations;
    }

    getContentBasedRecommendations(userId, config) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return [];
        
        const userVector = userProfile.profileVector;
        const recommendations = [];
        
        this.itemProfiles.forEach((itemProfile, itemId) => {
            if (this.hasUserInteracted(userId, itemId)) return;
            
            const similarity = this.calculateContentSimilarity(userVector, itemProfile);
            if (similarity > config.minSimilarity) {
                recommendations.push({
                    itemId,
                    score: similarity,
                    reason: this.generateContentBasedReason(similarity, itemProfile, userVector)
                });
            }
        });
        
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxRecommendations);
    }

    getCollaborativeRecommendations(userId, config) {
        const similarities = this.calculateUserSimilarities(userId);
        const recommendations = [];
        
        // 找到最相似的用户
        const similarUsers = Array.from(similarities.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        similarUsers.forEach(([similarUserId, similarity]) => {
            if (similarity < config.minSimilarity) return;
            
            const similarUserProfile = this.userProfiles.get(similarUserId);
            if (!similarUserProfile) return;
            
            // 推荐相似用户喜欢但当前用户未交互的商品
            similarUserProfile.behaviors.purchases.forEach(behavior => {
                if (!this.hasUserInteracted(userId, behavior.itemId)) {
                    const existing = recommendations.find(r => r.itemId === behavior.itemId);
                    if (existing) {
                        existing.score += similarity * behavior.rating;
                    } else {
                        recommendations.push({
                            itemId: behavior.itemId,
                            score: similarity * behavior.rating,
                            reason: this.generateCollaborativeReason(similarity)
                        });
                    }
                }
            });
        });
        
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxRecommendations);
    }

    getHybridRecommendations(userId, config) {
        const contentBased = this.getContentBasedRecommendations(userId, config);
        const collaborative = this.getCollaborativeRecommendations(userId, config);
        
        const hybridScores = new Map();
        
        // 合并两种推荐结果
        contentBased.forEach(rec => {
            hybridScores.set(rec.itemId, {
                ...rec,
                score: rec.score * 0.6, // 内容推荐权重60%
                sources: ['content-based']
            });
        });
        
        collaborative.forEach(rec => {
            if (hybridScores.has(rec.itemId)) {
                const existing = hybridScores.get(rec.itemId);
                existing.score += rec.score * 0.4; // 协同推荐权重40%
                existing.sources.push('collaborative');
            } else {
                hybridScores.set(rec.itemId, {
                    ...rec,
                    score: rec.score * 0.4,
                    sources: ['collaborative']
                });
            }
        });
        
        return Array.from(hybridScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxRecommendations);
    }

    /* 相似度计算 */
    calculateContentSimilarity(userVector, itemProfile) {
        let score = 0;
        let weights = 0;
        
        // 分类相似度
        if (userVector.categories[itemProfile.features.category]) {
            score += userVector.categories[itemProfile.features.category] * 0.4;
            weights += 0.4;
        }
        
        // 价格相似度
        const [minPrice, maxPrice] = userVector.pricePreference;
        if (itemProfile.features.price >= minPrice && itemProfile.features.price <= maxPrice) {
            score += 0.3;
            weights += 0.3;
        }
        
        // 评分相似度
        score += (itemProfile.features.rating / 5.0) * 0.2;
        weights += 0.2;
        
        // 流行度相似度
        score += Math.min(itemProfile.popularity, 0.1);
        weights += 0.1;
        
        return weights > 0 ? score / weights : 0;
    }

    calculateUserSimilarities(userId) {
        if (this.similarityCache.has(userId)) {
            return this.similarityCache.get(userId);
        }
        
        const similarities = new Map();
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return similarities;
        
        this.userProfiles.forEach((otherProfile, otherUserId) => {
            if (userId === otherUserId) return;
            
            const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
            similarities.set(otherUserId, similarity);
        });
        
        // 缓存结果
        this.similarityCache.set(userId, similarities);
        
        return similarities;
    }

    calculateUserSimilarity(userProfile1, userProfile2) {
        // 基于共同购买商品的相似度计算
        const user1Items = new Set(userProfile1.behaviors.purchases.map(b => b.itemId));
        const user2Items = new Set(userProfile2.behaviors.purchases.map(b => b.itemId));
        
        const intersection = new Set([...user1Items].filter(x => user2Items.has(x)));
        const union = new Set([...user1Items, ...user2Items]);
        
        if (union.size === 0) return 0;
        
        const jaccardSimilarity = intersection.size / union.size;
        
        // 考虑评分相似度
        let ratingSimilarity = 0;
        let commonItems = 0;
        
        intersection.forEach(itemId => {
            const rating1 = this.getUserRating(userProfile1, itemId);
            const rating2 = this.getUserRating(userProfile2, itemId);
            
            if (rating1 && rating2) {
                ratingSimilarity += 1 - Math.abs(rating1 - rating2) / 4;
                commonItems++;
            }
        });
        
        if (commonItems > 0) {
            ratingSimilarity /= commonItems;
        }
        
        return (jaccardSimilarity * 0.7 + ratingSimilarity * 0.3);
    }

    getUserRating(userProfile, itemId) {
        const behavior = userProfile.behaviors.purchases.find(b => b.itemId === itemId);
        return behavior ? behavior.rating : null;
    }

    hasUserInteracted(userId, itemId) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return false;
        
        return userProfile.behaviors.purchases.some(b => b.itemId === itemId);
    }

    /* 推荐理由生成 */
    generateContentBasedReason(similarity, itemProfile, userVector) {
        const reasons = [];
        
        if (userVector.categories[itemProfile.features.category]) {
            reasons.push('基于您的分类偏好');
        }
        
        const [minPrice, maxPrice] = userVector.pricePreference;
        if (itemProfile.features.price >= minPrice && itemProfile.features.price <= maxPrice) {
            reasons.push('符合您的价格偏好');
        }
        
        if (itemProfile.features.rating >= 4.0) {
            reasons.push('高分好评商品');
        }
        
        return reasons.join('，');
    }

    generateCollaborativeReason(similarity) {
        const similarityPercent = Math.round(similarity * 100);
        return `与您的购物习惯${similarityPercent}%相似的用户也喜欢`;
    }

    /* 实时更新 */
    updateUserProfile(userId, behavior) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return;
        
        // 更新用户行为
        userProfile.behaviors.purchases.push({
            itemId: behavior.itemId,
            timestamp: behavior.timestamp,
            rating: behavior.rating || 4.0,
            implicit: behavior.implicit || false
        });
        
        // 重新计算用户档案向量
        userProfile.profileVector = this.buildUserProfileVector(
            { preferences: userProfile.preferences },
            userProfile.behaviors
        );
        
        // 清除缓存
        this.clearUserCache(userId);
    }

    updateItemProfile(itemId, updates) {
        const itemProfile = this.itemProfiles.get(itemId);
        if (!itemProfile) return;
        
        // 更新商品特征
        Object.assign(itemProfile.features, updates);
        
        // 重新计算内容向量
        const product = this.getProduct(itemId);
        if (product) {
            itemProfile.contentVector = this.buildItemContentVector(product);
        }
        
        // 清除相关缓存
        this.clearItemCache(itemId);
    }

    /* 缓存管理 */
    generateCacheKey(userId, config) {
        return `${userId}_${JSON.stringify(config)}_${Date.now()}`;
    }

    getCachedRecommendations(cacheKey) {
        const cached = this.recommendationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return cached.recommendations;
        }
        return null;
    }

    cacheRecommendations(cacheKey, recommendations) {
        this.recommendationCache.set(cacheKey, {
            recommendations,
            timestamp: Date.now()
        });
    }

    clearUserCache(userId) {
        this.similarityCache.delete(userId);
        this.recommendationCache.forEach((value, key) => {
            if (key.startsWith(userId)) {
                this.recommendationCache.delete(key);
            }
        });
    }

    clearItemCache(itemId) {
        this.recommendationCache.clear(); // 简单实现，清除所有缓存
    }

    /* 工具方法 */
    normalizeVector(vector) {
        // 简单的向量归一化
        const normalized = { ...vector };
        
        if (typeof vector.price === 'number') {
            normalized.price = Math.min(vector.price / 1000, 1);
        }
        
        if (typeof vector.rating === 'number') {
            normalized.rating = vector.rating / 5;
        }
        
        if (typeof vector.popularity === 'number') {
            normalized.popularity = Math.min(vector.popularity / 1000, 1);
        }
        
        return normalized;
    }

    getProduct(productId) {
        if (typeof dataManager !== 'undefined') {
            return dataManager.getProduct(productId);
        }
        return null;
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    setupEventListeners() {
        // 监听用户行为变化
        document.addEventListener('userBehaviorUpdated', (e) => {
            this.updateUserProfile(e.detail.userId, e.detail.behavior);
        });
        
        // 监听商品信息变化
        document.addEventListener('itemInfoUpdated', (e) => {
            this.updateItemProfile(e.detail.itemId, e.detail.updates);
        });
        
        // 定期清理缓存
        setInterval(() => {
            this.cleanupCache();
        }, 300000); // 每5分钟清理一次缓存
    }

    cleanupCache() {
        const now = Date.now();
        
        // 清理过期的推荐缓存
        this.recommendationCache.forEach((value, key) => {
            if (now - value.timestamp > this.config.cacheTimeout) {
                this.recommendationCache.delete(key);
            }
        });
        
        // 清理相似度缓存
        this.similarityCache.clear();
    }
}

// 创建全局推荐引擎实例
const recommendationEngine = new RecommendationEngine();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
} else {
    window.recommendationEngine = recommendationEngine;
}