/**
 * SmartStore Main JavaScript
 * 首页和商品相关交互功能
 */

class MainPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.init();
    }

    init() {
        this.initHeroAnimations();
        this.initProductGrid();
        this.initSearch();
        this.initFilters();
        this.initParticleEffect();
        this.loadProducts();
    }

    /* Hero Section Animations */
    initHeroAnimations() {
        // Animate hero elements on load
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroDescription = document.querySelector('.hero-description');
        const heroButtons = document.querySelector('.hero-buttons');

        if (heroTitle) {
            anime({
                targets: heroTitle,
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 300
            });
        }

        if (heroSubtitle) {
            anime({
                targets: heroSubtitle,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 500
            });
        }

        if (heroDescription) {
            anime({
                targets: heroDescription,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 700
            });
        }

        if (heroButtons) {
            anime({
                targets: heroButtons.children,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: anime.stagger(200, {start: 900})
            });
        }

        // Animate feature cards on scroll
        const featureCards = document.querySelectorAll('.feature-card');
        if (featureCards.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        anime({
                            targets: entry.target,
                            opacity: [0, 1],
                            translateY: [50, 0],
                            duration: 800,
                            easing: 'easeOutExpo',
                            delay: Array.from(featureCards).indexOf(entry.target) * 200
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            featureCards.forEach(card => observer.observe(card));
        }
    }

    /* Particle Effect for Hero Section */
    initParticleEffect() {
        const particlesContainer = document.getElementById('particles-container');
        if (!particlesContainer) return;

        const particleCount = 50;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
            `;
            
            // Random position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            particlesContainer.appendChild(particle);
            particles.push(particle);
        }

        // Animate particles
        particles.forEach((particle, index) => {
            anime({
                targets: particle,
                translateY: [0, -100],
                translateX: [0, Math.random() * 100 - 50],
                opacity: [0.3, 0],
                duration: Math.random() * 3000 + 2000,
                easing: 'linear',
                loop: true,
                delay: Math.random() * 2000
            });
        });
    }

    /* Product Grid Management */
    initProductGrid() {
        this.productsGrid = document.getElementById('products-grid');
        this.productsContainer = document.getElementById('products-container');
        
        if (this.productsGrid) {
            this.renderProducts(this.productsGrid, 8); // Show 8 products on homepage
        }
    }

    async loadProducts() {
        try {
            smartStore.showLoading();
            
            // Mock product data - in real app, this would come from API
            this.products = [
                {
                    id: '1',
                    name: '智能矿泉水',
                    price: 3.50,
                    originalPrice: 4.00,
                    category: 'beverages',
                    image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=矿泉水',
                    description: '纯净天然矿泉水，智能包装，品质保证',
                    stock: 150,
                    sold: 45,
                    rating: 4.5
                },
                {
                    id: '2',
                    name: '有机薯片',
                    price: 8.90,
                    originalPrice: 10.90,
                    category: 'snacks',
                    image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=薯片',
                    description: '精选土豆制作，健康美味零食',
                    stock: 80,
                    sold: 123,
                    rating: 4.2
                },
                {
                    id: '3',
                    name: '智能牙刷',
                    price: 29.90,
                    originalPrice: 39.90,
                    category: 'daily',
                    image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=牙刷',
                    description: 'AI智能感应，全方位清洁护理',
                    stock: 45,
                    sold: 67,
                    rating: 4.8
                },
                {
                    id: '4',
                    name: '无线耳机',
                    price: 199.00,
                    originalPrice: 299.00,
                    category: 'electronics',
                    image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=耳机',
                    description: '高品质音效，长续航无线耳机',
                    stock: 25,
                    sold: 89,
                    rating: 4.6
                },
                {
                    id: '5',
                    name: '功能饮料',
                    price: 6.50,
                    originalPrice: 8.00,
                    category: 'beverages',
                    image: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=饮料',
                    description: '提神醒脑，补充能量',
                    stock: 120,
                    sold: 234,
                    rating: 4.3
                },
                {
                    id: '6',
                    name: '坚果组合',
                    price: 15.90,
                    originalPrice: 18.90,
                    category: 'snacks',
                    image: 'https://via.placeholder.com/300x300/84cc16/ffffff?text=坚果',
                    description: '多种坚果混合，营养丰富',
                    stock: 60,
                    sold: 156,
                    rating: 4.7
                },
                {
                    id: '7',
                    name: '护手霜',
                    price: 12.80,
                    originalPrice: 16.80,
                    category: 'daily',
                    image: 'https://via.placeholder.com/300x300/f97316/ffffff?text=护手霜',
                    description: '滋润保湿，呵护双手',
                    stock: 90,
                    sold: 78,
                    rating: 4.4
                },
                {
                    id: '8',
                    name: '充电宝',
                    price: 89.00,
                    originalPrice: 129.00,
                    category: 'electronics',
                    image: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=充电宝',
                    description: '大容量快充，便携设计',
                    stock: 35,
                    sold: 145,
                    rating: 4.5
                }
            ];

            this.filteredProducts = [...this.products];
            smartStore.hideLoading();
            
            if (this.productsContainer) {
                this.renderProductsList();
            }
            
        } catch (error) {
            console.error('Failed to load products:', error);
            smartStore.hideLoading();
            smartStore.showToast('加载商品失败，请稍后重试', 'error');
        }
    }

    renderProducts(container, limit = null) {
        if (!container) return;

        const productsToShow = limit ? this.products.slice(0, limit) : this.products;
        
        container.innerHTML = productsToShow.map(product => `
            <div class="product-card bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        ${Math.round((1 - product.price / product.originalPrice) * 100)}折
                    </div>
                    <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        已售 ${product.sold}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900 mb-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <span class="text-xl font-bold text-red-600">¥${product.price.toFixed(2)}</span>
                            <span class="text-sm text-gray-500 line-through ml-2">¥${product.originalPrice.toFixed(2)}</span>
                        </div>
                        <div class="flex text-yellow-400 text-sm">
                            ${this.renderStars(product.rating)}
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">库存: ${product.stock}</span>
                        <button onclick="mainPage.viewProduct('${product.id}')" 
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            查看详情
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for product cards
        container.querySelectorAll('.product-card').forEach((card, index) => {
            const product = productsToShow[index];
            const addToCartBtn = card.querySelector('button');
            
            addToCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                smartStore.addToCart(product);
            });
        });
    }

    renderProductsList() {
        if (!this.productsContainer) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        this.productsContainer.innerHTML = productsToShow.map(product => `
            <div class="product-item bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="flex">
                    <img src="${product.image}" alt="${product.name}" class="w-24 h-24 object-cover">
                    <div class="flex-1 p-4">
                        <h3 class="font-semibold text-gray-900 mb-1">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-2">${product.description}</p>
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="text-lg font-bold text-red-600">¥${product.price.toFixed(2)}</span>
                                <span class="text-sm text-gray-500 line-through ml-2">¥${product.originalPrice.toFixed(2)}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="flex text-yellow-400 text-sm">
                                    ${this.renderStars(product.rating)}
                                </div>
                                <button onclick="mainPage.addToCartFromList('${product.id}')" 
                                        class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                    加入购物篮
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.updatePagination();
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

    /* Search and Filter */
    initSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const debouncedSearch = smartStore.debounce((value) => {
                this.filterProducts();
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    initFilters() {
        const categoryFilters = document.querySelectorAll('.category-filter');
        const priceRangeInputs = document.querySelectorAll('input[name="price-range"]');
        const sortSelect = document.getElementById('sort-select');
        const clearFilters = document.getElementById('clear-filters');

        categoryFilters.forEach(filter => {
            filter.addEventListener('change', () => this.filterProducts());
        });

        priceRangeInputs.forEach(input => {
            input.addEventListener('change', () => this.filterProducts());
        });

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortProducts());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearAllFilters());
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);
        const selectedPriceRange = document.querySelector('input[name="price-range"]:checked')?.value;

        this.filteredProducts = this.products.filter(product => {
            // Search filter
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = selectedCategories.length === 0 || 
                selectedCategories.includes('all') ||
                selectedCategories.includes(product.category);

            // Price filter
            let matchesPrice = true;
            if (selectedPriceRange && selectedPriceRange !== 'all') {
                const price = product.price;
                switch (selectedPriceRange) {
                    case '0-10':
                        matchesPrice = price >= 0 && price <= 10;
                        break;
                    case '10-50':
                        matchesPrice = price > 10 && price <= 50;
                        break;
                    case '50-100':
                        matchesPrice = price > 50 && price <= 100;
                        break;
                    case '100+':
                        matchesPrice = price > 100;
                        break;
                }
            }

            return matchesSearch && matchesCategory && matchesPrice;
        });

        this.currentPage = 1;
        this.renderProductsList();
        this.updateResultsInfo();
    }

    sortProducts() {
        const sortValue = document.getElementById('sort-select')?.value;
        
        switch (sortValue) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'popular':
                this.filteredProducts.sort((a, b) => b.sold - a.sold);
                break;
            default:
                // Keep original order
                break;
        }

        this.renderProductsList();
    }

    clearAllFilters() {
        // Clear search
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        // Clear category filters
        document.querySelectorAll('.category-filter').forEach(cb => {
            cb.checked = cb.value === 'all';
        });

        // Clear price filters
        document.querySelectorAll('input[name="price-range"]').forEach(input => {
            input.checked = input.value === 'all';
        });

        // Reset sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = 'default';

        this.filterProducts();
    }

    updateResultsInfo() {
        const totalCount = document.getElementById('total-count');
        if (totalCount) {
            totalCount.textContent = this.filteredProducts.length;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="mainPage.goToPage(${this.currentPage - 1})" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">上一页</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="px-3 py-2 bg-blue-600 text-white rounded-lg">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `<button onclick="mainPage.goToPage(${i})" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">${i}</button>`;
            } else if (Math.abs(i - this.currentPage) === 3) {
                paginationHTML += `<span class="px-3 py-2">...</span>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="mainPage.goToPage(${this.currentPage + 1})" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">下一页</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProductsList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* Product Actions */
    viewProduct(productId) {
        window.location.href = `/product/${productId}`;
    }

    addToCartFromList(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            smartStore.addToCart(product);
        }
    }
}

// Initialize main page
const mainPage = new MainPage();

// Export for global use
window.mainPage = mainPage;