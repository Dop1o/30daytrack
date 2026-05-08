const CONFIG = {
    colorMap: {
        // Основные цвета
        blue: { hex: '#0e5ede', name: 'Синий', name_en: 'Blue' },
        green: { hex: '#10b981', name: 'Зеленый', name_en: 'Green' },
        purple: { hex: '#8b5cf6', name: 'Фиолетовый', name_en: 'Purple' },
        orange: { hex: '#f97316', name: 'Оранжевый', name_en: 'Orange' },
        pink: { hex: '#ec4899', name: 'Розовый', name_en: 'Pink' },
        
        // Дополнительные цвета
        red: { hex: '#ef4444', name: 'Красный', name_en: 'Red' },
        yellow: { hex: '#d8d108', name: 'Желтый', name_en: 'Yellow' },
        indigo: { hex: '#6366f1', name: 'Индиго', name_en: 'Indigo' },
        teal: { hex: '#1bbfae', name: 'Бирюзовый', name_en: 'Teal' },
        cyan: { hex: '#04d0f9', name: 'Голубой', name_en: 'Cyan' },
        amber: { hex: '#f59e0b', name: 'Янтарный', name_en: 'Amber' },
        lime: { hex: '#95eb14', name: 'Лайм', name_en: 'Lime' },
        emerald: { hex: '#37da88', name: 'Изумрудный', name_en: 'Emerald' },
        fuchsia: { hex: '#d946ef', name: 'Фуксия', name_en: 'Fuchsia' },
        rose: { hex: '#e65cc8', name: 'Розовый', name_en: 'Rose' }
    },
    storageKey: '30day_trackers_v2',
    maxTrackers: 50
};

const ThemeManager = {
    currentTheme: 'light',
    
    init() {
        const savedTheme = localStorage.getItem('tracker_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);
        this.initThemeToggle();
    },
    
    applyTheme(theme) {
        this.currentTheme = theme;
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        localStorage.setItem('tracker_theme', theme);
        this.updateThemeIcons(theme);
    },
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        if (newTheme === 'dark') {
            Utils.showNotification(I18n.t('notification_dark_theme'));
        } else {
            Utils.showNotification(I18n.t('notification_light_theme'));
        }
    },
    
    initThemeToggle() {
        const desktopToggle = document.getElementById('theme-toggle');
        if (desktopToggle) {
            desktopToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTheme();
            });
        }
        
        const mobileToggle = document.getElementById('mobile-theme-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTheme();
            });
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('tracker_theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },
    
    updateThemeIcons(theme) {
        const moonIcons = document.querySelectorAll('.fa-moon');
        const sunIcons = document.querySelectorAll('.fa-sun');
        
        if (theme === 'dark') {
            moonIcons.forEach(icon => icon.classList.add('hidden'));
            sunIcons.forEach(icon => icon.classList.remove('hidden'));
        } else {
            moonIcons.forEach(icon => icon.classList.remove('hidden'));
            sunIcons.forEach(icon => icon.classList.add('hidden'));
        }
    },
    
    updateThemeText() {
        const themeTexts = document.querySelectorAll('[data-translate="theme"]');
        themeTexts.forEach(el => {
            if (I18n && I18n.t) {
                el.textContent = I18n.t('theme');
            }
        });
    }
};


const ChartManager = {
    charts: {},
    
    init() {
        this.initCharts();
        this.initThemeObserver();
    },
    
    initCharts() {
        this.createStreakHeatmap();
        this.createCategoryChart();
        this.createCompletionTimeline();
    },

    // Обработчик события изменения размера окна
    handleResize() {
        if (this.resizeTimeout) {
            cancelAnimationFrame(this.resizeTimeout);
        }
        
        this.resizeTimeout = requestAnimationFrame(() => {
            Object.keys(this.charts).forEach(key => {
                const chart = this.charts[key];
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        });
    },
    
    // Тепловая карта активности
    createStreakHeatmap() {
        const ctx = document.getElementById('streak-heatmap')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.heatmap) {
            this.charts.heatmap.destroy();
        }
        
        const trackers = TrackerStorage.getTrackers();
        const heatmapData = this.calculateHeatmapData(trackers);
        
        // Переводим дни недели
        const weekdays = [
            I18n.t('weekday_short_mon', 'Пн'),
            I18n.t('weekday_short_tue', 'Вт'),
            I18n.t('weekday_short_wed', 'Ср'),
            I18n.t('weekday_short_thu', 'Чт'),
            I18n.t('weekday_short_fri', 'Пт'),
            I18n.t('weekday_short_sat', 'Сб'),
            I18n.t('weekday_short_sun', 'Вс')
        ];
        
        // Полные названия для подсказок
        const weekdaysFull = [
            I18n.t('weekday_monday', 'Понедельник'),
            I18n.t('weekday_tuesday', 'Вторник'),
            I18n.t('weekday_wednesday', 'Среда'),
            I18n.t('weekday_thursday', 'Четверг'),
            I18n.t('weekday_friday', 'Пятница'),
            I18n.t('weekday_saturday', 'Суббота'),
            I18n.t('weekday_sunday', 'Воскресенье')
        ];
        
        this.charts.heatmap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekdays,
                datasets: [{
                    label: I18n.t('chart_activity', 'Активность'),
                    data: heatmapData.weeklyAverage,
                    backgroundColor: (context) => {
                        const value = context.raw;
                        if (value === 0) return 'rgba(156, 163, 175, 0.2)'; // серый для нуля
                        if (value < 2) return 'rgba(59, 130, 246, 0.4)';    // светло-синий
                        if (value < 4) return 'rgba(59, 130, 246, 0.6)';    // синий
                        if (value < 6) return 'rgba(59, 130, 246, 0.8)';    // темно-синий
                        return 'rgba(59, 130, 246, 1)';                     // самый темный
                    },
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.getThemeColor('tooltip'),
                        titleColor: this.getThemeColor('tooltipTitle'),
                        bodyColor: this.getThemeColor('tooltipText'),
                        borderColor: this.getThemeColor('grid'),
                        borderWidth: 1,
                        padding: 10,
                        caretSize: 6,
                        cornerRadius: 6,
                        titleFont: {
                            weight: 'bold',
                            size: 13
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            title: (context) => {
                                // Используем полное название дня недели
                                const index = context[0].dataIndex;
                                return weekdaysFull[index];
                            },
                            label: (context) => {
                                const value = context.raw;
                                if (value === 0) {
                                    return I18n.t('tooltip_no_activity', 'Нет активности');
                                }
                                if (value === 1) {
                                    return I18n.t('tooltip_one_tracker', '1 трекер');
                                }
                                // Склонение для русского языка
                                if (I18n.currentLang === 'ru') {
                                    if (value >= 2 && value <= 4) {
                                        return `${value} ${I18n.t('tooltip_trackers_few', 'трекера в среднем')}`;
                                    }
                                }
                                return `${value} ${I18n.t('tooltip_trackers', 'трекеров в среднем')}`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: I18n.t('chart_heatmap_title', 'Активность по дням недели'),
                        color: this.getThemeColor('text'),
                        font: { size: 14, weight: 'normal' },
                        padding: { bottom: 20 }
                    },
                    subtitle: {
                        display: true,
                        text: I18n.t('chart_heatmap_subtitle', 'Чем темнее цвет, тем больше трекеров вы отмечали'),
                        color: this.getThemeColor('text'),
                        font: { size: 11, style: 'italic' },
                        padding: { top: 0, bottom: 10 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.getThemeColor('grid')
                        },
                        ticks: {
                            color: this.getThemeColor('text'),
                            stepSize: 1,
                            callback: (value) => value
                        },
                        title: {
                            display: true,
                            text: I18n.t('chart_avg_trackers', 'Среднее количество'),
                            color: this.getThemeColor('text')
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: this.getThemeColor('text')
                        }
                    }
                }
            }
        });
    },
    
    // Круговая диаграмма с прогрессом
    createCategoryChart() {
        const ctx = document.getElementById('category-chart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        const trackers = TrackerStorage.getTrackers();
        const categoryData = this.calculateCategoryProgress(trackers);
        
        // Фильтруем только категории с трекерами
        const activeCategories = categoryData.labels.filter((_, i) => categoryData.values[i] > 0);
        const activeValues = categoryData.values.filter(v => v > 0);
        const activeColors = categoryData.colors.filter((_, i) => categoryData.values[i] > 0);
        
        if (activeCategories.length === 0) {
            // Если нет данных, показываем заглушку
            this.showNoDataChart(ctx, I18n.t('chart_no_categories', 'Создайте трекеры в разных категориях'));
            return;
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: activeCategories,
                datasets: [{
                    data: activeValues,
                    backgroundColor: activeColors,
                    borderColor: this.getThemeColor('background'),
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.getThemeColor('text'),
                            font: { 
                                size: 12,
                                weight: '500'
                            },
                            padding: 15,
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => ({
                                        text: `${label}: ${data.datasets[0].data[i]} ${I18n.t('chart_trackers', 'трек.')}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: this.getThemeColor('background'),
                                        lineWidth: 2,
                                        hidden: false,
                                        index: i,
                                        fontColor: this.getThemeColor('text')
                                    }));
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: this.getThemeColor('tooltip'),
                        titleColor: this.getThemeColor('text'),
                        bodyColor: this.getThemeColor('text'),
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const FEW_TRACKERS_MAX = 4;
                                const FEW_TRACKERS_MIN = 2;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                
                                // Используем I18n для правильного склонения
                                let trackerWord = I18n.t('chart_trackers', 'трек.');
                                
                                
                                if (I18n.currentLang === 'ru') {
                                    if (value === 1) {
                                        trackerWord = I18n.t('tracker_one', 'трекер');
                                    } else if (value >= FEW_TRACKERS_MIN && value <= FEW_TRACKERS_MAX) {
                                        trackerWord = I18n.t('tracker_few', 'трекера');
                                    } else {
                                        trackerWord = I18n.t('tracker_many', 'трекеров');
                                    }
                                }
                                
                                return `${label}: ${value} ${trackerWord} (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: I18n.t('chart_category_title', 'Распределение по категориям'),
                        color: this.getThemeColor('text'),
                        font: { size: 14, weight: 'normal' },
                        padding: { bottom: 10 }
                    }
                },
                cutout: '65%'
            }
        });
    },
    
    // График завершения трекеров (когда пользователь завершит 30 дней)
    createCompletionTimeline() {
        const ctx = document.getElementById('completion-timeline')?.getContext('2d');
        if (!ctx) return;
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }
        
        const trackers = TrackerStorage.getTrackers();
        const timelineData = this.calculateCompletionData(trackers);
        
        if (timelineData.labels.length === 0) {
            this.showNoDataChart(ctx, I18n.t('chart_no_completions', 'Отмечайте прогресс, чтобы увидеть динамику'));
            return;
        }
        
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [
                    {
                        label: I18n.t('chart_completed', 'Завершено'),
                        data: timelineData.completed,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: I18n.t('chart_active', 'Активные'),
                        data: timelineData.active,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: this.getThemeColor('text'),
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: this.getThemeColor('tooltip'),
                        titleColor: this.getThemeColor('tooltipTitle'),
                        bodyColor: this.getThemeColor('tooltipText'),
                        borderColor: this.getThemeColor('grid'),
                        borderWidth: 1,
                        padding: 10,
                        caretSize: 6,
                        cornerRadius: 6,
                        titleFont: {
                            weight: 'bold',
                            size: 13
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                return `${label}: ${value}`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: I18n.t('chart_timeline_title', 'Динамика завершения трекеров'),
                        color: this.getThemeColor('text'),
                        font: { size: 14, weight: 'normal' },
                        padding: { bottom: 10 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.getThemeColor('grid') },
                        ticks: { 
                            color: this.getThemeColor('text'),
                            stepSize: 1,
                            callback: (value) => Math.floor(value)
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: this.getThemeColor('text'),
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },
    
    // Заглушка для случаев без данных
    showNoDataChart(ctx, message) {
        const canvas = ctx.canvas;
        const parent = canvas.parentNode;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Показываем сообщение
        const messageEl = document.createElement('div');
        messageEl.className = 'no-data-message text-gray-400 text-center p-4';
        messageEl.style.position = 'absolute';
        messageEl.style.top = '50%';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translate(-50%, -50%)';
        messageEl.style.width = '100%';
        messageEl.innerHTML = `
            <i class="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
            <p class="text-sm">${message}</p>
        `;
        
        // Удаляем старые сообщения
        parent.querySelectorAll('.no-data-message').forEach(el => el.remove());
        parent.appendChild(messageEl);
    },
    
    // Расчет данных для тепловой карты
    calculateHeatmapData(trackers) {
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; 
        
        trackers.forEach(tracker => {
            if (tracker.checkedDays && tracker.checkedDays.length > 0) {
                // Используем дату обновления для определения дня недели
                const lastUpdate = new Date(tracker.updatedAt);
                const dayOfWeek = lastUpdate.getDay(); 
                
                // Преобразуем в наш формат (Пн=0, Вс=6)
                const ourDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                dayCounts[ourDay]++;
            }
        });
        
        // Находим максимальное значение для нормализации
        const max = Math.max(...dayCounts, 1);
        
        return {
            weeklyAverage: dayCounts,
            normalized: dayCounts.map(count => (count / max) * 10)
        };
    },
    
    // Расчет данных по категориям с прогрессом
    calculateCategoryProgress(trackers) {
        const categories = {
            health: { count: 0, progress: 0 },
            sport: {count: 0, progress: 0},
            learning: { count: 0, progress: 0 },
            growth: { count: 0, progress: 0 },
            productivity: { count: 0, progress: 0 },
            mindfulness: { count: 0, progress: 0 },
            psychology: { count: 0, progress: 0 },
            other: { count: 0, progress: 0 }
        };
        
        trackers.forEach(tracker => {
            if (categories.hasOwnProperty(tracker.category)) {
                categories[tracker.category].count++;
                categories[tracker.category].progress += tracker.progress || 0;
            } else {
                categories.other.count++;
                categories.other.progress += tracker.progress || 0;
            }
        });
        
        // Вычисляем средний прогресс для каждой категории
        Object.keys(categories).forEach(key => {
            if (categories[key].count > 0) {
                categories[key].progress = Math.round(categories[key].progress / categories[key].count);
            }
        });
        
        return {
            labels: [
                I18n.t('category_health'),
                I18n.t('category_sport'),
                I18n.t('category_learning'),
                I18n.t('category_growth'),
                I18n.t('category_productivity'),
                I18n.t('category_mindfulness'),
                I18n.t('category_psychology'),
                I18n.t('category_other')
            ],
            values: Object.values(categories).map(c => c.count),
            progress: Object.values(categories).map(c => c.progress),
            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#ef4444', '#d8d108', '#6366f1', '#1bbfae', '#04d0f9', '#f59e0b', '#95eb14', '#37da88', '#d946ef', '#e65cc8']
        };
    },
    
    // Расчет данных для временной линии
    calculateCompletionData(trackers) {
        // Сортируем трекеры по дате создания
        const sortedTrackers = [...trackers].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        const labels = [];
        const completed = [];
        const active = [];
        
        let completedCount = 0;
        let activeCount = 0;
        
        sortedTrackers.forEach((tracker, index) => {
            const date = new Date(tracker.createdAt).toLocaleDateString(
                I18n.currentLang === 'ru' ? 'ru-RU' : 'en-US',
                { day: 'numeric', month: 'short' }
            );
            
            labels.push(date);
            
            if (tracker.progress === 100) {
                completedCount++;
            } else if (tracker.checkedDays && tracker.checkedDays.length > 0) {
                activeCount++;
            }
            
            completed.push(completedCount);
            active.push(activeCount);
        });
        
        // Если меньше 3 точек, добавляем текущую дату для наглядности
        if (labels.length < 3) {
            const today = new Date().toLocaleDateString(
                I18n.currentLang === 'ru' ? 'ru-RU' : 'en-US',
                { day: 'numeric', month: 'short' }
            );
            
            if (!labels.includes(today)) {
                labels.push(today);
                completed.push(completedCount);
                active.push(activeCount);
            }
        }
        
        return { labels, completed, active };
    },
    
    // Получение цветов в зависимости от темы
    getThemeColor(element) {
        const isDark = document.documentElement.classList.contains('dark');
        const colors = {
            text: isDark ? '#e5e7eb' : '#374151',
            grid: isDark ? '#374151' : '#e5e7eb',
            background: isDark ? '#1f2937' : '#ffffff',
            tooltip: isDark ? '#374151' : '#ffffff', // Светлый фон для подсказок в светлой теме
            tooltipText: isDark ? '#e5e7eb' : '#1f2937', // Темный текст для подсказок в светлой теме
            tooltipTitle: isDark ? '#ffffff' : '#111827' // Еще темнее для заголовка
        };
        return colors[element] || colors.text;
    },
    
    // Обновление всех графиков
    updateCharts() {
        // Очищаем заглушки
        document.querySelectorAll('.no-data-message').forEach(el => el.remove());
        
        // Пересоздаем графики
        this.createStreakHeatmap();
        this.createCategoryChart();
        this.createCompletionTimeline();
    },
    
    // Наблюдатель за изменением темы
    initThemeObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    this.updateCharts();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
    }
};

const Utils = {
    sanitizeHtml(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    sanitizeText(str, maxLength = 1000) {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
    },

    sanitizeTrackerId(id) {
        const raw = typeof id === 'string' ? id : String(id || '');
        const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
        return cleaned || this.generateId();
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatDate(date) {
        return I18n.formatDate(date);
    },
    
    showNotification(messageKey, type = 'success') {
        const notification = document.getElementById('simple-notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;
        
        const translatedMessage = I18n.t(messageKey, messageKey);
        notificationText.textContent = translatedMessage;
        
        if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#f59e0b';
        } else {
            notification.style.backgroundColor = '#1f2937';
        }
        
        notification.classList.remove('hidden');
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.classList.add('hidden');
                notification.style.opacity = '0';
            }, 300);
        }, 3000);
    },
    
    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text)
                .then(() => true)
                .catch(() => this.copyFallback(text));
        }
        return this.copyFallback(text);
    },
    
    copyFallback(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch {
            return false;
        }
    },
    
    getTrackerUrl(trackerId) {
        return `${window.location.origin}${window.location.pathname}#tracker-${trackerId}`;
    }
};

const TrackerStorage = {
    normalizeTracker(rawTracker = {}) {
        const safeCheckedDays = Array.isArray(rawTracker.checkedDays)
            ? [...new Set(
                rawTracker.checkedDays
                    .map(day => Number(day))
                    .filter(day => Number.isInteger(day) && day >= 1 && day <= 30)
            )].sort((a, b) => a - b)
            : [];

        const safeUpdatedAt = rawTracker.updatedAt || new Date().toISOString();
        const safeCreatedAt = rawTracker.createdAt || safeUpdatedAt;

        return {
            id: Utils.sanitizeTrackerId(rawTracker.id),
            name: Utils.sanitizeText(rawTracker.name || '', 100),
            category: Utils.sanitizeText(rawTracker.category || '', 50),
            goal: Utils.sanitizeText(rawTracker.goal || '', 500),
            note: Utils.sanitizeText(rawTracker.note || '', 1000),
            color: CONFIG.colorMap[rawTracker.color] ? rawTracker.color : 'blue',
            checkedDays: safeCheckedDays,
            progress: Math.round((safeCheckedDays.length / 30) * 100),
            createdAt: safeCreatedAt,
            updatedAt: safeUpdatedAt
        };
    },

    normalizeTrackers(rawTrackers) {
        if (!Array.isArray(rawTrackers)) return [];
        return rawTrackers
            .map(tracker => this.normalizeTracker(tracker))
            .filter(tracker => tracker.name && tracker.category && tracker.goal);
    },

    getTrackers() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            return data ? this.normalizeTrackers(JSON.parse(data)) : [];
        } catch {
            return [];
        }
    },
    
    saveTrackers(trackers) {
        try {
            trackers = this.normalizeTrackers(trackers);

            if (trackers.length > CONFIG.maxTrackers) {
                trackers = trackers.slice(0, CONFIG.maxTrackers);
                Utils.showNotification(
                    I18n.t('notification_tracker_limit', `Достигнут лимит трекеров (${CONFIG.maxTrackers})`), 
                    'warning'
                );
            }
            
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(trackers));
            return true;
        } catch {
            Utils.showNotification(I18n.t('error_saving_data', 'Ошибка сохранения данных'), 'error');
            return false;
        }
    },

    calculateGlobalStreak() {
        const trackers = this.getTrackers();
        if (trackers.length === 0) return 0;
        
        // Собираем все дни, когда была активность
        const activeDays = new Set();
        
        trackers.forEach(tracker => {
            if (tracker.checkedDays && tracker.checkedDays.length > 0) {
                // Используем дату последнего обновления трекера
                const lastActive = new Date(tracker.updatedAt);
                activeDays.add(lastActive.toDateString());
            }
        });
        
        if (activeDays.size === 0) return 0;
        
        // Проверяем сегодняшний день
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        // Если сегодня нет активности, но вчера есть - streak = 0 (прервалась)
        // Если сегодня нет и вчера нет - streak = 0
        if (!activeDays.has(today)) {
            return 0;
        }
        
        // Считаем streak от сегодня назад
        let streak = 1; // Сегодняшний день
        let checkDate = new Date();
        
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const dateStr = checkDate.toDateString();
            
            if (activeDays.has(dateStr)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    },
    
    saveTracker(tracker) {
        const trackers = this.getTrackers();
        const safeTracker = this.normalizeTracker(tracker);
        const existingIndex = trackers.findIndex(t => t.id === safeTracker.id);
        
        if (existingIndex >= 0) {
            safeTracker.createdAt = trackers[existingIndex].createdAt || safeTracker.createdAt;
            safeTracker.updatedAt = new Date().toISOString();
            trackers[existingIndex] = safeTracker;
        } else {
            safeTracker.createdAt = safeTracker.createdAt || new Date().toISOString();
            safeTracker.updatedAt = new Date().toISOString();
            trackers.unshift(safeTracker);
        }
        
        return this.saveTrackers(trackers);
    },
    
    deleteTracker(trackerId) {
        const safeId = Utils.sanitizeTrackerId(trackerId);
        const trackers = this.getTrackers();
        const filteredTrackers = trackers.filter(t => t.id !== safeId);
        return this.saveTrackers(filteredTrackers);
    },
    
    getTracker(trackerId) {
        const safeId = Utils.sanitizeTrackerId(trackerId);
        const trackers = this.getTrackers();
        return trackers.find(t => t.id === safeId) || null;
    },
    
    updateTrackerDays(trackerId, checkedDays) {
        const tracker = this.getTracker(trackerId);
        if (!tracker) return false;
        
        tracker.checkedDays = checkedDays;
        tracker.updatedAt = new Date().toISOString();
        tracker.progress = Math.round((checkedDays.length / 30) * 100);
        
        return this.saveTracker(tracker);
    }
};

const TrackerGenerator = {
    generateTrackerHTML(data, forPDF = false) {
        const color = CONFIG.colorMap[data.color] || CONFIG.colorMap.blue;
        const colorName = I18n.currentLang === 'en' ? color.name_en : color.name;
        const checkedDays = data.checkedDays || [];
        const progress = data.progress || 0;

        if (forPDF) {
            return this.generatePDFHTML(data, color, checkedDays, progress);
        }
        
        return this.generateSiteHTML(data, color, checkedDays, progress);
    },

    generatePDFHTML(data, color, checkedDays, progress) {
        const note = Utils.sanitizeHtml(data.note || '');
        let daysGrid = '';
        for (let day = 1; day <= 30; day++) {
            const isChecked = checkedDays.includes(day);
            const cellBorderColor = isChecked ? color.hex : '#e5e7eb';
            const checkBoxBorderColor = isChecked ? color.hex : '#d1d5db';
            const checkBoxBgColor = isChecked ? color.hex : 'transparent';
            
            daysGrid += `
                <div class="pdf-day-cell" style="border-color: ${cellBorderColor} !important; text-align: center !important;">
                    <div style="font-size: 12px !important; font-weight: 600 !important; color: #6b7280 !important; margin-bottom: 8px !important;">
                        ${I18n.t('day')} ${day}
                    </div>
                    <div class="pdf-check-box" style="border-color: ${checkBoxBorderColor} !important; background-color: ${checkBoxBgColor} !important;">
                        ${isChecked ? 
                            '<svg style="width: 16px !important; height: 16px !important; color: white !important;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' 
                            : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="pdf-template">
                <div style="border-bottom: 3px solid ${color.hex} !important; padding-bottom: 16px !important; margin-bottom: 24px !important; text-align: center !important;">
                    <h1 style="font-size: 24px !important; font-weight: 700 !important; margin-bottom: 8px !important; color: ${color.hex} !important; word-break: break-word !important;">
                        ${Utils.sanitizeHtml(data.name)}
                    </h1>
                    <p style="color: #4b5563 !important; font-size: 16px !important; word-wrap: break-word !important;">
                        ${this.getCategoryName(data.category)}
                    </p>
                    <p style="color: #6b7280 !important; font-size: 14px !important; margin-top: 4px !important;">
                        ${I18n.t('progress')}: ${progress}%
                    </p>
                </div>
                
                <div style="background-color: ${color.hex}15 !important; padding: 16px !important; border-radius: 0.5rem !important; margin-bottom: 24px !important;">
                    <h2 style="font-size: 18px !important; font-weight: 600 !important; margin-bottom: 8px !important; color: ${color.hex} !important;">
                        ${I18n.t('goal_title')}
                    </h2>
                    <p style="color: #374151 !important; line-height: 1.5 !important; font-size: 14px !important; word-wrap: break-word !important; width: 100% !important; box-sizing: border-box !important; text-align: left !important; margin: 0 !important; padding: 0 !important;">
                        ${Utils.sanitizeHtml(data.goal)}
                    </p>
                </div>
                ${note ? `
                <div style="background-color: #f8fafc !important; padding: 16px !important; border-radius: 0.5rem !important; margin-bottom: 24px !important; border: 1px solid #e5e7eb !important;">
                    <h2 style="font-size: 18px !important; font-weight: 600 !important; margin-bottom: 8px !important; color: #334155 !important;">
                        ${I18n.t('note_title')}
                    </h2>
                    <p style="color: #475569 !important; line-height: 1.5 !important; font-size: 14px !important; word-wrap: break-word !important; text-align: left !important; margin: 0 !important;">
                        ${note}
                    </p>
                </div>
                ` : ''}
                
                <div class="pdf-calendar-grid">
                    ${daysGrid}
                </div>
                
                <div style="text-align: center !important; color: #6b7280 !important; font-size: 12px !important; margin-top: 24px !important; padding-top: 16px !important; border-top: 1px solid #e5e7eb !important;">
                    <p style="margin-bottom: 4px !important;">
                        ${I18n.t('mark_each_day')}
                    </p>
                    <div class="treckers-footer" style="display: flex !important; justify-content: space-evenly !important; align-items: center !important;">
                        <p>
                            ${I18n.t('created')}: ${Utils.formatDate(data.createdAt)}
                        </p>
                        <p>
                            ${I18n.t('updated')}: ${Utils.formatDate(data.updatedAt)}
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    generateSiteHTML(data, color, checkedDays, progress) {
        const note = Utils.sanitizeHtml(data.note || '');
        let daysGrid = '';
        for (let day = 1; day <= 30; day++) {
            const isChecked = checkedDays.includes(day);
            const cellBorderColor = isChecked ? color.hex : '#e5e7eb';
            const checkBoxBorderColor = isChecked ? color.hex : '#d1d5db';
            const checkBoxBgColor = isChecked ? color.hex : 'transparent';
            const iconDisplay = isChecked ? 'block' : 'none';
            
            daysGrid += `
                <div class="day-cell border-2 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-700" 
                    data-day="${day}" 
                    data-tracker-id="${data.id}"
                    style="min-height: 5rem; border-radius: 0.5rem; padding: 0.5rem; text-align: center; border-color: ${cellBorderColor};">
                    <div class="text-xs font-semibold text-gray-500 mb-2 dark:text-gray-400">
                        ${I18n.t('day')} ${day}
                    </div>
                    <div class="check-box w-10 h-10 mx-auto border-2 rounded-lg flex items-center justify-center" 
                        style="border-color: ${checkBoxBorderColor}; background-color: ${checkBoxBgColor}; border-radius: 0.5rem;">
                        <i class="fas fa-check text-white text-sm" style="display: ${iconDisplay};"></i>
                    </div>
                </div>
            `;
        }

        return `
            <div class="tracker-container p-4 sm:p-6 md:p-8 dark:bg-gray-800" id="tracker-${data.id}" style="max-width: 100%; margin: 0 auto; font-family: -apple-system, sans-serif;">
                <div class="trecker-header mb-4 sm:mb-6 text-center" style="border-bottom: 3px solid ${color.hex}; padding-bottom: 0.75rem sm:1rem;">
                    <div class="flex justify-between items-center mb-2">
                        <h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-left flex-1 break-all overflow-hidden" 
                            style="color: ${color.hex}; word-break: break-word !important;">
                            ${Utils.sanitizeHtml(data.name)}
                        </h1>
                        <div class="flex gap-2">
                            <button onclick="App.startEditingTracker('${data.id}')" class="text-gray-500 hover:text-blue-600 p-2 dark:text-gray-400 dark:hover:text-blue-400" title="${I18n.t('edit')}">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button onclick="App.shareTracker('${data.id}')" class="text-gray-500 hover:text-green-600 p-2 dark:text-gray-400 dark:hover:text-green-400" title="${I18n.t('share')}">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button onclick="App.deleteTrackerPrompt('${data.id}')" class="text-gray-500 hover:text-red-600 p-2 dark:text-gray-400 dark:hover:text-red-400" title="${I18n.t('delete')}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-gray-600 text-sm sm:text-base dark:text-gray-400">${this.getCategoryName(data.category)}</p>
                        <p class="text-gray-500 text-sm dark:text-gray-400">
                            ${I18n.t('progress')}: <span class="font-bold">${progress}%</span>
                        </p>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="progress-bar bg-gray-200 dark:bg-gray-700">
                        <div class="progress-fill" style="width: ${progress}%; background-color: ${color.hex};"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-400">
                        <span>${checkedDays.length} ${I18n.t('of')} 30 ${I18n.t('days')}</span>
                        <span>${progress}%</span>
                    </div>
                </div>
                
                <div class="goal-section mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg" style="background-color: ${color.hex}15;">
                    <h2 class="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3" style="color: ${color.hex};">
                        ${I18n.t('goal_title')}
                    </h2>
                    <p class="text-gray-700 text-sm sm:text-base whitespace-pre-wrap dark:text-gray-300" style="text-align: left !important; word-wrap: break-word !important; margin: 0 !important; padding: 0 !important;">${Utils.sanitizeHtml(data.goal)}</p>
                </div>
                ${note ? `
                <div class="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600">
                    <h2 class="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-gray-700 dark:text-gray-200">
                        ${I18n.t('note_title')}
                    </h2>
                    <p class="text-gray-700 text-sm sm:text-base whitespace-pre-wrap dark:text-gray-300" style="text-align: left !important; word-wrap: break-word !important; margin: 0 !important; padding: 0 !important;">${note}</p>
                </div>
                ` : ''}
                
                <div class="calendar-grid">
                    ${daysGrid}
                </div>
                
                <div class="tracker-footer mt-4 sm:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 text-xs sm:text-sm dark:text-gray-400">
                    <p class="mb-2">${I18n.t('mark_each_day')}</p>
                    <div class="flex justify-between gap-3">
                        <p>${I18n.t('created')}: ${Utils.formatDate(data.createdAt)}</p>
                        <p>${I18n.t('updated')}: ${Utils.formatDate(data.updatedAt)}</p>
                    </div>
                </div>
            </div>
        `;
    },

    getCategoryName(category) {
        const categoryNames = {
            health: I18n.t('category_health'),
            sport: I18n.t('category_sport'),
            learning: I18n.t('category_learning'),
            growth: I18n.t('category_growth'),
            productivity: I18n.t('category_productivity'),
            mindfulness: I18n.t('category_mindfulness'),
            psychology: I18n.t('category_psychology'),
            other: I18n.t('category_other')
        };
        return categoryNames[category] || I18n.t('category_other');
    },

    generateTrackerListItem(tracker) {
        const color = CONFIG.colorMap[tracker.color] || CONFIG.colorMap.blue;
        const checkedDays = tracker.checkedDays || [];
        const progress = tracker.progress || 0;
        const daysCompleted = checkedDays.length;
        
        return `
            <div class="tracker-list-item bg-white rounded-xl shadow-md p-4 md:p-6 cursor-pointer hover:shadow-lg dark:bg-gray-800 dark:hover:shadow-gray-900" 
                    onclick="App.openTracker('${tracker.id}')"
                    data-tracker-id="${tracker.id}">
                <div class="flex items-start justify-between gap-2 mb-3">
                    <div class="flex items-center min-w-0 flex-1">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style="background-color: ${color.hex}20;">
                            <i class="fas fa-chart-line" style="color: ${color.hex};"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-semibold text-gray-900 text-sm md:text-base truncate dark:text-white">${Utils.sanitizeHtml(tracker.name)}</h3>
                            <p class="text-gray-500 text-xs dark:text-gray-400">${this.getCategoryName(tracker.category)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button onclick="event.stopPropagation(); App.deleteTrackerPrompt('${tracker.id}')" 
                                class="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-400" title="${I18n.t('delete')}">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                        <button onclick="event.stopPropagation(); App.startEditingTracker('${tracker.id}')" 
                                class="text-gray-400 hover:text-blue-600 p-1 dark:text-gray-500 dark:hover:text-blue-400" title="${I18n.t('edit')}">
                            <i class="fas fa-pen text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="progress-bar bg-gray-200 dark:bg-gray-700">
                        <div class="progress-fill" style="width: ${progress}%; background-color: ${color.hex};"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-400">
                        <span>${daysCompleted} ${I18n.t('of')} 30 ${I18n.t('days')}</span>
                        <span>${progress}%</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center">
                        <i class="far fa-calendar mr-1"></i>
                        <span>${Utils.formatDate(tracker.createdAt)}</span>
                    </div>
                    <button onclick="event.stopPropagation(); App.shareTracker('${tracker.id}')" 
                            class="text-blue-600 hover:text-blue-700 flex items-center dark:text-blue-400 dark:hover:text-blue-300">
                        <i class="fas fa-share-alt mr-1"></i>
                        <span>${I18n.t('share')}</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderPreview(trackerData) {
        const preview = document.getElementById('pdf-preview');
        if (!preview) return;
        
        preview.innerHTML = this.generateTrackerHTML(trackerData, false);
        preview.classList.add('fade-in');
        
        preview.dataset.trackerData = JSON.stringify(trackerData);
        preview.dataset.trackerId = trackerData.id;
        
        document.getElementById('preview-actions').classList.remove('hidden');
        this.attachDayClickHandlers(trackerData.id, trackerData.color);
    },

    attachDayClickHandlers(trackerId, colorName) {
        const color = CONFIG.colorMap[colorName] || CONFIG.colorMap.blue;
        const preview = document.getElementById('pdf-preview');
        
        if (!preview) return;
        
        preview.querySelectorAll('.day-cell[data-tracker-id="' + trackerId + '"]').forEach(cell => {
            cell.addEventListener('click', function() {
                const day = parseInt(this.getAttribute('data-day'));
                const checkBox = this.querySelector('.check-box');
                const icon = checkBox.querySelector('.fa-check');
                
                const trackerDataStr = preview.dataset.trackerData;
                if (!trackerDataStr) return;
                
                const trackerData = JSON.parse(trackerDataStr);
                const checkedDays = trackerData.checkedDays || [];
                
                if (checkedDays.includes(day)) {
                    const index = checkedDays.indexOf(day);
                    checkedDays.splice(index, 1);
                    checkBox.style.backgroundColor = 'transparent';
                    checkBox.style.borderColor = '#d1d5db';
                    if (icon) icon.style.display = 'none';
                    this.style.borderColor = '#e5e7eb';
                } else {
                    checkedDays.push(day);
                    checkedDays.sort((a, b) => a - b);
                    checkBox.style.backgroundColor = color.hex;
                    checkBox.style.borderColor = color.hex;
                    if (icon) icon.style.display = 'block';
                    this.style.borderColor = color.hex;
                }
                
                trackerData.checkedDays = checkedDays;
                trackerData.progress = Math.round((checkedDays.length / 30) * 100);
                preview.dataset.trackerData = JSON.stringify(trackerData);
                
                const progressFill = preview.querySelector('.progress-fill');
                const progressText = preview.querySelectorAll('.text-xs.text-gray-500 span');
                
                if (progressFill) progressFill.style.width = trackerData.progress + '%';
                if (progressText.length >= 2) {
                    progressText[0].textContent = `${checkedDays.length} ${I18n.t('of')} 30 ${I18n.t('days')}`;
                    progressText[1].textContent = `${trackerData.progress}%`;
                }

                const headerProgress = preview.querySelector('.trecker-header .text-gray-500 .font-bold');
                if (headerProgress) {
                    headerProgress.textContent = `${trackerData.progress}%`;
                }

                const updatedDateElement = preview.querySelector('.footer .flex.justify-between p:nth-child(2)');
                if (updatedDateElement) {
                    updatedDateElement.textContent = `${I18n.t('updated')}: ${Utils.formatDate(new Date().toISOString())}`;
                }
                
                TrackerStorage.updateTrackerDays(trackerId, checkedDays);
                App.loadTrackers();
                App.updateStatistics();
                
            });
        });
    },

    async generatePDF(trackerData) {
        try {
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: absolute !important;
                left: -9999px !important;
                top: 0 !important;
                width: 794px !important;
                height: 1123px !important;
                background: white !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
            `;
            
            tempContainer.innerHTML = this.generateTrackerHTML(trackerData, true);
            document.body.appendChild(tempContainer);
            
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                width: 794,
                height: 1123,
                onclone: function(clonedDoc) {
                    clonedDoc.body.style.background = '#ffffff';
                    clonedDoc.body.style.backgroundColor = '#ffffff';
                }
            });
            
            document.body.removeChild(tempContainer);
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 297, 'F');
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const xPos = (210 - imgWidth) / 2;
            const yPos = 10;
            
            doc.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight);
            
            const safeFileName = trackerData.name
                .replace(/[^\w\sа-яА-ЯёЁ-]/gi, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);
            
            const fileName = I18n.currentLang === 'en' 
                ? `Tracker_${safeFileName || 'challenge'}.pdf`
                : `Трекер_${safeFileName || 'челлендж'}.pdf`;
            
            doc.save(fileName);
            
            Utils.showNotification(I18n.t('notification_pdf_downloaded'));
            return true;
        } catch {
            Utils.showNotification(I18n.t('error_pdf_generation'), 'error');
            return false;
        }
    }
};

const App = {
    currentTrackerId: null,
    trackerToDelete: null,
    editingTrackerId: null,
    
    init() {
        I18n.init();
        ThemeManager.init();
        this.initMobileMenu();
        this.initForm();
        this.setFormMode(false);
        this.initColorPicker();
        this.initColorToggle();
        this.initEventListeners();
        this.loadTrackers();
        this.checkUrlHash();
        this.initModals();
        this.initScrollToTopButton();

        // Инициализация менеджера данных
        if (typeof DataManager !== 'undefined') {
            DataManager.init();
        }

        if (typeof ChartManager !== 'undefined') {
            ChartManager.init();
        }
    },
    
    initMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.toggle('hidden');
                menuBtn.classList.toggle('bg-gray-100');
            });
            
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    menuBtn.classList.remove('bg-gray-100');
                }
            });
            
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    menuBtn.classList.remove('bg-gray-100');
                });
            });
        }
    },
    
    initForm() {
        const form = document.getElementById('tracker-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                const errorEl = document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.classList.add('hidden');
                input.classList.remove('border-red-500');
            });
        });
    },
    
    initColorPicker() {
        document.querySelectorAll('input[name="color"]').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            
            if (input.checked) {
                this.updateColorSelection(input);
            }
            
            input.addEventListener('change', (e) => {
                this.updateColorSelection(e.target);
            });
        });
    },

    initColorToggle() {
        const toggleBtn = document.getElementById('color-expand-btn');
        const extraColors = document.getElementById('extra-colors');
        
        if (toggleBtn && extraColors) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Переключаем классы
                extraColors.classList.toggle('hidden');
                toggleBtn.classList.toggle('active');
                
                // Обновляем title для доступности
                const isExpanded = !extraColors.classList.contains('hidden');
                toggleBtn.setAttribute('aria-expanded', isExpanded);
                
                // Меняем title в зависимости от языка
                if (I18n && I18n.currentLang) {
                    const title = isExpanded 
                        ? (I18n.currentLang === 'ru' ? 'Меньше цветов' : 'Fewer colors')
                        : (I18n.currentLang === 'ru' ? 'Больше цветов' : 'More colors');
                    toggleBtn.setAttribute('title', title);
                    toggleBtn.setAttribute('data-title-ru', isExpanded ? 'Меньше цветов' : 'Больше цветов');
                    toggleBtn.setAttribute('data-title-en', isExpanded ? 'Fewer colors' : 'More colors');
                }
            });
        }
    },
    
    updateColorSelection(selectedInput) {
        document.querySelectorAll('input[name="color"]').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (input === selectedInput) {
                label.classList.remove('border-transparent');
                label.classList.add('border-gray-900', 'dark:border-white', 'ring-2', 'ring-gray-400', 'ring-offset-2');
                label.style.transform = 'scale(1.1)';
            } else {
                label.classList.remove('border-gray-900', 'dark:border-white', 'ring-2', 'ring-gray-400', 'ring-offset-2');
                label.classList.add('border-transparent');
                label.style.transform = 'scale(1)';
            }
        });
    },

    // Метод для скрытой кнопки скролла:
    initScrollToTopButton() {
        const scrollBtn = document.getElementById('scroll-to-top-btn');
        const footer = document.querySelector('footer');
        
        if (!scrollBtn || !footer) return;
        
        // Обработчик клика
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Отслеживание прокрутки с throttle для производительности
        let ticking = false;
        const handleScroll = () => {
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Кнопка видна, когда верхняя граница футера входит в видимую область
            const shouldBeVisible = footerRect.top < windowHeight;
            
            if (shouldBeVisible) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(handleScroll);
                ticking = true;
            }
        });
    },
    
    initEventListeners() {
        const downloadBtn = document.getElementById('download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                const preview = document.getElementById('pdf-preview');
                const trackerDataStr = preview?.dataset.trackerData;
                
                if (!trackerDataStr) {
                    Utils.showNotification(I18n.t('error_create_first'), 'error');
                    return;
                }
                
                try {
                    const trackerData = JSON.parse(trackerDataStr);
                    
                    // Сохраняем оригинальный текст
                    const originalText = downloadBtn.querySelector('span[data-translate]').textContent;
                    
                    downloadBtn.disabled = true;
                    downloadBtn.querySelector('span[data-translate]').textContent = I18n.t('preview_generate_pdf');
                    
                    await TrackerGenerator.generatePDF(trackerData);
                    
                    downloadBtn.disabled = false;
                    downloadBtn.querySelector('span[data-translate]').textContent = originalText;
                } catch {
                    downloadBtn.disabled = false;
                    downloadBtn.querySelector('span[data-translate]').textContent = I18n.t('preview_download_pdf');
                }
            });
        }
        
        const copyLinkBtn = document.getElementById('copy-tracker-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                const preview = document.getElementById('pdf-preview');
                const trackerId = preview?.dataset.trackerId;
                
                if (!trackerId) {
                    Utils.showNotification(I18n.t('error_create_first'), 'error');
                    return;
                }
                
                const url = Utils.getTrackerUrl(trackerId);
                Utils.copyToClipboard(url).then(success => {
                    if (success) Utils.showNotification(I18n.t('notification_link_copied'));
                });
            });
        }
        
        const saveBtn = document.getElementById('save-changes-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const preview = document.getElementById('pdf-preview');
                const trackerDataStr = preview?.dataset.trackerData;
                
                if (!trackerDataStr) return;
                
                const trackerData = JSON.parse(trackerDataStr);
                TrackerStorage.saveTracker(trackerData);
                Utils.showNotification(I18n.t('notification_changes_saved'));
            });
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.resetFormToCreateMode();
            });
        }
    },
    
    initModals() {
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (this.trackerToDelete) {
                    this.deleteTracker(this.trackerToDelete);
                    this.trackerToDelete = null;
                }
                closeModal('delete-tracker-modal');
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('[id$="-modal"]').forEach(modal => {
                    if (!modal.classList.contains('hidden')) closeModal(modal.id);
                });
            }
        });
    },
    
    validateField(field) {
        const value = field.value.trim();
        let error = null;
        
        switch(field.name || field.id) {
            case 'challenge-name':
                if (!value || value.length < 3) error = I18n.t('error_name_min');
                break;
            case 'category':
                if (!value) error = I18n.t('error_category_required');
                break;
            case 'goal':
                if (!value || value.length < 10) error = I18n.t('error_goal_min');
                break;
            case 'note':
                if (value.length > 1000) error = I18n.t('error_note_max');
                break;
        }
        
        const errorEl = document.getElementById(`${field.id}-error`);
        if (error) {
            field.classList.add('border-red-500');
            if (errorEl) {
                errorEl.textContent = error;
                errorEl.classList.remove('hidden');
            }
        } else {
            field.classList.remove('border-red-500');
            if (errorEl) errorEl.classList.add('hidden');
        }
    },
    
    handleFormSubmit() {
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        const formData = {
            name: Utils.sanitizeText(document.getElementById('challenge-name').value, 100),
            category: document.getElementById('category').value,
            goal: Utils.sanitizeText(document.getElementById('goal').value, 500),
            note: Utils.sanitizeText(document.getElementById('note').value, 1000),
            color: document.querySelector('input[name="color"]:checked')?.value || 'blue'
        };
        
        let hasError = false;
        ['challenge-name', 'category', 'goal', 'note'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            this.validateField(field);
            const errorEl = document.getElementById(`${fieldId}-error`);
            if (errorEl && !errorEl.classList.contains('hidden')) hasError = true;
        });
        
        if (hasError) {
            Utils.showNotification(I18n.t('error_fill_fields'), 'error');
            return;
        }
        
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        
        const existingTracker = this.editingTrackerId ? TrackerStorage.getTracker(this.editingTrackerId) : null;
        const newTracker = existingTracker
            ? {
                ...existingTracker,
                ...formData,
                id: existingTracker.id,
                checkedDays: existingTracker.checkedDays || [],
                progress: existingTracker.progress || 0,
                createdAt: existingTracker.createdAt,
                updatedAt: new Date().toISOString()
            }
            : {
                id: Utils.generateId(),
                ...formData,
                checkedDays: [],
                progress: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        
        const saved = TrackerStorage.saveTracker(newTracker);
        
        if (saved) {
            TrackerGenerator.renderPreview(newTracker);
            this.loadTrackers();
            
            setTimeout(() => {
                const preview = document.getElementById('preview-heading');
                if (preview) preview.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            Utils.showNotification(
                this.editingTrackerId
                    ? I18n.t('notification_tracker_updated')
                    : I18n.t('notification_tracker_created')
            );
        }
        
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        
        if (saved) {
            if (this.editingTrackerId) {
                this.resetFormToCreateMode();
            } else {
                document.getElementById('tracker-form').reset();
                const defaultColor = document.querySelector('input[name="color"][value="blue"]');
                if (defaultColor) {
                    defaultColor.checked = true;
                    this.updateColorSelection(defaultColor);
                }
            }
        }
    },

    startEditingTracker(trackerId) {
        const tracker = TrackerStorage.getTracker(trackerId);
        if (!tracker) {
            Utils.showNotification(I18n.t('error_tracker_not_found'), 'error');
            return;
        }

        this.editingTrackerId = trackerId;
        const form = document.getElementById('tracker-form');
        if (!form) return;

        document.getElementById('challenge-name').value = tracker.name || '';
        document.getElementById('category').value = tracker.category || '';
        document.getElementById('goal').value = tracker.goal || '';
        document.getElementById('note').value = tracker.note || '';

        const selectedColor = document.querySelector(`input[name="color"][value="${tracker.color}"]`);
        if (selectedColor) {
            selectedColor.checked = true;
            this.updateColorSelection(selectedColor);
        }

        this.setFormMode(true);

        const formSection = document.getElementById('form-heading');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setFormMode(isEditMode) {
        const submitBtn = document.getElementById('submit-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (!submitBtn || !cancelEditBtn) return;

        const submitLabel = submitBtn.querySelector('[data-translate]');
        if (submitLabel) {
            submitLabel.textContent = isEditMode
                ? I18n.t('form_submit_update')
                : I18n.t('form_submit');
        }

        cancelEditBtn.classList.toggle('hidden', !isEditMode);
    },

    resetFormToCreateMode() {
        this.editingTrackerId = null;
        const form = document.getElementById('tracker-form');
        if (form) form.reset();

        const defaultColor = document.querySelector('input[name="color"][value="blue"]');
        if (defaultColor) {
            defaultColor.checked = true;
            this.updateColorSelection(defaultColor);
        }

        ['challenge-name', 'category', 'goal', 'note'].forEach(fieldId => {
            const errorEl = document.getElementById(`${fieldId}-error`);
            const field = document.getElementById(fieldId);
            if (errorEl) errorEl.classList.add('hidden');
            if (field) field.classList.remove('border-red-500');
        });

        this.setFormMode(false);
    },
    
    loadTrackers() {
        const trackers = TrackerStorage.getTrackers();
        const container = document.getElementById('trackers-list-container');
        const emptyState = document.getElementById('empty-trackers-state');
        const statisticsContainer = document.getElementById('statistics-container');
        
        if (!container || !emptyState) return;
        
        const grid = container.querySelector('.grid');
        if (grid) grid.innerHTML = '';
        
        if (trackers.length === 0) {
            emptyState.classList.remove('hidden');
            if (statisticsContainer) statisticsContainer.classList.add('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        if (statisticsContainer) statisticsContainer.classList.remove('hidden');
        
        trackers.forEach(tracker => {
            if (grid) grid.insertAdjacentHTML('beforeend', TrackerGenerator.generateTrackerListItem(tracker));
        });
        
        this.updateStatistics();
    },
    
    updateStatistics() {
        const trackers = TrackerStorage.getTrackers();
        
        // Существующие показатели
        let completedDays = 0;
        let activeTrackers = 0;
        
        // Новые показатели
        const categoryStats = {
            health: 0,
            sport: 0,
            learning: 0,
            growth: 0,
            productivity: 0,
            mindfulness: 0,
            psychology: 0,
            other: 0
        };
        const categoryActiveTrackers = {
            health: 0,
            sport: 0,
            learning: 0,
            growth: 0,
            productivity: 0,
            mindfulness: 0,
            psychology: 0,
            other: 0
        };
        
        const weekdayActivity = Array(7).fill(0); // Активность по дням недели (Пн..Вс)
        
        trackers.forEach(tracker => {
            const days = tracker.checkedDays || [];
            
            // Существующие расчеты
            completedDays += days.length;
            if (days.length > 0) activeTrackers++;
            
            // Любимая категория: считаем по фактической активности (отмеченным дням)
            const safeCategory = Object.prototype.hasOwnProperty.call(categoryStats, tracker.category)
                ? tracker.category
                : 'other';
            categoryStats[safeCategory] += days.length;
            if (days.length > 0) categoryActiveTrackers[safeCategory]++;
            
            // Активность по дням недели на основе реальных дат челленджа
            days.forEach(day => {
                const startDate = new Date(tracker.createdAt || Date.now());
                const activityDate = new Date(startDate);
                activityDate.setDate(startDate.getDate() + (day - 1));

                // JS: 0=Вс ... 6=Сб -> переводим в Пн=0 ... Вс=6
                const jsWeekday = activityDate.getDay();
                const weekdayIndex = (jsWeekday + 6) % 7;
                weekdayActivity[weekdayIndex]++;
            });
        });
        
        // 1. Средний прогресс - среднее только по активным трекерам (где есть отмеченные дни)
        const activeProgressTrackers = trackers.filter(t => (t.checkedDays || []).length > 0);
        const averageProgress = activeProgressTrackers.length > 0
            ? Math.round(
                activeProgressTrackers.reduce((sum, t) => sum + (t.progress || 0), 0) /
                activeProgressTrackers.length
            )
            : 0;
        
        // 2. Общий прогресс - процент отмеченных дней от всех возможных дней
        const totalPossibleDays = trackers.length * 30;
        const completionRate = totalPossibleDays > 0 
            ? Math.round((completedDays / totalPossibleDays) * 100) 
            : 0;
        
        // Самый продуктивный день недели
        const maxDayActivity = Math.max(...weekdayActivity);
        const bestWeekdayIndex = weekdayActivity.indexOf(maxDayActivity);
        
        // Любимая категория
        let favoriteCategory = 'other';
        let maxCategoryScore = 0;
        let maxActiveTrackersInCategory = 0;
        for (const [category, score] of Object.entries(categoryStats)) {
            const activeInCategory = categoryActiveTrackers[category] || 0;
            if (
                score > maxCategoryScore ||
                (score === maxCategoryScore && activeInCategory > maxActiveTrackersInCategory)
            ) {
                maxCategoryScore = score;
                maxActiveTrackersInCategory = activeInCategory;
                favoriteCategory = category;
            }
        }
        
        // Название любимой категории
        const categoryNames = {
            health: I18n.t('category_health'),
            sport: I18n.t('category_sport'),
            learning: I18n.t('category_learning'),
            growth: I18n.t('category_growth'),
            productivity: I18n.t('category_productivity'),
            mindfulness: I18n.t('category_mindfulness'),
            psychology: I18n.t('category_psychology'),
            other: I18n.t('category_other')
        };
        const favoriteCategoryName = categoryNames[favoriteCategory] || I18n.t('category_other');
        
        // Streak
        const streak = typeof TrackerStorage.calculateGlobalStreak === 'function' 
            ? TrackerStorage.calculateGlobalStreak() 
            : 0;
        
        // Обновляем существующие элементы
        const totalTrackersEl = document.getElementById('total-trackers');
        const activeTrackersEl = document.getElementById('active-trackers');
        const completedDaysEl = document.getElementById('completed-days');
        const averageProgressEl = document.getElementById('average-progress');
        const streakEl = document.getElementById('streak-days');
        
        if (totalTrackersEl) totalTrackersEl.textContent = trackers.length;
        if (activeTrackersEl) activeTrackersEl.textContent = activeTrackers;
        if (completedDaysEl) completedDaysEl.textContent = completedDays;
        if (averageProgressEl) averageProgressEl.textContent = averageProgress + '%';
        if (streakEl) streakEl.textContent = streak;
        
        // Обновляем новые элементы
        const completionRateEl = document.getElementById('completion-rate');
        const bestDayEl = document.getElementById('best-day');
        const favoriteCategoryEl = document.getElementById('favorite-category');
        
        if (completionRateEl) completionRateEl.textContent = completionRate + '%';
        
        if (bestDayEl) {
            if (maxDayActivity > 0) {
                const weekdaysFull = [
                    I18n.t('weekday_monday', 'Понедельник'),
                    I18n.t('weekday_tuesday', 'Вторник'),
                    I18n.t('weekday_wednesday', 'Среда'),
                    I18n.t('weekday_thursday', 'Четверг'),
                    I18n.t('weekday_friday', 'Пятница'),
                    I18n.t('weekday_saturday', 'Суббота'),
                    I18n.t('weekday_sunday', 'Воскресенье')
                ];
                
                const weekdaysShort = [
                    I18n.t('weekday_short_mon', 'Пн'),
                    I18n.t('weekday_short_tue', 'Вт'),
                    I18n.t('weekday_short_wed', 'Ср'),
                    I18n.t('weekday_short_thu', 'Чт'),
                    I18n.t('weekday_short_fri', 'Пт'),
                    I18n.t('weekday_short_sat', 'Сб'),
                    I18n.t('weekday_short_sun', 'Вс')
                ];
                
                const dayOfWeek = weekdaysFull[bestWeekdayIndex];
                const dayOfWeekShort = weekdaysShort[bestWeekdayIndex];
                
                bestDayEl.innerHTML = `<span class="hidden sm:inline">${dayOfWeek}</span>
                                    <span class="sm:hidden">${dayOfWeekShort}</span>`;
            } else {
                bestDayEl.textContent = '—';
            }
        }
        
        if (favoriteCategoryEl) {
            favoriteCategoryEl.textContent = maxCategoryScore > 0 
                ? favoriteCategoryName 
                : '—';
        }
        
        // Обновляем графики
        if (typeof ChartManager !== 'undefined') {
            ChartManager.updateCharts();
        }
    },
    
    openTracker(trackerId) {
        const tracker = TrackerStorage.getTracker(trackerId);
        if (!tracker) {
            Utils.showNotification(I18n.t('error_tracker_not_found'), 'error');
            return;
        }
        
        TrackerGenerator.renderPreview(tracker);
        
        const preview = document.getElementById('preview-heading');
        if (preview) preview.scrollIntoView({ behavior: 'smooth' });
        
        this.setActiveTracker(trackerId);
    },
    
    setActiveTracker(trackerId) {
        document.querySelectorAll('.tracker-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.tracker-list-item[data-tracker-id="${trackerId}"]`);
        if (activeItem) activeItem.classList.add('active');
    },
    
    deleteTrackerPrompt(trackerId) {
        const tracker = TrackerStorage.getTracker(trackerId);
        if (!tracker) return;
        
        this.trackerToDelete = trackerId;
        
        const messageEl = document.getElementById('delete-tracker-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="mb-2">${I18n.t('modal_delete_description')}</div>
                <div class="font-semibold text-gray-900 break-words max-w-full overflow-hidden dark:text-white">
                    "${Utils.sanitizeHtml(tracker.name)}"
                </div>
            `;
        }
        
        openModal('delete-tracker-modal');
    },
    
    deleteTracker(trackerId) {
        const success = TrackerStorage.deleteTracker(trackerId);
        
        if (success) {
            const trackerElement = document.querySelector(`.tracker-list-item[data-tracker-id="${trackerId}"]`);
            if (trackerElement) trackerElement.remove();
            
            const preview = document.getElementById('pdf-preview');
            const currentTrackerId = preview?.dataset.trackerId;
            
            if (currentTrackerId === trackerId) {
                preview.innerHTML = `
                    <p class="text-gray-400 text-lg sm:text-xl text-center px-4 dark:text-gray-500">
                        <i class="fas fa-magic text-gray-300 text-2xl mb-2 block dark:text-gray-600"></i>
                        <span>${I18n.t('preview_empty')}</span>
                    </p>
                `;
                preview.dataset.trackerData = '';
                preview.dataset.trackerId = '';
                document.getElementById('preview-actions').classList.add('hidden');
            }
            
            this.updateStatistics();
            
            const trackers = TrackerStorage.getTrackers();
            const emptyState = document.getElementById('empty-trackers-state');
            const statisticsContainer = document.getElementById('statistics-container');
            
            if (trackers.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                if (statisticsContainer) statisticsContainer.classList.add('hidden');
            }
            
            Utils.showNotification(I18n.t('notification_tracker_deleted'));
            if (this.editingTrackerId === trackerId) {
                this.resetFormToCreateMode();
            }
        } else {
            Utils.showNotification(I18n.t('error_deleting_tracker'), 'error');
        }
    },
    
    shareTracker(trackerId) {
        const tracker = TrackerStorage.getTracker(trackerId);
        if (!tracker) {
            Utils.showNotification(I18n.t('error_tracker_not_found'), 'error');
            return;
        }
        
        const url = Utils.getTrackerUrl(trackerId);
        const shareUrlEl = document.getElementById('tracker-share-url');
        const openLinkEl = document.getElementById('open-tracker-link');
        
        if (shareUrlEl) shareUrlEl.textContent = url;
        if (openLinkEl) openLinkEl.href = url;
        
        openModal('share-tracker-modal');
    },
    
    checkUrlHash() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#tracker-')) {
            const trackerId = hash.replace('#tracker-', '');
            const tracker = TrackerStorage.getTracker(trackerId);
            
            if (tracker) {
                setTimeout(() => this.openTracker(trackerId), 500);
            }
        }
    },
    
    updateDynamicContent() {
        this.loadTrackers();
        
        const preview = document.getElementById('pdf-preview');
        const trackerDataStr = preview?.dataset.trackerData;
        
        if (trackerDataStr) {
            const trackerData = JSON.parse(trackerDataStr);
            TrackerGenerator.renderPreview(trackerData);
        }

        this.setFormMode(Boolean(this.editingTrackerId));
    }
};

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function copyCardNumber() {
    Utils.copyToClipboard("2202 2055 7513 3944").then(success => {
        if (success) Utils.showNotification(I18n.t('notification_card_copied'));
    });
}

function copyShareUrl() {
    const shareUrlEl = document.getElementById('tracker-share-url');
    if (!shareUrlEl) return;
    
    Utils.copyToClipboard(shareUrlEl.textContent).then(success => {
        if (success) Utils.showNotification(I18n.t('notification_link_copied'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.copyCardNumber = copyCardNumber;
    window.copyShareUrl = copyShareUrl;
    window.I18n = I18n;
    window.App = App;
});

window.addEventListener('hashchange', () => {
    App.checkUrlHash();
});