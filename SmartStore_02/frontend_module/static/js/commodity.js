/**
 * SmartStore Commodity JavaScript
 * 商品列表和详情页面交互功能
 */

class CommodityManager {
    constructor() {
        this.currentProduct = null;
        this.quantity = 1;
        this.currentImageIndex = 0;
        this.init();
    }

    init() {
        this.initProductDetail();
        this.initImageGallery();
        this.initQuantityControls();
        this.initTabs();
        this.initReviews();
        this.initRelatedProducts();
    }

    /* Product Detail Page */
    initProductDetail() {
        // Mock product data for detail page
        this.currentProduct = {
            id: '1',
            name: '智能矿泉水',
            price: 3.50,
            originalPrice: 4.00,
            category: 'beverages',
            stock: 150,
            sold: 45,
            rating: 4.5,
            images: [
                'https://via.placeholder.com/600x600/3b82f6/ffffff?text=矿泉水主图',
                'https://via.placeholder.com/600x600/1e40af/ffffff?text=矿泉水详情1',
                'https://via.placeholder.com/600x600/1d4ed8/ffffff?text=矿泉水详情2'
            ],
            description: '这款智能矿泉水采用最先进的净化技术，源自深层地下水，经过多重过滤和矿化处理，保留人体所需的矿物质元素。智能包装能够实时监测水质状态，确保每一滴水都新鲜纯净。适合日常饮用、运动后补水等多种场景。',
            specifications: {
                '品牌': 'SmartWater',
                '规格': '550ml',
                '保质期': '12个月',
                '储存条件': '阴凉干燥处',
                '生产日期': '2024-01-15',
                '营养成分': '富含钙、镁、钾等矿物质',
                '包装材质': '食品级PET材料',
                '智能功能': '水质监测、温度显示'
            }
        };

        this.updateProductDisplay();
    }

    updateProductDisplay() {
        if (!this.currentProduct) return;

        // Update basic info
        document.getElementById('product-name').textContent = this.currentProduct.name;
        document.getElementById('product-price').textContent = this.currentProduct.price.toFixed(2);
        document.getElementById('original-price').textContent = this.currentProduct.originalPrice.toFixed(2);
        document.getElementById('stock-count').textContent = this.currentProduct.stock;
        document.getElementById('sold-count').textContent = this.currentProduct.sold;
        document.getElementById('breadcrumb-product-name').textContent = this.currentProduct.name;

        // Calculate discount
        const discount = Math.round((1 - this.currentProduct.price / this.currentProduct.originalPrice) * 100);
        document.getElementById('discount-percent').textContent = discount;

        // Update description
        document.getElementById('product-description').textContent = this.currentProduct.description;

        // Update main image
        const mainImage = document.querySelector('#main-image img');
        if (mainImage && this.currentProduct.images.length > 0) {
            mainImage.src = this.currentProduct.images[0];
        }
    }

    /* Image Gallery */
    initImageGallery() {
        const thumbnails = document.querySelectorAll('.image-thumbnail');
        const mainImage = document.querySelector('#main-image img');

        thumbnails.forEach((thumbnail, index) => {
            const img = thumbnail.querySelector('img');
            if (img && this.currentProduct && this.currentProduct.images[index]) {
                img.src = this.currentProduct.images[index];
            }

            thumbnail.addEventListener('click', () => {
                this.switchImage(index);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.currentImageIndex > 0) {
                this.switchImage(this.currentImageIndex - 1);
            } else if (e.key === 'ArrowRight' && this.currentImageIndex < this.currentProduct.images.length - 1) {
                this.switchImage(this.currentImageIndex + 1);
            }
        });
    }

    switchImage(index) {
        if (!this.currentProduct || !this.currentProduct.images[index]) return;

        this.currentImageIndex = index;
        const mainImage = document.querySelector('#main-image img');
        if (mainImage) {
            mainImage.src = this.currentProduct.images[index];
        }

        // Update thumbnail borders
        document.querySelectorAll('.image-thumbnail').forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('border-blue-500');
                thumb.classList.remove('border-gray-300');
            } else {
                thumb.classList.remove('border-blue-500');
                thumb.classList.add('border-gray-300');
            }
        });
    }

    /* Quantity Controls */
    initQuantityControls() {
        const minusBtn = document.getElementById('quantity-minus');
        const plusBtn = document.getElementById('quantity-plus');
        const quantityInput = document.getElementById('quantity');

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                if (this.quantity > 1) {
                    this.quantity--;
                    this.updateQuantityDisplay();
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                if (this.quantity < this.currentProduct.stock) {
                    this.quantity++;
                    this.updateQuantityDisplay();
                }
            });
        }

        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= this.currentProduct.stock) {
                    this.quantity = value;
                } else {
                    e.target.value = this.quantity;
                }
            });
        }

        // Add to cart and buy now buttons
        const addToCartBtn = document.getElementById('add-to-cart');
        const buyNowBtn = document.getElementById('buy-now');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => this.buyNow());
        }
    }

    updateQuantityDisplay() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.value = this.quantity;
        }
    }

    addToCart() {
        if (!this.currentProduct) return;

        const productToAdd = {
            ...this.currentProduct,
            quantity: this.quantity
        };

        smartStore.addToCart(productToAdd);
        
        // Add animation effect
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                addToCartBtn.style.transform = 'scale(1)';
            }, 150);
        }
    }

    buyNow() {
        if (!this.currentProduct) return;

        const productToAdd = {
            ...this.currentProduct,
            quantity: this.quantity
        };

        smartStore.addToCart(productToAdd);
        
        // Redirect to payment page
        setTimeout(() => {
            window.location.href = '/user/payment';
        }, 500);
    }

    /* Product Tabs */
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.textContent.trim();
                this.switchTab(targetTab);
            });
        });

        // Initialize specifications
        this.initSpecifications();
    }

    switchTab(tabName) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            if (button.textContent.trim() === tabName) {
                button.classList.add('border-blue-600', 'text-blue-600');
                button.classList.remove('border-transparent', 'text-gray-500');
            } else {
                button.classList.remove('border-blue-600', 'text-blue-600');
                button.classList.add('border-transparent', 'text-gray-500');
            }
        });

        tabContents.forEach(content => {
            content.classList.add('hidden');
        });

        // Show relevant tab content
        if (tabName === '商品详情') {
            document.getElementById('tab-description').classList.remove('hidden');
        } else if (tabName === '规格参数') {
            document.getElementById('tab-specifications').classList.remove('hidden');
        } else if (tabName === '用户评价') {
            document.getElementById('tab-reviews').classList.remove('hidden');
        }
    }

    initSpecifications() {
        const specsTable = document.getElementById('specifications-table');
        if (!specsTable || !this.currentProduct) return;

        const specs = this.currentProduct.specifications;
        specsTable.innerHTML = Object.entries(specs).map(([key, value]) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="font-medium text-gray-700">${key}</span>
                <span class="text-gray-600">${value}</span>
            </div>
        `).join('');
    }

    /* Reviews System */
    initReviews() {
        this.loadReviews();
    }

    loadReviews() {
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;

        // Mock review data
        const reviews = [
            {
                id: 1,
                userName: '张先生',
                rating: 5,
                date: '2024-01-10',
                comment: '非常好的产品，包装精美，水质纯净，智能功能很实用。',
                images: ['https://via.placeholder.com/100x100/3b82f6/ffffff?text=评价图1'],
                helpful: 12,
                verified: true
            },
            {
                id: 2,
                userName: '李女士',
                rating: 4,
                date: '2024-01-08',
                comment: '质量不错，价格合理，就是配送有点慢。',
                images: [],
                helpful: 8,
                verified: true
            },
            {
                id: 3,
                userName: '王先生',
                rating: 5,
                date: '2024-01-05',
                comment: '第二次购买了，全家人都很喜欢，会继续支持的！',
                images: [
                    'https://via.placeholder.com/100x100/3b82f6/ffffff?text=评价图1',
                    'https://via.placeholder.com/100x100/1e40af/ffffff?text=评价图2'
                ],
                helpful: 15,
                verified: true
            }
        ];

        reviewsList.innerHTML = reviews.map(review => `
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-start space-x-4">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${review.userName.charAt(0)}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <h4 class="font-semibold text-gray-900">${review.userName}</h4>
                            ${review.verified ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">已验证购买</span>' : ''}
                            <span class="text-gray-500 text-sm">${review.date}</span>
                        </div>
                        <div class="flex text-yellow-400 mb-2">
                            ${this.renderStars(review.rating)}
                        </div>
                        <p class="text-gray-700 mb-3">${review.comment}</p>
                        ${review.images.length > 0 ? `
                            <div class="flex space-x-2 mb-3">
                                ${review.images.map(img => `
                                    <img src="${img}" alt="评价图片" class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80">
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <button class="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                                <i class="far fa-thumbs-up"></i>
                                <span>有用 (${review.helpful})</span>
                            </button>
                            <button class="hover:text-blue-600 transition-colors">回复</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /* Related Products */
    initRelatedProducts() {
        const relatedProducts = document.getElementById('related-products');
        if (!relatedProducts) return;

        // Mock related products
        const related = [
            {
                id: '2',
                name: '有机薯片',
                price: 8.90,
                image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=薯片'
            },
            {
                id: '3',
                name: '智能牙刷',
                price: 29.90,
                image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=牙刷'
            },
            {
                id: '4',
                name: '无线耳机',
                price: 199.00,
                image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=耳机'
            },
            {
                id: '5',
                name: '功能饮料',
                price: 6.50,
                image: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=饮料'
            }
        ];

        relatedProducts.innerHTML = related.map(product => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover">
                <div class="p-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name}</h4>
                    <p class="text-blue-600 font-semibold mb-3">¥${product.price.toFixed(2)}</p>
                    <button onclick="commodityManager.viewProduct('${product.id}')" 
                            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        查看详情
                    </button>
                </div>
            </div>
        `).join('');
    }

    viewProduct(productId) {
        window.location.href = `/product/${productId}`;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }
}

// Initialize commodity manager
const commodityManager = new CommodityManager();

// Export for global use
window.commodityManager = commodityManager;