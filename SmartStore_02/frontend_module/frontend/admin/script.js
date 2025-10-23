// 全局变量
let currentUser = null;
let isSidebarCollapsed = false;

// 模拟用户数据
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: '管理员',
        status: 'active',
        createdAt: '2024-01-15',
        lastLogin: '2024-01-20',
        avatar: 'A'
    },
    {
        id: 2,
        username: 'manager',
        email: 'manager@example.com',
        role: '经理',
        status: 'active',
        createdAt: '2024-01-16',
        lastLogin: '2024-01-19',
        avatar: 'M'
    }
];

// 模拟商品数据
const mockProducts = [
    {
        id: 1,
        name: '苹果',
        price: 5.99,
        category: '水果',
        stock: 100,
        status: 'in-stock',
        createdAt: '2024-01-01'
    },
    {
        id: 2,
        name: '香蕉',
        price: 3.99,
        category: '水果',
        stock: 50,
        status: 'low-stock',
        createdAt: '2024-01-02'
    },
    {
        id: 3,
        name: '牛奶',
        price: 12.99,
        category: '饮品',
        stock: 0,
        status: 'out-of-stock',
        createdAt: '2024-01-03'
    }
];

// 模拟订单数据
const mockOrders = [
    {
        id: 'ORDER_001',
        customer: '张三',
        amount: 25.98,
        status: 'paid',
        createdAt: '2024-01-20 10:30',
        items: ['苹果', '香蕉']
    },
    {
        id: 'ORDER_002',
        customer: '李四',
        amount: 12.99,
        status: 'unpaid',
        createdAt: '2024-01-20 11:15',
        items: ['牛奶']
    },
    {
        id: 'ORDER_003',
        customer: '王五',
        amount: 8.99,
        status: 'cancelled',
        createdAt: '2024-01-20 14:20',
        items: ['面包']
    }
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 初始化页面功能
    initializeSidebar();
    initializeSearch();
    initializeUserMenu();
    
    // 根据当前页面初始化相应功能
    const currentPage = getCurrentPage();
    switch(currentPage) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'traffic':
            initializeTraffic();
            break;
        case 'inventory':
            initializeInventory();
            break;
        case 'users':
            initializeUsers();
            break;
        case 'orders':
            initializeOrders();
            break;
        case 'products':
            initializeProducts();
            break;
    }
    
    console.log('管理后台已初始化');
}

// 获取当前页面
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('traffic')) return 'traffic';
    if (path.includes('inventory')) return 'inventory';
    if (path.includes('users')) return 'users';
    if (path.includes('orders')) return 'orders';
    if (path.includes('products')) return 'products';
    return 'dashboard';
}

// 检查登录状态
function checkLoginStatus() {
    const userToken = localStorage.getItem('adminToken');
    if (userToken) {
        try {
            const userData = JSON.parse(userToken);
            currentUser = userData;
            updateUserInfo();
        } catch (error) {
            console.error('用户数据解析失败:', error);
            redirectToLogin();
        }
    } else if (!window.location.pathname.includes('login.html')) {
        redirectToLogin();
    }
}

// 重定向到登录页面
function redirectToLogin() {
    window.location.href = 'login.html';
}

// 更新用户信息
function updateUserInfo() {
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');
    
    if (currentUser && userNameEl) {
        userNameEl.textContent = currentUser.username;
        userRoleEl.textContent = currentUser.role;
        userAvatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
    }
}

// 初始化侧边栏
function initializeSidebar() {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            isSidebarCollapsed = !isSidebarCollapsed;
            
            if (isSidebarCollapsed) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            } else {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
            }
            
            localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
        });
    }
    
    // 恢复侧边栏状态
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        isSidebarCollapsed = true;
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    // 设置当前页面菜单项为激活状态
    const currentPage = getCurrentPage();
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        }
    });
}

// 初始化搜索功能
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            performSearch(query);
        });
    }
}

// 执行搜索
function performSearch(query) {
    // 根据当前页面执行相应的搜索
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'users':
            searchUsers(query);
            break;
        case 'orders':
            searchOrders(query);
            break;
        case 'products':
            searchProducts(query);
            break;
        case 'inventory':
            searchInventory(query);
            break;
    }
}

// 初始化用户菜单
function initializeUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            showUserDropdown();
        });
    }
}

// 显示用户下拉菜单
function showUserDropdown() {
    // 创建下拉菜单
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" onclick="viewProfile()">
            <i class="fas fa-user"></i>
            个人资料
        </div>
        <div class="dropdown-item" onclick="changePassword()">
            <i class="fas fa-lock"></i>
            修改密码
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            退出登录
        </div>
    `;
    
    // 添加样式
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        min-width: 200px;
        margin-top: 0.5rem;
    `;
    
    // 添加下拉项样式
    const style = document.createElement('style');
    style.textContent = `
        .dropdown-item {
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .dropdown-item:hover {
            background: #f8f9fa;
        }
        .dropdown-divider {
            height: 1px;
            background: #e9ecef;
            margin: 0.5rem 0;
        }
    `;
    document.head.appendChild(style);
    
    // 添加到DOM
    const userMenu = document.querySelector('.user-menu');
    userMenu.style.position = 'relative';
    userMenu.appendChild(dropdown);
    
    // 点击其他地方关闭
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!userMenu.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// 退出登录
function logout() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    redirectToLogin();
}

// 查看个人资料
function viewProfile() {
    showNotification('个人资料功能开发中...', 'info');
}

// 修改密码
function changePassword() {
    showNotification('修改密码功能开发中...', 'info');
}

// 初始化仪表盘
function initializeDashboard() {
    // 生成统计数据
    generateStats();
    
    // 生成图表
    generateSalesChart();
    generateTopProductsChart();
}

// 生成统计数据
function generateStats() {
    const stats = {
        todaySales: 12580.50,
        todayOrders: 156,
        totalUsers: 1234,
        totalProducts: 567,
        salesChange: 12.5,
        ordersChange: 8.3,
        usersChange: 5.2,
        productsChange: 15.8
    };
    
    // 更新统计卡片
    updateStatCard('today-sales', stats.todaySales, '今日销售额', '¥', stats.salesChange);
    updateStatCard('today-orders', stats.todayOrders, '今日订单', '', stats.ordersChange);
    updateStatCard('total-users', stats.totalUsers, '注册用户', '', stats.usersChange);
    updateStatCard('total-products', stats.totalProducts, '商品总数', '', stats.productsChange);
}

// 更新统计卡片
function updateStatCard(id, value, label, prefix = '', change = 0) {
    const element = document.getElementById(id);
    if (element) {
        const valueEl = element.querySelector('.stat-value');
        const labelEl = element.querySelector('.stat-label');
        const changeEl = element.querySelector('.stat-change');
        
        if (valueEl) {
            valueEl.textContent = prefix + value.toLocaleString();
        }
        if (labelEl) {
            labelEl.textContent = label;
        }
        if (changeEl) {
            changeEl.textContent = (change > 0 ? '+' : '') + change + '%';
            changeEl.className = 'stat-change ' + (change >= 0 ? 'positive' : 'negative');
        }
    }
}

// 生成销售趋势图表
function generateSalesChart() {
    const chartContainer = document.getElementById('sales-chart');
    if (!chartContainer) return;
    
    // 模拟14天销售数据
    const salesData = [];
    const labels = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push((date.getMonth() + 1) + '/' + date.getDate());
        salesData.push(Math.floor(Math.random() * 10000) + 5000);
    }
    
    // 创建简单的图表（实际项目中可以使用ECharts等库）
    createSimpleChart(chartContainer, labels, salesData, '销售趋势');
}

// 生成热销商品图表
function generateTopProductsChart() {
    const chartContainer = document.getElementById('top-products-chart');
    if (!chartContainer) return;
    
    // 模拟热销商品数据
    const products = ['苹果', '香蕉', '牛奶', '面包', '鸡蛋'];
    const sales = [120, 98, 85, 76, 65];
    
    // 创建简单的条形图
    createSimpleBarChart(chartContainer, products, sales, '热销商品TOP5');
}

// 创建简单图表
function createSimpleChart(container, labels, data, title) {
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // 绘制坐标轴
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // 绘制数据线
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const maxValue = Math.max(...data);
    const xStep = chartWidth / (data.length - 1);
    
    data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // 绘制数据点
    ctx.fillStyle = '#667eea';
    data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
        const x = padding + index * xStep;
        ctx.fillText(label, x, canvas.height - padding + 20);
    });
    
    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 20);
}

// 创建简单条形图
function createSimpleBarChart(container, labels, data, title) {
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // 绘制坐标轴
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // 绘制条形
    const maxValue = Math.max(...data);
    const barWidth = chartWidth / data.length * 0.6;
    const barSpacing = chartWidth / data.length;
    
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
        const y = canvas.height - padding - barHeight;
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 绘制数值
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth / 2, y - 5);
    });
    
    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
        const x = padding + index * barSpacing + barSpacing / 2;
        ctx.fillText(label, x, canvas.height - padding + 20);
    });
    
    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 20);
}

// 初始化人流量监控
function initializeTraffic() {
    updateTrafficStats();
    startTrafficSimulation();
}

// 更新人流量统计
function updateTrafficStats() {
    const stats = {
        entered: 156,
        left: 134,
        today: 287,
        week: 1847,
        month: 12560
    };
    
    // 更新显示
    const enteredEl = document.getElementById('entered-count');
    const leftEl = document.getElementById('left-count');
    const todayEl = document.getElementById('today-traffic');
    const weekEl = document.getElementById('week-traffic');
    const monthEl = document.getElementById('month-traffic');
    
    if (enteredEl) enteredEl.textContent = stats.entered;
    if (leftEl) leftEl.textContent = stats.left;
    if (todayEl) todayEl.textContent = stats.today;
    if (weekEl) weekEl.textContent = stats.week;
    if (monthEl) monthEl.textContent = stats.month;
}

// 启动人流量模拟
function startTrafficSimulation() {
    setInterval(() => {
        // 模拟实时更新
        const enteredEl = document.getElementById('entered-count');
        const leftEl = document.getElementById('left-count');
        
        if (enteredEl && Math.random() > 0.7) {
            const current = parseInt(enteredEl.textContent);
            enteredEl.textContent = current + Math.floor(Math.random() * 3) + 1;
        }
        
        if (leftEl && Math.random() > 0.8) {
            const current = parseInt(leftEl.textContent);
            leftEl.textContent = current + Math.floor(Math.random() * 2) + 1;
        }
    }, 3000);
}

// 初始化库存管理
function initializeInventory() {
    loadInventoryTable();
    initializeInventoryFilters();
}

// 加载库存表格
function loadInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = mockProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <div class="product-info">
                    <div class="product-avatar">${product.name.charAt(0)}</div>
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                    </div>
                </div>
            </td>
            <td>¥${product.price.toFixed(2)}</td>
            <td>
                <div class="stock-info">
                    <span class="stock-count">${product.stock}</span>
                    <span class="status-badge ${product.status}">
                        ${getStockStatusText(product.status)}
                    </span>
                </div>
            </td>
            <td>${product.createdAt}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button class="table-btn view" onclick="viewProduct(${product.id})">
                        <i class="fas fa-eye"></i>
                        查看
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 获取库存状态文本
function getStockStatusText(status) {
    const statusMap = {
        'in-stock': '充足',
        'low-stock': '偏低',
        'out-of-stock': '缺货'
    };
    return statusMap[status] || status;
}

// 初始化库存过滤器
function initializeInventoryFilters() {
    const filterSelect = document.getElementById('inventory-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function(e) {
            filterInventory(e.target.value);
        });
    }
}

// 过滤库存
function filterInventory(filter) {
    const rows = document.querySelectorAll('#inventory-table-body tr');
    rows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (statusCell) {
            const status = statusCell.classList.contains(filter) || filter === 'all';
            row.style.display = status ? '' : 'none';
        }
    });
}

// 初始化用户管理
function initializeUsers() {
    loadUsersTable();
}

// 加载用户表格
function loadUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = mockUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <div class="user-avatar small">${user.avatar}</div>
                    <div>
                        <div class="user-name">${user.username}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${user.role}</td>
            <td>
                <span class="status-badge ${user.status}">
                    ${user.status === 'active' ? '正常' : '禁用'}
                </span>
            </td>
            <td>${user.createdAt}</td>
            <td>${user.lastLogin}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button class="table-btn view" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                        详情
                    </button>
                    <button class="table-btn delete" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                        删除
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 初始化订单管理
function initializeOrders() {
    loadOrdersTable();
    initializeOrderFilters();
}

// 加载订单表格
function loadOrdersTable() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = mockOrders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>¥${order.amount.toFixed(2)}</td>
            <td>${order.items.join(', ')}</td>
            <td>${order.createdAt}</td>
            <td>
                <span class="status-badge ${order.status}">
                    ${getOrderStatusText(order.status)}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn view" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                        详情
                    </button>
                    <button class="table-btn edit" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    ${order.status === 'unpaid' ? `
                        <button class="table-btn success" onclick="markAsPaid('${order.id}')">
                            <i class="fas fa-check"></i>
                            标记已支付
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// 获取订单状态文本
function getOrderStatusText(status) {
    const statusMap = {
        'paid': '已支付',
        'unpaid': '未支付',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 初始化订单过滤器
function initializeOrderFilters() {
    const statusFilter = document.getElementById('order-status-filter');
    const dateFilter = document.getElementById('order-date-filter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', filterOrders);
    }
}

// 过滤订单
function filterOrders() {
    const statusFilter = document.getElementById('order-status-filter').value;
    const dateFilter = document.getElementById('order-date-filter').value;
    
    const rows = document.querySelectorAll('#orders-table-body tr');
    rows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        const statusMatch = !statusFilter || statusFilter === 'all' || 
                           statusCell.classList.contains(statusFilter);
        
        // 日期过滤逻辑（简化版）
        const dateMatch = !dateFilter || dateFilter === 'all';
        
        row.style.display = (statusMatch && dateMatch) ? '' : 'none';
    });
}

// 初始化商品管理
function initializeProducts() {
    loadProductsTable();
}

// 加载商品表格
function loadProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    // 复用库存管理的商品数据
    tableBody.innerHTML = mockProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <div class="product-info">
                    <div class="product-avatar">${product.name.charAt(0)}</div>
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                    </div>
                </div>
            </td>
            <td>¥${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.category}</td>
            <td>${product.createdAt}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button class="table-btn view" onclick="viewProduct(${product.id})">
                        <i class="fas fa-eye"></i>
                        查看
                    </button>
                    <button class="table-btn danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                        删除
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 搜索功能
function searchUsers(query) {
    const rows = document.querySelectorAll('#users-table-body tr');
    filterTableRows(rows, query, [1, 2]); // 搜索用户名和邮箱列
}

function searchOrders(query) {
    const rows = document.querySelectorAll('#orders-table-body tr');
    filterTableRows(rows, query, [0, 1, 3]); // 搜索订单号、客户名、商品名列
}

function searchProducts(query) {
    const rows = document.querySelectorAll('#products-table-body tr, #inventory-table-body tr');
    filterTableRows(rows, query, [1, 4]); // 搜索商品名和分类列
}

function searchInventory(query) {
    searchProducts(query); // 复用商品搜索
}

// 过滤表格行
function filterTableRows(rows, query, searchColumns) {
    rows.forEach(row => {
        let found = false;
        searchColumns.forEach(colIndex => {
            const cell = row.cells[colIndex];
            if (cell && cell.textContent.toLowerCase().includes(query)) {
                found = true;
            }
        });
        row.style.display = found ? '' : 'none';
    });
}

// 登录功能
function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    // 模拟登录验证
    if (username && password) {
        // 查找用户
        const user = mockUsers.find(u => u.username === username);
        if (user) {
            // 保存登录状态
            localStorage.setItem('adminToken', JSON.stringify(user));
            currentUser = user;
            
            showNotification('登录成功！', 'success');
            
            // 跳转到仪表盘
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showNotification('用户名或密码错误', 'error');
        }
    } else {
        showNotification('请填写完整的登录信息', 'warning');
    }
}

// 注册功能
function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // 验证密码
    if (password !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }
    
    // 检查用户名是否已存在
    if (mockUsers.some(u => u.username === username)) {
        showNotification('用户名已存在', 'error');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: mockUsers.length + 1,
        username,
        email,
        role: '管理员',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
        avatar: username.charAt(0).toUpperCase()
    };
    
    mockUsers.push(newUser);
    
    showNotification('注册成功！请登录', 'success');
    
    // 切换到登录标签
    switchTab('login');
}

// 切换标签
function switchTab(tabName) {
    // 移除所有活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-content').forEach(content => content.classList.remove('active'));
    
    // 添加活动状态
    event.target.classList.add('active');
    document.getElementById(tabName + '-form').classList.add('active');
}

// 显示忘记密码模态框
function showForgotPassword() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 关闭忘记密码模态框
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 发送重置邮件
function sendResetEmail() {
    const email = document.getElementById('reset-email').value;
    if (email) {
        showNotification('重置邮件已发送', 'success');
        closeForgotPasswordModal();
    } else {
        showNotification('请输入邮箱地址', 'error');
    }
}

// 显示服务条款
function showTerms() {
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 关闭服务条款模态框
function closeTermsModal() {
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 切换密码显示
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// 社交媒体登录
function socialLogin(provider) {
    showNotification(`${provider} 登录功能开发中...`, 'info');
}

// 商品操作
function editProduct(id) {
    showNotification(`编辑商品 ${id} 功能开发中...`, 'info');
}

function viewProduct(id) {
    showNotification(`查看商品 ${id} 功能开发中...`, 'info');
}

function deleteProduct(id) {
    if (confirm(`确定要删除商品 ${id} 吗？`)) {
        showNotification(`商品 ${id} 已删除`, 'success');
        // 重新加载表格
        loadProductsTable();
        loadInventoryTable();
    }
}

// 用户操作
function editUser(id) {
    showNotification(`编辑用户 ${id} 功能开发中...`, 'info');
}

function viewUser(id) {
    showNotification(`查看用户 ${id} 功能开发中...`, 'info');
}

function deleteUser(id) {
    if (confirm(`确定要删除用户 ${id} 吗？`)) {
        showNotification(`用户 ${id} 已删除`, 'success');
        loadUsersTable();
    }
}

// 订单操作
function viewOrder(id) {
    showNotification(`查看订单 ${id} 功能开发中...`, 'info');
}

function editOrder(id) {
    showNotification(`编辑订单 ${id} 功能开发中...`, 'info');
}

function markAsPaid(id) {
    if (confirm(`确定要将订单 ${id} 标记为已支付吗？`)) {
        // 更新订单状态
        const order = mockOrders.find(o => o.id === id);
        if (order) {
            order.status = 'paid';
            loadOrdersTable();
            showNotification(`订单 ${id} 已标记为已支付`, 'success');
        }
    }
}

// 导出功能
function exportData(type) {
    showNotification(`导出${type}数据功能开发中...`, 'info');
}

// 批量处理
function batchProcess(action) {
    showNotification(`批量${action}功能开发中...`, 'info');
}

// 通知功能
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
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
    
    .product-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .product-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
    }
    
    .product-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.2rem;
    }
    
    .product-category {
        font-size: 0.8rem;
        color: #6c757d;
    }
    
    .stock-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .stock-count {
        font-weight: 600;
        color: #333;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .user-avatar.small {
        width: 32px;
        height: 32px;
        font-size: 0.9rem;
    }
    
    .user-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.2rem;
    }
    
    .user-email {
        font-size: 0.8rem;
        color: #6c757d;
    }
`;
document.head.appendChild(style);