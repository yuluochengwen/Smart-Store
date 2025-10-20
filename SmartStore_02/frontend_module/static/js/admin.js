/**
 * SmartStore Admin JavaScript
 * 管理员后台管理功能
 */

class AdminManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.selectedOrders = new Set();
        this.inventoryData = [];
        this.ordersData = [];
        this.apiOrders = { items: [], total: 0, page: 1, pageSize: 20 };
        this.serverPaging = false;
        this.usersCache = [];
        this.init();
    }

    init() {
        this.initAdminLogin();
        this.initInventoryManage();
        this.initOrderManage();
        this.initUserManagement();
        this.initCharts();
        this.loadData();
        // 如果在仪表盘页面，尝试初始化仪表盘
        if (document.getElementById('kpi-today-sales')) {
            this.initDashboard();
        }
    }

    /* Admin Login */
    initAdminLogin() {
        const adminLoginForm = document.getElementById('admin-login-form');
        const togglePassword = document.getElementById('toggle-admin-password');
        const passwordInput = document.getElementById('admin-password');
        const captchaImage = document.getElementById('captcha-image');

        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin(e);
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

        if (captchaImage) {
            captchaImage.addEventListener('click', () => {
                this.refreshCaptcha();
            });
        }
    }

    async handleAdminLogin(e) {
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        const captcha = formData.get('captcha');

        if (!username || !password || !captcha) {
            smartStore.showToast('请填写所有必填项', 'warning');
            return;
        }

        try {
            smartStore.showLoading();
            
            // Mock admin login - in real app, this would be API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock admin data
            const adminData = {
                id: 'admin1',
                username: username,
                role: 'super_admin',
                permissions: ['inventory', 'orders', 'users', 'analytics'],
                loginTime: new Date().toISOString()
            };

            smartStore.setStorage('smartstore_admin', adminData);
            smartStore.hideLoading();
            smartStore.showToast('管理员登录成功！', 'success');
            
            // Redirect to inventory management
            setTimeout(() => {
                window.location.href = '/admin/dashboard';
            }, 1000);
            
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('登录失败，请检查管理员账号和密码', 'error');
        }
    }

    refreshCaptcha() {
        const captchaImage = document.getElementById('captcha-image');
        if (captchaImage) {
            // Mock captcha refresh
            captchaImage.innerHTML = `<span class="text-sm text-gray-600">${Math.random().toString(36).substr(2, 4).toUpperCase()}</span>`;
        }
    }

    /* Inventory Management */
    initInventoryManage() {
        const searchInput = document.getElementById('inventory-search');
        const categoryFilter = document.getElementById('category-filter');
        const stockFilter = document.getElementById('stock-filter');
        const exportBtn = document.getElementById('export-inventory');
        const addProductBtn = document.getElementById('add-product');

        if (searchInput) {
            searchInput.addEventListener('input', smartStore.debounce(() => {
                this.filterInventory();
            }, 300));
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterInventory());
        }

        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.filterInventory());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportInventory());
        }

        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showAddProductModal());
        }

        this.initProductModal();
        this.initStockModal();
    }

    initProductModal() {
        const modal = document.getElementById('product-modal');
        const closeBtn = document.getElementById('close-product-modal');
        const form = document.getElementById('product-form');
        const cancelBtn = document.getElementById('cancel-product');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                smartStore.closeModal('product-modal');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                smartStore.closeModal('product-modal');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct(e);
            });
        }
    }

    initStockModal() {
        const modal = document.getElementById('stock-modal');
        const form = document.getElementById('stock-form');
        const cancelBtn = document.getElementById('cancel-stock');
        const decreaseBtn = document.getElementById('stock-decrease');
        const increaseBtn = document.getElementById('stock-increase');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                smartStore.closeModal('stock-modal');
            });
        }

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                const input = document.getElementById('stock-change');
                input.value = Math.max(-100, parseInt(input.value) - 1);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                const input = document.getElementById('stock-change');
                input.value = Math.min(100, parseInt(input.value) + 1);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveStockAdjustment(e);
            });
        }
    }

    showAddProductModal() {
        document.getElementById('modal-title').textContent = '添加商品';
        document.getElementById('save-product').textContent = '保存商品';
        
        // Clear form
        document.getElementById('product-form').reset();
        
        smartStore.openModal('product-modal');
    }

    showEditProductModal(productId) {
        const product = this.inventoryData.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('modal-title').textContent = '编辑商品';
        document.getElementById('save-product').textContent = '更新商品';

        // Populate form with product data
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-sku').value = product.sku;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-min-stock').value = product.minStock || 10;
        document.getElementById('product-description').value = product.description || '';

        smartStore.openModal('product-modal');
    }

    showStockModal(productId) {
        const product = this.inventoryData.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('stock-product-name').value = product.name;
        document.getElementById('current-stock').value = product.stock;
        document.getElementById('stock-change').value = 0;
        document.getElementById('stock-reason').value = '';

        smartStore.openModal('stock-modal');
    }

    async saveProduct(e) {
        const formData = new FormData(e.target);
        const productData = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            minStock: parseInt(formData.get('min_stock')),
            description: formData.get('description')
        };

        try {
            smartStore.showLoading();
            
            // Mock save product - in real app, this would be API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add to inventory data
            this.inventoryData.push({
                id: Date.now().toString(),
                ...productData,
                status: productData.stock > productData.minStock ? 'normal' : 'low'
            });

            smartStore.hideLoading();
            smartStore.showToast('商品保存成功！', 'success');
            smartStore.closeModal('product-modal');
            
            this.renderInventoryTable();
            
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('保存失败，请重试', 'error');
        }
    }

    async saveStockAdjustment(e) {
        const formData = new FormData(e.target);
        const change = parseInt(formData.get('stock-change'));
        const reason = formData.get('reason');

        if (!change || !reason) {
            smartStore.showToast('请填写调整数量和原因', 'warning');
            return;
        }

        try {
            smartStore.showLoading();
            
            // Mock save stock adjustment - in real app, this would be API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            smartStore.hideLoading();
            smartStore.showToast('库存调整成功！', 'success');
            smartStore.closeModal('stock-modal');
            
            this.renderInventoryTable();
            
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('调整失败，请重试', 'error');
        }
    }

    filterInventory() {
        const searchTerm = document.getElementById('inventory-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const stockFilter = document.getElementById('stock-filter')?.value || '';

        let filtered = this.inventoryData;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (categoryFilter) {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        // Stock filter
        if (stockFilter) {
            filtered = filtered.filter(item => {
                switch (stockFilter) {
                    case 'low':
                        return item.stock <= item.minStock;
                    case 'out':
                        return item.stock === 0;
                    case 'normal':
                        return item.stock > item.minStock && item.stock <= item.minStock * 2;
                    case 'high':
                        return item.stock > item.minStock * 2;
                    default:
                        return true;
                }
            });
        }

        this.renderInventoryTable(filtered);
    }

    renderInventoryTable(data = null) {
        const tableBody = document.getElementById('inventory-table-body');
        if (!tableBody) return;

        const items = data || this.inventoryData;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = items.slice(startIndex, endIndex);

        tableBody.innerHTML = pageItems.map(item => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${item.image || 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=商品'}" 
                             alt="${item.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                        <div>
                            <div class="font-medium text-gray-900">${item.name}</div>
                            <div class="text-sm text-gray-500">${item.description || '暂无描述'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${item.sku}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getCategoryColor(item.category)}">
                        ${this.getCategoryName(item.category)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">${item.stock}</span>
                        ${item.stock <= item.minStock ? '<i class="fas fa-exclamation-triangle text-yellow-500 ml-2"></i>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStockStatusColor(item.stock, item.minStock)}">
                        ${this.getStockStatus(item.stock, item.minStock)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="adminManager.showStockModal('${item.id}')" 
                                class="text-blue-600 hover:text-blue-900 text-sm">
                            <i class="fas fa-edit mr-1"></i>库存
                        </button>
                        <button onclick="adminManager.showEditProductModal('${item.id}')" 
                                class="text-green-600 hover:text-green-900 text-sm">
                            <i class="fas fa-pencil-alt mr-1"></i>编辑
                        </button>
                        <button onclick="adminManager.deleteProduct('${item.id}')" 
                                class="text-red-600 hover:text-red-900 text-sm">
                            <i class="fas fa-trash mr-1"></i>删除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateInventoryPagination(items.length);
    }

    getCategoryColor(category) {
        const colors = {
            'beverages': 'bg-blue-100 text-blue-800',
            'snacks': 'bg-green-100 text-green-800',
            'daily': 'bg-purple-100 text-purple-800',
            'electronics': 'bg-orange-100 text-orange-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    }

    getCategoryName(category) {
        const names = {
            'beverages': '饮料',
            'snacks': '零食',
            'daily': '日用品',
            'electronics': '电子产品'
        };
        return names[category] || category;
    }

    getStockStatusColor(stock, minStock) {
        if (stock === 0) return 'bg-red-100 text-red-800';
        if (stock <= minStock) return 'bg-yellow-100 text-yellow-800';
        if (stock <= minStock * 2) return 'bg-blue-100 text-blue-800';
        return 'bg-green-100 text-green-800';
    }

    getStockStatus(stock, minStock) {
        if (stock === 0) return '缺货';
        if (stock <= minStock) return '低库存';
        if (stock <= minStock * 2) return '正常';
        return '充足';
    }

    updateInventoryPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pageStart = document.getElementById('page-start');
        const pageEnd = document.getElementById('page-end');
        const totalItemsEl = document.getElementById('total-items');

        if (pageStart) pageStart.textContent = Math.min((this.currentPage - 1) * this.itemsPerPage + 1, totalItems);
        if (pageEnd) pageEnd.textContent = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
    }

    exportInventory() {
        smartStore.showToast('导出功能开发中...', 'info');
    }

    deleteProduct(productId) {
        if (confirm('确定要删除这个商品吗？')) {
            this.inventoryData = this.inventoryData.filter(p => p.id !== productId);
            this.renderInventoryTable();
            smartStore.showToast('商品已删除', 'success');
        }
    }

    /* Order Management */
    initOrderManage() {
        const searchInput = document.getElementById('order-search');
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');
        const exportBtn = document.getElementById('export-orders');
        const batchBtn = document.getElementById('batch-process');
        const selectAll = document.getElementById('select-all');
        const perPageSel = document.getElementById('orders-per-page');

        // 如果存在订单表，改为服务端分页模式
        if (document.getElementById('orders-table-body')) {
            this.serverPaging = true;
        }

        if (searchInput) {
            searchInput.addEventListener('input', smartStore.debounce(() => {
                this.currentPage = 1;
                this.reloadOrdersFromApi();
            }, 300));
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => { this.currentPage = 1; this.reloadOrdersFromApi(); });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => { this.currentPage = 1; this.reloadOrdersFromApi(); });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportOrders());
        }

        if (batchBtn) {
            batchBtn.addEventListener('click', () => this.showBatchProcess());
        }

        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        if (perPageSel) {
            perPageSel.addEventListener('change', () => {
                this.itemsPerPage = Number(perPageSel.value || 20);
                this.apiOrders.pageSize = this.itemsPerPage;
                this.currentPage = 1;
                this.reloadOrdersFromApi();
            });
        }

        this.initOrderDetailModal();
        this.initStatusUpdateModal();

        // 首次加载
        if (this.serverPaging) {
            this.reloadOrdersFromApi();
        }
    }

    buildOrderQuery() {
        const q = (document.getElementById('order-search')?.value || '').trim();
        const status = document.getElementById('status-filter')?.value || '';
        const dateRange = document.getElementById('date-filter')?.value || '';
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        if (dateRange && dateRange !== 'all') params.set('dateRange', dateRange);
        params.set('page', this.currentPage);
        params.set('pageSize', this.itemsPerPage);
        return params.toString();
    }

    async reloadOrdersFromApi() {
        if (!this.serverPaging) return;
        const query = this.buildOrderQuery();
        try {
            const resp = await fetch(`/api/admin/orders?${query}`);
            const data = await resp.json();
            this.apiOrders = data;
            this.currentPage = data.page;
            this.itemsPerPage = data.pageSize;
            this.renderOrdersTableFromApi();
        } catch (e) {
            smartStore.showToast('订单加载失败', 'error');
        }
    }

    renderOrdersTableFromApi() {
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;
        const items = this.apiOrders.items || [];
        tableBody.innerHTML = items.map(order => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <input type="checkbox" class="order-checkbox rounded text-blue-600 focus:ring-blue-500" 
                           value="${order.id}" onchange="adminManager.toggleOrderSelection('${order.id}')">
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div>
                            <div class="font-medium text-gray-900">#${order.id}</div>
                            <div class="text-sm text-gray-500">${(order.items||[]).map(i => i.name).join(', ')}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${order.customerName||''}</div>
                    <div class="text-sm text-gray-500">${order.customerPhone||''}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">¥${Number(order.total||0).toFixed(2)}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getOrderStatusColor(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${order.date}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="adminManager.showOrderDetail('${order.id}')" 
                                class="text-blue-600 hover:text-blue-900 text-sm">
                            <i class="fas fa-eye mr-1"></i>详情
                        </button>
                        <button onclick="adminManager.showStatusUpdateModal('${order.id}')" 
                                class="text-green-600 hover:text-green-900 text-sm">
                            <i class="fas fa-edit mr-1"></i>状态
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.updateOrdersPagination(this.apiOrders.total || 0);
    }

    /* User Management */
    initUserManagement() {
        const tableBody = document.getElementById('user-table-body');
        if (!tableBody) return; // 不在用户管理页
        const search = document.getElementById('user-search');
        const addBtn = document.getElementById('add-user');
        const modal = document.getElementById('user-modal');
        const closeBtn = document.getElementById('close-user-modal');
        const cancelBtn = document.getElementById('cancel-user');
        const form = document.getElementById('user-form');

        const refresh = async () => {
            const resp = await fetch('/api/admin/users');
            this.usersCache = await resp.json();
            this.renderUsers();
        };

        this.renderUsers = () => {
            const q = (search?.value || '').trim();
            const rows = this.usersCache.filter(u => !q || u.username.includes(q) || (u.email||'').includes(q));
            tableBody.innerHTML = rows.map(u => `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-3">${u.username}</td>
                    <td class="px-6 py-3">${u.email||''}</td>
                    <td class="px-6 py-3">${u.role||'user'}</td>
                    <td class="px-6 py-3">${u.status||'active'}</td>
                    <td class="px-6 py-3">
                        <button class="text-blue-600 mr-3" onclick="adminManager.openEditUser('${u.id}')">编辑</button>
                        <button class="text-red-600" onclick="adminManager.deleteUser('${u.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        };

        if (search) search.addEventListener('input', smartStore.debounce(() => this.renderUsers(), 300));
        if (addBtn) addBtn.addEventListener('click', () => { this.openAddUser(); });
        if (closeBtn) closeBtn.addEventListener('click', () => smartStore.closeModal('user-modal'));
        if (cancelBtn) cancelBtn.addEventListener('click', () => smartStore.closeModal('user-modal'));

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const payload = {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    role: formData.get('role')
                };
                if (this.editingUserId) {
                    await fetch(`/api/admin/users/${this.editingUserId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
                } else {
                    await fetch(`/api/admin/users`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
                }
                smartStore.closeModal('user-modal');
                this.editingUserId = null;
                await refresh();
            });
        }

        this.openAddUser = () => {
            document.getElementById('modal-title').textContent = '添加用户';
            form.reset();
            this.editingUserId = null;
            smartStore.openModal('user-modal');
        };

        this.openEditUser = (uid) => {
            document.getElementById('modal-title').textContent = '编辑用户';
            const u = this.usersCache.find(x => x.id === uid);
            if (!u) return;
            form.username.value = u.username || '';
            form.email.value = u.email || '';
            form.role.value = u.role || 'user';
            this.editingUserId = uid;
            smartStore.openModal('user-modal');
        };

        this.deleteUser = async (uid) => {
            if (!confirm('确定删除该用户？')) return;
            await fetch(`/api/admin/users/${uid}`, {method:'DELETE'});
            await refresh();
        };

        // 首次加载
        refresh();
    }

    initOrderDetailModal() {
        const modal = document.getElementById('order-detail-modal');
        const closeBtn = document.getElementById('close-order-detail');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                smartStore.closeModal('order-detail-modal');
            });
        }
    }

    initStatusUpdateModal() {
        const modal = document.getElementById('status-update-modal');
        const form = document.getElementById('status-update-form');
        const cancelBtn = document.getElementById('cancel-status-update');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                smartStore.closeModal('status-update-modal');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateOrderStatus(e);
            });
        }
    }

    showOrderDetail(orderId) {
        let order = this.ordersData.find(o => o.id === orderId);
        if (!order && this.serverPaging) {
            order = (this.apiOrders.items || []).find(o => o.id === orderId);
        }
        if (!order) return;

        const content = document.getElementById('order-detail-content');
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">订单信息</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">订单号:</span>
                            <span class="font-medium">#${order.id}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">下单时间:</span>
                            <span class="font-medium">${order.date || ''}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">订单状态:</span>
                            <span class="font-medium">${order.status}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">支付方式:</span>
                            <span class="font-medium">${order.paymentMethod || ''}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">客户信息</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">客户姓名:</span>
                            <span class="font-medium">${order.customerName || ''}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">手机号:</span>
                            <span class="font-medium">${order.customerPhone || ''}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">配送地址:</span>
                            <span class="font-medium">${order.address || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3">商品详情</h4>
                <div class="space-y-3">
                    ${(order.items||[]).map(item => `
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover mr-3">
                                <div>
                                    <div class="font-medium">${item.name}</div>
                                    <div class="text-sm text-gray-600">x${item.quantity}</div>
                                </div>
                            </div>
                            <div class="font-medium">¥${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="border-t mt-4 pt-4">
                    <div class="flex justify-between items-center text-lg font-semibold">
                        <span>总计:</span>
                        <span class="text-blue-600">¥${Number(order.total||0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        smartStore.openModal('order-detail-modal');
    }

    showStatusUpdateModal(orderId) {
        this.currentOrderId = orderId;
        smartStore.openModal('status-update-modal');
    }

    async updateOrderStatus(e) {
        const formData = new FormData(e.target);
        const newStatus = (document.getElementById('new-order-status')?.value) || formData.get('status');
        const note = formData.get('note');

        if (!newStatus) {
            smartStore.showToast('请选择新的订单状态', 'warning');
            return;
        }

        try {
            smartStore.showLoading();
            
            // Mock status update - in real app, this would be API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update order status
            const order = this.ordersData.find(o => o.id === this.currentOrderId);
            if (order) {
                order.status = this.getStatusDisplayName(newStatus);
            }
            if (this.serverPaging) {
                const apiItem = (this.apiOrders.items || []).find(o => o.id === this.currentOrderId);
                if (apiItem) apiItem.status = newStatus;
            }

            smartStore.hideLoading();
            smartStore.showToast('订单状态更新成功！', 'success');
            smartStore.closeModal('status-update-modal');
            
            if (this.serverPaging) {
                this.renderOrdersTableFromApi();
            } else {
                this.renderOrdersTable();
            }
            
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('更新失败，请重试', 'error');
        }
    }

    getStatusDisplayName(status) {
        const statusMap = {
            'pending': '待支付',
            'paid': '已支付',
            'processing': '处理中',
            'shipped': '已发货',
            'delivered': '已送达',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    }

    renderOrdersTable(data = null) {
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;

        const items = data || this.ordersData;
        let pageItems = items;
        if (!this.serverPaging) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            pageItems = items.slice(startIndex, endIndex);
        }

        tableBody.innerHTML = pageItems.map(order => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <input type="checkbox" class="order-checkbox rounded text-blue-600 focus:ring-blue-500" 
                           value="${order.id}" onchange="adminManager.toggleOrderSelection('${order.id}')">
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div>
                            <div class="font-medium text-gray-900">#${order.id}</div>
                            <div class="text-sm text-gray-500">${order.items.map(i => i.name).join(', ')}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${order.customerName}</div>
                    <div class="text-sm text-gray-500">${order.customerPhone}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">¥${order.total.toFixed(2)}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getOrderStatusColor(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${order.date}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="adminManager.showOrderDetail('${order.id}')" 
                                class="text-blue-600 hover:text-blue-900 text-sm">
                            <i class="fas fa-eye mr-1"></i>详情
                        </button>
                        <button onclick="adminManager.showStatusUpdateModal('${order.id}')" 
                                class="text-green-600 hover:text-green-900 text-sm">
                            <i class="fas fa-edit mr-1"></i>状态
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateOrdersPagination(this.serverPaging ? (this.apiOrders?.total || 0) : items.length);
    }

    getOrderStatusColor(status) {
        const colors = {
            // 中文
            '待支付': 'bg-yellow-100 text-yellow-800',
            '已支付': 'bg-blue-100 text-blue-800',
            '处理中': 'bg-purple-100 text-purple-800',
            '已发货': 'bg-orange-100 text-orange-800',
            '已送达': 'bg-green-100 text-green-800',
            '已取消': 'bg-red-100 text-red-800',
            // 英文
            'pending': 'bg-yellow-100 text-yellow-800',
            'paid': 'bg-blue-100 text-blue-800',
            'processing': 'bg-purple-100 text-purple-800',
            'shipped': 'bg-orange-100 text-orange-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    updateOrdersPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        const pageStart = document.getElementById('orders-page-start');
        const pageEnd = document.getElementById('orders-page-end');
        const totalOrders = document.getElementById('total-orders-count');
        const controls = document.getElementById('orders-pagination-controls');

        if (pageStart) pageStart.textContent = totalItems === 0 ? 0 : Math.min((this.currentPage - 1) * this.itemsPerPage + 1, totalItems);
        if (pageEnd) pageEnd.textContent = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        if (totalOrders) totalOrders.textContent = totalItems;

        if (controls) {
            const makeBtn = (label, page, disabled=false, active=false) => `
                <button ${disabled?'disabled':''} data-page="${page}" class="px-3 py-1 rounded border ${active?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-100'}">
                    ${label}
                </button>`;
            const windowSize = 5;
            let start = Math.max(1, this.currentPage - Math.floor(windowSize/2));
            let end = Math.min(totalPages, start + windowSize - 1);
            start = Math.max(1, Math.min(start, totalPages - windowSize + 1));
            let html = '';
            html += makeBtn('«', Math.max(1, this.currentPage - 1), this.currentPage===1);
            for (let p = start; p <= end; p++) {
                html += makeBtn(p, p, false, p === this.currentPage);
            }
            html += makeBtn('»', Math.min(totalPages, this.currentPage + 1), this.currentPage===totalPages);
            controls.innerHTML = html;
            controls.querySelectorAll('button[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const p = Number(btn.getAttribute('data-page'));
                    if (p && p !== this.currentPage) {
                        this.currentPage = p;
                        if (this.serverPaging) this.reloadOrdersFromApi();
                        else this.renderOrdersTable();
                    }
                });
            });
        }
    }

    toggleOrderSelection(orderId) {
        if (this.selectedOrders.has(orderId)) {
            this.selectedOrders.delete(orderId);
        } else {
            this.selectedOrders.add(orderId);
        }
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedOrders.add(checkbox.value);
            } else {
                this.selectedOrders.delete(checkbox.value);
            }
        });
    }

    exportOrders() {
        // 导出当前筛选结果
        const query = this.buildOrderQuery();
        window.location.href = `/api/admin/orders/export?${query}`;
    }

    showBatchProcess() {
        if (this.selectedOrders.size === 0) {
            smartStore.showToast('请先选择订单', 'warning');
            return;
        }
        smartStore.showToast(`已选择 ${this.selectedOrders.size} 个订单进行批量处理`, 'info');
    }

    /* Charts and Analytics */
    initCharts() {
        this.initSalesChart();
        this.initOrderStatusChart();
        this.loadTopProducts();
        this.loadRecentActivities();
    }

        /* Dashboard Visualization */
        initDashboard() {
                const $ = (id) => document.getElementById(id);

                // KPI 指标
                fetch('/api/admin/metrics').then(r => r.json()).then(d => {
                        if ($('kpi-today-sales')) $('kpi-today-sales').textContent = `¥${Number(d.todaySales || 0).toFixed(2)}`;
                        if ($('kpi-today-orders')) $('kpi-today-orders').textContent = d.todayOrders || 0;
                        if ($('kpi-users')) $('kpi-users').textContent = d.registeredUsers || 0;
                        if ($('kpi-products')) $('kpi-products').textContent = d.productsTotal || 0;
                        if ($('kpi-growth-sales')) $('kpi-growth-sales').textContent = d.growth?.sales || '+0%';
                        if ($('kpi-growth-orders')) $('kpi-growth-orders').textContent = d.growth?.orders || '+0%';
                }).catch(() => {});

                // 销售趋势图
                fetch('/api/admin/sales/trend').then(r => r.json()).then(rows => {
                        const el = document.getElementById('sales-trend-chart');
                        if (!el || !window.echarts) return;
                        const chart = echarts.init(el);
                        chart.setOption({
                                tooltip: { trigger: 'axis' },
                                legend: { data: ['销售额', '订单数'] },
                                grid: { left: 40, right: 30, top: 30, bottom: 30 },
                                xAxis: { type: 'category', data: rows.map(r => r.date) },
                                yAxis: [{ type: 'value', name: '销售额(¥)' }, { type: 'value', name: '订单数' }],
                                series: [
                                        { name: '销售额', type: 'line', smooth: true, areaStyle: {}, data: rows.map(r => r.sales) },
                                        { name: '订单数', type: 'bar', yAxisIndex: 1, barWidth: 18, data: rows.map(r => r.orders) }
                                ]
                        });
                        window.addEventListener('resize', () => chart.resize());
                }).catch(() => {});

                // 热销 TOP5
                    // 热销 TOP5（带范围）
                    const topRangeSel = document.getElementById('top-range');
                    const topRange = topRangeSel ? topRangeSel.value : 14;
                    fetch(`/api/admin/products/top?range=${topRange}`).then(r => r.json()).then(rows => {
                        const el = document.getElementById('top-products-chart');
                        if (!el || !window.echarts) return;
                        const chart = echarts.init(el);
                        chart.setOption({
                                tooltip: { trigger: 'item' },
                                xAxis: { type: 'value' },
                                yAxis: { type: 'category', data: rows.map(x => x.name) },
                                series: [{ type: 'bar', data: rows.map(x => x.sales), itemStyle: { color: '#7c3aed' } }]
                        });
                        window.addEventListener('resize', () => chart.resize());
                }).catch(() => {});

                // 最近交易列表
                    // 最近交易（带范围）
                    const recentRangeSel = document.getElementById('recent-range');
                    const recentRange = recentRangeSel ? recentRangeSel.value : 14;
                    fetch(`/api/admin/orders/recent?range=${recentRange}`).then(r => r.json()).then(list => {
                        const box = document.getElementById('recent-transactions');
                        if (!box) return;
                        box.innerHTML = list.map(o => `
                            <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div class="flex items-center space-x-4">
                                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <i class="fas fa-receipt"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">#${'${'}o.id${'}'} · ¥${'${'}o.amount.toFixed(2)${'}'}</div>
                                        <div class="text-sm text-gray-500">${'${'}o.user${'}'} · ${'${'}o.time${'}'}</div>
                                    </div>
                                </div>
                                <span class="text-xs px-2 py-1 rounded-full ${'${'}o.status==='paid'?'bg-green-100 text-green-700':o.status==='shipped'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'${'}'}">
                                    ${'${'}o.status${'}'}
                                </span>
                            </div>
                        `).join('');
                }).catch(() => {});
        }

    initSalesChart() {
        const chartContainer = document.getElementById('sales-chart');
        if (!chartContainer) return;

        const chart = echarts.init(chartContainer);
        
        const option = {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['1月', '2月', '3月', '4月', '5月', '6月']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: [8200, 9500, 7800, 11200, 12800, 15000],
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#3b82f6'
                },
                areaStyle: {
                    color: 'rgba(59, 130, 246, 0.1)'
                }
            }]
        };

        chart.setOption(option);
    }

    initOrderStatusChart() {
        const chartContainer = document.getElementById('order-status-chart');
        if (!chartContainer) return;

        const chart = echarts.init(chartContainer);
        
        const option = {
            tooltip: {
                trigger: 'item'
            },
            series: [{
                type: 'pie',
                radius: '70%',
                data: [
                    { value: 45, name: '已完成', itemStyle: { color: '#10b981' } },
                    { value: 25, name: '处理中', itemStyle: { color: '#8b5cf6' } },
                    { value: 20, name: '已发货', itemStyle: { color: '#f59e0b' } },
                    { value: 10, name: '待支付', itemStyle: { color: '#ef4444' } }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        chart.setOption(option);
    }

    loadTopProducts() {
        const container = document.getElementById('top-products');
        if (!container) return;

        const topProducts = [
            { name: '智能矿泉水', sales: 234, revenue: 819 },
            { name: '无线耳机', sales: 89, revenue: 17711 },
            { name: '有机薯片', sales: 123, revenue: 1094 },
            { name: '充电宝', sales: 145, revenue: 12905 },
            { name: '功能饮料', sales: 234, revenue: 1521 }
        ];

        container.innerHTML = topProducts.map((product, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        ${index + 1}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-600">销量: ${product.sales} 件</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-gray-900">¥${product.revenue.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    loadRecentActivities() {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        const activities = [
            { time: '2分钟前', action: '新订单 #2024123456789', user: '系统' },
            { time: '5分钟前', action: '库存更新: 智能矿泉水', user: '管理员' },
            { time: '10分钟前', action: '用户注册: new_user', user: '系统' },
            { time: '15分钟前', action: '订单状态更新: 已发货', user: '管理员' },
            { time: '20分钟前', action: '商品添加: 护手霜', user: '管理员' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
                <div>
                    <div class="font-medium text-gray-900">${activity.action}</div>
                    <div class="text-sm text-gray-600">${activity.user} • ${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    /* Data Loading */
    async loadData() {
        try {
            smartStore.showLoading();
            
            // Mock data loading - in real app, this would be API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Load inventory data
            this.inventoryData = [
                {
                    id: '1',
                    name: '智能矿泉水',
                    sku: 'WATER-001',
                    category: 'beverages',
                    price: 3.50,
                    stock: 150,
                    minStock: 20,
                    description: '纯净天然矿泉水',
                    image: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=水'
                },
                {
                    id: '2',
                    name: '有机薯片',
                    sku: 'SNACK-001',
                    category: 'snacks',
                    price: 8.90,
                    stock: 80,
                    minStock: 15,
                    description: '精选土豆制作',
                    image: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=薯'
                }
            ];

            // Load orders data
            this.ordersData = [
                {
                    id: '2024123456789',
                    customerName: '张三',
                    customerPhone: '138****8888',
                    address: '北京市朝阳区科技园A座',
                    total: 45.80,
                    status: '已支付',
                    date: '2024-01-15 14:30:25',
                    paymentMethod: '人脸支付',
                    items: [
                        { name: '智能矿泉水', price: 3.50, quantity: 2, image: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=水' },
                        { name: '有机薯片', price: 8.90, quantity: 1, image: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=薯' }
                    ]
                },
                {
                    id: '2024123456790',
                    customerName: '李四',
                    customerPhone: '139****9999',
                    address: '上海市浦东新区软件园B座',
                    total: 89.90,
                    status: '处理中',
                    date: '2024-01-15 15:45:12',
                    paymentMethod: '微信支付',
                    items: [
                        { name: '智能牙刷', price: 29.90, quantity: 1, image: 'https://via.placeholder.com/40x40/10b981/ffffff?text=牙' },
                        { name: '护手霜', price: 12.80, quantity: 1, image: 'https://via.placeholder.com/40x40/f97316/ffffff?text=手' }
                    ]
                }
            ];

            smartStore.hideLoading();
            
            // Render data based on current page
            if (document.getElementById('inventory-table-body')) {
                this.renderInventoryTable();
            }
            
            if (document.getElementById('orders-table-body') && !this.serverPaging) {
                this.renderOrdersTable();
            }
            
        } catch (error) {
            smartStore.hideLoading();
            smartStore.showToast('数据加载失败，请刷新页面重试', 'error');
        }
    }
}

// Initialize admin manager
const adminManager = new AdminManager();

// Export for global use
window.adminManager = adminManager;