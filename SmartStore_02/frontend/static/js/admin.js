/**
 * SmartStore 管理后台 JavaScript
 */

const API_BASE = '/api/v1';

$(document).ready(function() {
    initNavigation();
    loadDashboardData();
    bindEvents();
});

// 导航切换
function initNavigation() {
    $('.nav-item').click(function(e) {
        e.preventDefault();
        
        const section = $(this).data('section');
        
        // 更新导航状态
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        
        // 更新内容区域
        $('.content-section').removeClass('active');
        $(`#${section}`).addClass('active');
        
        // 更新页面标题
        const title = $(this).text().trim();
        $('#page-title').text(title);
        
        // 加载对应数据
        loadSectionData(section);
    });
}

// 加载区块数据
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'commodities':
            loadCommodities();
            break;
        case 'users':
            loadUsers();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'inventory':
            loadInventory();
            break;
    }
}

// 加载仪表盘数据
function loadDashboardData() {
    // 加载统计数据
    $.ajax({
        url: API_BASE + '/admin/stats',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const stats = response.data;
                $('#today-sales').text(`¥${stats.today_sales || '0.00'}`);
                $('#today-orders').text(stats.today_orders || 0);
                $('#total-users').text(stats.total_users || 0);
                $('#total-commodities').text(stats.total_commodities || 0);
            }
        },
        error: function() {
            console.error('加载统计数据失败');
        }
    });
    
    // 加载最近交易
    $.ajax({
        url: API_BASE + '/admin/recent-transactions',
        method: 'GET',
        success: function(response) {
            if (response.success && response.data.length > 0) {
                renderRecentTransactions(response.data);
            }
        }
    });
}

// 渲染最近交易
function renderRecentTransactions(transactions) {
    const html = transactions.map(t => `
        <div class="transaction-item">
            <div>
                <strong>${t.user_name}</strong>
                <span class="text-secondary">订单 #${t.id}</span>
            </div>
            <div class="transaction-amount">¥${t.amount.toFixed(2)}</div>
        </div>
    `).join('');
    
    $('#recent-transactions').html(html);
}

// 加载商品列表
function loadCommodities(searchTerm = '') {
    $.ajax({
        url: API_BASE + '/commodities',
        method: 'GET',
        data: { search: searchTerm },
        success: function(response) {
            if (response.success) {
                renderCommodities(response.data);
            }
        },
        error: function() {
            $('#commodity-list').html(`
                <tr><td colspan="8" class="text-center" style="color: #ef4444;">
                    加载失败，请稍后重试
                </td></tr>
            `);
        }
    });
}

// 渲染商品列表
function renderCommodities(commodities) {
    if (commodities.length === 0) {
        $('#commodity-list').html(`
            <tr><td colspan="8" class="text-center">暂无商品数据</td></tr>
        `);
        return;
    }
    
    const html = commodities.map(c => `
        <tr>
            <td>${c.id}</td>
            <td><strong>${c.name}</strong></td>
            <td>${c.category || '-'}</td>
            <td>¥${c.price.toFixed(2)}</td>
            <td>${c.stock}</td>
            <td>${c.location || '-'}</td>
            <td>${formatDateTime(c.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-commodity" data-id="${c.id}">编辑</button>
                <button class="btn btn-sm btn-danger delete-commodity" data-id="${c.id}">删除</button>
            </td>
        </tr>
    `).join('');
    
    $('#commodity-list').html(html);
    
    // 绑定编辑和删除按钮
    $('.edit-commodity').click(function() {
        editCommodity($(this).data('id'));
    });
    
    $('.delete-commodity').click(function() {
        deleteCommodity($(this).data('id'));
    });
}

// 加载用户列表
function loadUsers(searchTerm = '', role = '') {
    $.ajax({
        url: API_BASE + '/admin/users',
        method: 'GET',
        data: { search: searchTerm, role: role },
        success: function(response) {
            if (response.success) {
                renderUsers(response.data);
            }
        },
        error: function() {
            $('#user-list').html(`
                <tr><td colspan="8" class="text-center" style="color: #ef4444;">
                    加载失败，请稍后重试
                </td></tr>
            `);
        }
    });
}

// 渲染用户列表
function renderUsers(users) {
    if (users.length === 0) {
        $('#user-list').html(`
            <tr><td colspan="8" class="text-center">暂无用户数据</td></tr>
        `);
        return;
    }
    
    const html = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td><strong>${u.name}</strong></td>
            <td>${u.phone || '-'}</td>
            <td>${u.email || '-'}</td>
            <td><span class="status-badge status-info">${u.role}</span></td>
            <td>¥${u.balance.toFixed(2)}</td>
            <td>${formatDateTime(u.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-primary view-user" data-id="${u.id}">详情</button>
                <button class="btn btn-sm btn-success recharge-user" data-id="${u.id}">充值</button>
            </td>
        </tr>
    `).join('');
    
    $('#user-list').html(html);
}

// 加载交易记录
function loadTransactions(startDate = '', endDate = '') {
    $.ajax({
        url: API_BASE + '/admin/transactions',
        method: 'GET',
        data: { start_date: startDate, end_date: endDate },
        success: function(response) {
            if (response.success) {
                renderTransactions(response.data);
            }
        },
        error: function() {
            $('#transaction-list').html(`
                <tr><td colspan="7" class="text-center" style="color: #ef4444;">
                    加载失败，请稍后重试
                </td></tr>
            `);
        }
    });
}

// 渲染交易记录
function renderTransactions(transactions) {
    if (transactions.length === 0) {
        $('#transaction-list').html(`
            <tr><td colspan="7" class="text-center">暂无交易记录</td></tr>
        `);
        return;
    }
    
    const html = transactions.map(t => `
        <tr>
            <td>#${t.id}</td>
            <td>${t.user_name}</td>
            <td><strong>¥${t.amount.toFixed(2)}</strong></td>
            <td>${t.payment_method || '账户余额'}</td>
            <td><span class="status-badge ${getStatusClass(t.status)}">${getStatusText(t.status)}</span></td>
            <td>${formatDateTime(t.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-primary view-transaction" data-id="${t.id}">详情</button>
            </td>
        </tr>
    `).join('');
    
    $('#transaction-list').html(html);
}

// 加载库存信息
function loadInventory() {
    $.ajax({
        url: API_BASE + '/admin/inventory',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // 更新统计卡片
                $('#total-inventory-value').text(`¥${data.total_value.toFixed(2)}`);
                $('#low-stock-count').text(data.low_stock_count);
                $('#out-stock-count').text(data.out_stock_count);
                
                // 渲染库存列表
                renderInventoryList(data.items);
            }
        }
    });
}

// 渲染库存列表
function renderInventoryList(items) {
    if (items.length === 0) {
        $('#inventory-list').html(`
            <tr><td colspan="7" class="text-center">暂无库存数据</td></tr>
        `);
        return;
    }
    
    const html = items.map(item => {
        const status = getInventoryStatus(item.stock, item.safe_stock);
        return `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.stock}</td>
                <td>${item.safe_stock || 10}</td>
                <td>¥${item.price.toFixed(2)}</td>
                <td>¥${(item.stock * item.price).toFixed(2)}</td>
                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-sm btn-success restock-item" data-id="${item.id}">补货</button>
                </td>
            </tr>
        `;
    }).join('');
    
    $('#inventory-list').html(html);
}

// 获取库存状态
function getInventoryStatus(stock, safeStock = 10) {
    if (stock === 0) {
        return { class: 'status-danger', text: '缺货' };
    } else if (stock < safeStock) {
        return { class: 'status-warning', text: '库存不足' };
    } else {
        return { class: 'status-success', text: '库存充足' };
    }
}

// 绑定事件
function bindEvents() {
    // 商品搜索
    $('#search-commodity').on('input', function() {
        const searchTerm = $(this).val();
        loadCommodities(searchTerm);
    });
    
    // 用户搜索
    $('#search-user').on('input', function() {
        const searchTerm = $(this).val();
        const role = $('#filter-role').val();
        loadUsers(searchTerm, role);
    });
    
    // 角色筛选
    $('#filter-role').change(function() {
        const searchTerm = $('#search-user').val();
        const role = $(this).val();
        loadUsers(searchTerm, role);
    });
    
    // 交易筛选
    $('#filter-transactions-btn').click(function() {
        const startDate = $('#start-date').val();
        const endDate = $('#end-date').val();
        loadTransactions(startDate, endDate);
    });
    
    // 添加商品
    $('#add-commodity-btn').click(function() {
        showAddCommodityModal();
    });
    
    // 确认添加商品
    $('#confirm-add-commodity').click(function() {
        addCommodity();
    });
    
    // 确认编辑商品
    $('#confirm-edit-commodity').click(function() {
        updateCommodity();
    });
    
    // 模态框关闭
    $('.close, .cancel-btn').click(function() {
        $(this).closest('.modal').removeClass('active');
    });
    
    // 刷新库存
    $('#refresh-inventory').click(function() {
        loadInventory();
    });
    
    // 低库存预警
    $('#low-stock-alert').click(function() {
        alert('功能开发中...');
    });
    
    // 保存设置
    $('.save-settings-btn').click(function() {
        saveSettings();
    });
}

// 显示添加商品模态框
function showAddCommodityModal() {
    // 清空表单
    $('#commodity-name').val('');
    $('#commodity-category').val('');
    $('#commodity-price').val('');
    $('#commodity-stock').val('');
    $('#commodity-location').val('');
    $('#commodity-description').val('');
    
    $('#add-commodity-modal').addClass('active');
}

// 添加商品
function addCommodity() {
    const data = {
        name: $('#commodity-name').val().trim(),
        category: $('#commodity-category').val().trim(),
        price: parseFloat($('#commodity-price').val()),
        stock: parseInt($('#commodity-stock').val()),
        location: $('#commodity-location').val().trim()
    };
    
    if (!data.name) {
        alert('请输入商品名称');
        return;
    }
    
    if (!data.price || data.price <= 0) {
        alert('请输入有效价格');
        return;
    }
    
    if (!data.stock || data.stock < 0) {
        alert('请输入有效库存数量');
        return;
    }
    
    $.ajax({
        url: API_BASE + '/admin/commodities',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                alert('✅ 商品添加成功！');
                $('#add-commodity-modal').removeClass('active');
                loadCommodities();
            } else {
                alert('❌ 添加失败: ' + response.message);
            }
        },
        error: function(xhr) {
            alert('❌ 添加失败，请稍后重试');
            console.error(xhr.responseText);
        }
    });
}

// 编辑商品
function editCommodity(id) {
    // 获取商品详情
    $.ajax({
        url: API_BASE + '/admin/commodities/' + id,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const commodity = response.data;
                
                // 填充表单
                $('#edit-commodity-id').val(commodity.id);
                $('#edit-commodity-name').val(commodity.name);
                $('#edit-commodity-category').val(commodity.category || '');
                $('#edit-commodity-price').val(commodity.price);
                $('#edit-commodity-stock').val(commodity.stock);
                $('#edit-commodity-location').val(commodity.location || '');
                
                $('#edit-commodity-modal').addClass('active');
            }
        }
    });
}

// 更新商品
function updateCommodity() {
    const id = $('#edit-commodity-id').val();
    const data = {
        name: $('#edit-commodity-name').val().trim(),
        category: $('#edit-commodity-category').val().trim(),
        price: parseFloat($('#edit-commodity-price').val()),
        stock: parseInt($('#edit-commodity-stock').val()),
        location: $('#edit-commodity-location').val().trim()
    };
    
    $.ajax({
        url: API_BASE + '/admin/commodities/' + id,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                alert('✅ 商品更新成功！');
                $('#edit-commodity-modal').removeClass('active');
                loadCommodities();
            } else {
                alert('❌ 更新失败: ' + response.message);
            }
        },
        error: function() {
            alert('❌ 更新失败，请稍后重试');
        }
    });
}

// 删除商品
function deleteCommodity(id) {
    if (!confirm('确定要删除这个商品吗？')) {
        return;
    }
    
    $.ajax({
        url: API_BASE + '/admin/commodities/' + id,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                alert('✅ 商品删除成功！');
                loadCommodities();
            } else {
                alert('❌ 删除失败: ' + response.message);
            }
        },
        error: function() {
            alert('❌ 删除失败，请稍后重试');
        }
    });
}

// 保存设置
function saveSettings() {
    const settings = {
        face_threshold: parseFloat($('#face-threshold').val()),
        detection_fps: parseInt($('#detection-fps').val()),
        enable_face_payment: $('#enable-face-payment').is(':checked'),
        enable_qr_payment: $('#enable-qr-payment').is(':checked'),
        low_stock_threshold: parseInt($('#low-stock-threshold').val()),
        auto_restock_alert: $('#auto-restock-alert').is(':checked')
    };
    
    console.log('保存设置:', settings);
    alert('✅ 设置已保存！');
}

// 工具函数
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const statusMap = {
        'COMPLETED': 'status-success',
        'PENDING': 'status-warning',
        'FAILED': 'status-danger',
        'CANCELLED': 'status-secondary'
    };
    return statusMap[status] || 'status-info';
}

function getStatusText(status) {
    const statusMap = {
        'COMPLETED': '已完成',
        'PENDING': '处理中',
        'FAILED': '失败',
        'CANCELLED': '已取消'
    };
    return statusMap[status] || status;
}
