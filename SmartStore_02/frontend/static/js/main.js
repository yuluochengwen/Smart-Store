// SmartStore 前端主逻辑

$(document).ready(function() {
    // API基础路径
    const API_BASE = '/api/v1';
    
    // 摄像头相关变量
    let videoStream = null;
    let isDetecting = false;
    
    // 初始化
    init();
    
    function init() {
        console.log('SmartStore 初始化...');
        
        // 初始化摄像头
        initCamera();
        
        // 加载推荐商品
        loadRecommendations();
        
        // 绑定事件
        bindEvents();
        
        // 健康检查
        healthCheck();
    }
    
    // 初始化摄像头
    function initCamera() {
        const video = document.getElementById('customer-video');
        const canvas = document.getElementById('customer-canvas');
        
        if (!video) {
            console.error('未找到视频元素');
            return;
        }
        
        // 请求摄像头权限
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        })
        .then(function(stream) {
            videoStream = stream;
            video.srcObject = stream;
            video.play();
            
            console.log('摄像头已启动');
            
            // 启动顾客检测
            startCustomerDetection(video, canvas);
        })
        .catch(function(err) {
            console.error('无法访问摄像头:', err);
            showCameraError(err.message);
        });
    }
    
    // 显示摄像头错误
    function showCameraError(message) {
        const $container = $('.video-container');
        $container.append(`
            <div class="error-message">
                <p>⚠️ 无法访问摄像头</p>
                <p class="error-detail">${message}</p>
                <p class="error-hint">请确保已授予摄像头权限</p>
            </div>
        `);
    }
    
    // 启动顾客检测
    function startCustomerDetection(video, canvas) {
        if (isDetecting) return;
        isDetecting = true;
        
        const ctx = canvas.getContext('2d');
        
        // 等待视频准备好
        video.addEventListener('loadedmetadata', function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log('视频尺寸:', video.videoWidth, 'x', video.videoHeight);
        });
        
        // 高帧率渲染视频（60fps）
        let lastFrameTime = 0;
        function renderFrame(timestamp) {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            requestAnimationFrame(renderFrame);
        }
        requestAnimationFrame(renderFrame);
        
        // 人脸检测和识别（每2秒一次，避免过度请求后端）
        let isDetecting_api = false;
        setInterval(function() {
            if (video.readyState === video.HAVE_ENOUGH_DATA && !isDetecting_api) {
                isDetecting_api = true;
                detectAndRecognizeFace(video, canvas, ctx, function() {
                    isDetecting_api = false;
                });
            }
        }, 2000);
    }
    
    // 检测并识别人脸
    function detectAndRecognizeFace(video, canvas, ctx, callback) {
        // 创建临时 canvas 用于截图
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // 将 canvas 转为 base64
        const imageData = tempCanvas.toDataURL('image/jpeg', 0.7);
        
        console.log('发送人脸检测请求...');
        
        // 发送到后端进行人脸检测和识别
        $.ajax({
            url: API_BASE + '/customer/detect',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                image: imageData.split(',')[1]  // 去掉 data:image/jpeg;base64, 前缀
            }),
            success: function(response) {
                console.log('人脸检测响应:', response);
                if (response.success) {
                    handleDetectionResult(response.data);
                } else {
                    console.error('检测失败:', response.message);
                }
                if (callback) callback();
            },
            error: function(xhr, status, error) {
                console.error('人脸检测请求失败:', error);
                console.error('状态:', status);
                console.error('响应:', xhr.responseText);
                if (callback) callback();
            }
        });
    }
    
    // 处理检测结果
    function handleDetectionResult(data) {
        console.log('处理检测结果:', data);
        
        const $customerCount = $('#customer-count');
        const faceCount = data.face_count || 0;
        
        $customerCount.text(faceCount);
        
        if (faceCount === 0) {
            // 没有检测到人脸
            console.log('未检测到人脸');
            return;
        }
        
        console.log('检测到', faceCount, '个人脸');
        
        // 检查是否识别到已注册用户
        if (data.recognized && data.user) {
            console.log('识别到用户:', data.user);
            showWelcomeMessage(data.user);
            // 加载该用户的购物篮
            loadBasket(data.user.id);
        } else if (data.faces && data.faces.length > 0) {
            // 检测到人脸但未识别，提示注册
            console.log('检测到新用户，显示注册提示');
            showRegistrationPrompt(data.faces[0]);
        } else {
            console.log('检测到人脸但无法提取特征');
        }
    }
    
    // 显示欢迎消息
    function showWelcomeMessage(user) {
        const $welcome = $('#welcome-message');
        if ($welcome.length === 0) {
            // 创建欢迎消息元素
            $('.video-container').after(`
                <div id="welcome-message" class="welcome-message">
                    <p>✅ 欢迎回来，<strong>${user.name}</strong>！</p>
                    <p class="user-role">${user.role}</p>
                    <p class="user-balance">账户余额: ¥${user.balance.toFixed(2)}</p>
                </div>
            `);
        } else {
            $welcome.find('strong').text(user.name);
            $welcome.find('.user-role').text(user.role);
            $welcome.find('.user-balance').text('账户余额: ¥' + user.balance.toFixed(2));
        }
        
        // 自动隐藏注册提示
        $('#registration-prompt').fadeOut();
    }
    
    // 显示注册提示
    function showRegistrationPrompt(faceData) {
        // 避免重复显示
        if ($('#registration-prompt').length > 0) {
            return;
        }
        
        const $prompt = $(`
            <div id="registration-prompt" class="registration-prompt">
                <div class="prompt-content">
                    <h3>👤 检测到新顾客</h3>
                    <p>您还不是本店会员，是否立即注册？</p>
                    <div class="registration-form">
                        <input type="text" id="register-name" placeholder="请输入您的姓名" required />
                        <input type="tel" id="register-phone" placeholder="请输入手机号（可选）" />
                        <input type="email" id="register-email" placeholder="请输入邮箱（可选）" />
                        <div class="button-group">
                            <button id="confirm-register" class="btn btn-primary">确认注册</button>
                            <button id="cancel-register" class="btn btn-secondary">稍后再说</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append($prompt);
        
        // 保存人脸数据
        $prompt.data('faceEncoding', faceData.encoding);
        
        // 绑定事件
        $('#confirm-register').click(function() {
            registerNewCustomer(faceData.encoding);
        });
        
        $('#cancel-register').click(function() {
            $prompt.fadeOut(function() {
                $(this).remove();
            });
        });
    }
    
    // 注册新顾客
    function registerNewCustomer(faceEncoding) {
        const name = $('#register-name').val().trim();
        const phone = $('#register-phone').val().trim();
        const email = $('#register-email').val().trim();
        
        console.log('开始注册新顾客:', { name, phone, email, faceEncoding });
        
        if (!name) {
            alert('请输入您的姓名');
            return;
        }
        
        if (!faceEncoding) {
            alert('❌ 人脸特征数据丢失，请重新检测');
            console.error('face_encoding 为空');
            return;
        }
        
        // 发送注册请求
        const requestData = {
            name: name,
            phone: phone || null,
            email: email || null,
            face_encoding: faceEncoding
        };
        
        console.log('发送注册请求:', requestData);
        
        $.ajax({
            url: API_BASE + '/customer/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                console.log('注册响应:', response);
                if (response.success) {
                    alert('✅ 注册成功！欢迎来到 SmartStore！');
                    $('#registration-prompt').fadeOut(function() {
                        $(this).remove();
                    });
                    // 显示欢迎消息
                    showWelcomeMessage(response.data.user);
                } else {
                    alert('❌ 注册失败: ' + (response.message || '未知错误'));
                }
            },
            error: function(xhr, status, error) {
                console.error('注册请求失败:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText,
                    statusCode: xhr.status
                });
                
                let errorMsg = '注册失败，请稍后重试';
                if (xhr.responseText) {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMsg = '注册失败: ' + (errorData.message || errorData.error || '未知错误');
                    } catch (e) {
                        errorMsg = '注册失败: ' + xhr.responseText;
                    }
                }
                
                alert('❌ ' + errorMsg);
            }
        });
    }
    
    function bindEvents() {
        // 提问按钮
        $('#ask-btn').click(function() {
            const question = $('#question-input').val();
            if (question) {
                askQuestion(question);
            }
        });
        
        // 回车提问
        $('#question-input').keypress(function(e) {
            if (e.which === 13) {
                $('#ask-btn').click();
            }
        });
        
        // 语音按钮
        $('#voice-btn').click(function() {
            alert('语音功能需要接入麦克风');
            // 这里可以实现真实的语音识别
        });
        
        // 结算按钮
        $('#checkout-btn').click(function() {
            checkout();
        });
    }
    
    // 健康检查
    function healthCheck() {
        $.get(API_BASE + '/health', function(response) {
            console.log('系统状态:', response);
        });
    }
    
    // 提问
    function askQuestion(question) {
        const $responseBox = $('#voice-response');
        $responseBox.html('<p>思考中...</p>');
        
        $.ajax({
            url: API_BASE + '/voice/ask',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ question: question }),
            success: function(response) {
                if (response.success) {
                    $responseBox.html('<p>' + response.data.answer + '</p>');
                    $('#question-input').val('');
                }
            },
            error: function() {
                $responseBox.html('<p style="color:red;">抱歉，回答失败了。</p>');
            }
        });
    }
    
    // 加载推荐商品
    function loadRecommendations() {
        $.ajax({
            url: API_BASE + '/recommend',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query: '热门商品' }),
            success: function(response) {
                if (response.success) {
                    displayRecommendations(response.data.recommendations);
                }
            }
        });
    }
    
    // 显示推荐商品
    function displayRecommendations(items) {
        const $container = $('#recommendations');
        $container.empty();
        
        if (items.length === 0) {
            $container.html('<p>暂无推荐商品</p>');
            return;
        }
        
        items.forEach(function(item) {
            const $card = $('<div class="product-card">').html(`
                <h4>${item.name}</h4>
                <p class="price">¥${item.price}</p>
                <p>${item.location}</p>
            `);
            $container.append($card);
        });
    }
    
    // 获取购物篮
    function loadBasket(userId) {
        $.get(API_BASE + '/basket/' + userId, function(response) {
            if (response.success) {
                displayBasket(response.data);
            }
        });
    }
    
    // 显示购物篮
    function displayBasket(data) {
        const $list = $('#basket-items');
        $list.empty();
        
        if (data.items.length === 0) {
            $list.html('<p>购物篮是空的</p>');
        } else {
            data.items.forEach(function(item) {
                const $item = $('<div class="basket-item">').html(`
                    <div>
                        <strong>${item.name}</strong>
                        <span> x${item.quantity}</span>
                    </div>
                    <div class="price">¥${item.total_price.toFixed(2)}</div>
                `);
                $list.append($item);
            });
        }
        
        $('#basket-total').text(data.total.toFixed(2));
    }
    
    // 结算
    function checkout() {
        alert('请使用人脸或二维码进行支付');
        // 这里可以跳转到支付页面
    }
});
