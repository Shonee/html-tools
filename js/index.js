/**
 * 加载工具配置并生成导航卡片
 * @param {string} configPath 配置文件路径
 */
async function loadTools(configPath) {
    try {
        const response = await fetch(configPath);
        if (!response.ok) throw new Error('配置加载失败');
        
        const config = await response.json();
        renderToolCards(config.tools);
        
    } catch (error) {
        console.error('工具加载失败:', error);
        showErrorAlert();
    }
}

/**
 * 渲染工具卡片
 * @param {Array} tools 工具配置数组
 */
function renderToolCards(tools) {
    const container = document.getElementById('tool-container');
    const template = tools.map(tool => `
        <div class="tool-card">
            <div class="tool-icon">${tool.icon || '⚙️'}</div>
            <h2>${tool.title}</h2>
            <p>${tool.description}</p>
            <a href="${tool.url}" target="_blank">立即使用</a>
        </div>
    `).join('');

    container.innerHTML = template;
    addCardHoverEffect();
}

/**
 * 添加卡片悬停动画
 */
function addCardHoverEffect() {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
        });
    });
}

/**
 * 显示错误提示
 */
function showErrorAlert() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="error-alert">
            <h3>⚠️ 工具加载失败</h3>
            <p>请刷新页面重试或联系管理员</p>
        </div>
    `;
}
