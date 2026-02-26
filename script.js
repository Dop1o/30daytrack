const CONFIG = {
    colorMap: {
        blue: { hex: '#3b82f6', name: 'Синий', name_en: 'Blue' },
        green: { hex: '#10b981', name: 'Зеленый', name_en: 'Green' },
        purple: { hex: '#8b5cf6', name: 'Фиолетовый', name_en: 'Purple' },
        orange: { hex: '#f97316', name: 'Оранжевый', name_en: 'Orange' },
        pink: { hex: '#ec4899', name: 'Розовый', name_en: 'Pink' }
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
                            color: this.getThemeColor('text'), // Будет использовать правильный цвет в зависимости от темы
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
                                        fontColor: this.getThemeColor('text') // Явно задаем цвет текста
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
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} трекеров (${percentage}%)`;
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
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Пн=0, Вс=6
        
        trackers.forEach(tracker => {
            if (tracker.checkedDays && tracker.checkedDays.length > 0) {
                // Используем дату обновления для определения дня недели
                const lastUpdate = new Date(tracker.updatedAt);
                const dayOfWeek = lastUpdate.getDay(); // 0 = Вс, 1 = Пн, ..., 6 = Сб
                
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
            learning: { count: 0, progress: 0 },
            productivity: { count: 0, progress: 0 },
            mindfulness: { count: 0, progress: 0 },
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
                I18n.t('category_learning'),
                I18n.t('category_productivity'),
                I18n.t('category_mindfulness'),
                I18n.t('category_other')
            ],
            values: Object.values(categories).map(c => c.count),
            progress: Object.values(categories).map(c => c.progress),
            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899']
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

const I18n = {
    currentLang: 'ru',
    translations: {
        ru: {
            app_name: "30-дневный трекер",
            language: "Язык",
            nav_create_tracker: "Создать трекер",
            nav_my_trackers: "Мои трекеры",
            nav_preview: "Превью",
            hero_title: "Создай свой челлендж на 30 дней",
            hero_subtitle: "Создавай трекеры, сохраняй прогресс и достигай целей",
            quick_action_create: "Создать новый трекер",
            my_trackers_title: "Мои трекеры",
            empty_state_title: "У вас еще нет трекеров",
            empty_state_description: "Создайте свой первый трекер и начните отслеживать прогресс",
            empty_state_action: "Создать первый трекер",
            statistics_title: "Статистика",
            stat_total_trackers: "Всего трекеров",
            stat_active_trackers: "Активные трекеры",
            stat_average_progress: "Средний прогресс",
            stat_completed_days: "Завершено дней",
            form_title: "Создай новый трекер",
            form_name_label: "Название твоего челленджа",
            form_category_label: "Категория",
            form_category_placeholder: "Выбери категорию",
            form_goal_label: "Моя цель на 30 дней",
            form_color_label: "Цвет трекера",
            form_submit: "Создать мой трекер!",
            form_loading: "Создание...",
            category_health: "Здоровье & Спорт",
            category_learning: "Обучение & Рост",
            category_productivity: "Продуктивность",
            category_mindfulness: "Осознанность & Психология",
            category_other: "Другое",
            preview_title: "Предпросмотр трекера",
            preview_empty: "Твой трекер появится здесь после создания",
            preview_download_pdf: "Скачать PDF",
            preview_copy_link: "Копировать ссылку",
            preview_save_changes: "Сохранить изменения",
            footer_title: "30-дневный челлендж трекер",
            footer_description: "Инструмент для формирования полезных привычек и достижения целей",
            footer_about: "О проекте",
            footer_privacy: "Политика конфиденциальности",
            footer_contact: "Связаться",
            footer_support: "Поддержать проект",
            footer_copyright: "© 2025 30-дневный челлендж трекер. Все права защищены.",
            footer_disclaimer: "Инструмент для личного использования. Все данные хранятся локально.",
            modal_ok: "Понятно",
            modal_accept: "Принимаю условия",
            modal_close: "Закрыть",
            modal_cancel: "Отмена",
            modal_delete: "Удалить",
            modal_about_title: "О проекте",
            modal_about_app_name: "30-дневный челлендж трекер",
            modal_about_description: "Простой и эффективный инструмент для формирования полезных привычек",
            modal_about_focus: "Фокус на цели",
            modal_about_focus_desc: "Помогает сфокусироваться на одной важной цели на 30 дней",
            modal_about_visual: "Визуальный прогресс",
            modal_about_visual_desc: "Красивый трекер мотивирует продолжать каждый день",
            modal_about_science: "Основано на науке",
            modal_about_science_desc: "21-30 дней достаточно для формирования новой привычки",
            modal_about_privacy: "Конфиденциальность",
            modal_about_privacy_desc: "Все данные хранятся локально в вашем браузере",
            modal_privacy_title: "Политика конфиденциальности",
            modal_privacy_storage_title: "📁 Локальное хранение",
            modal_privacy_storage_desc: "Все данные хранятся в вашем браузере. Никакая информация не отправляется на серверы.",
            modal_privacy_confidential_title: "🔒 Конфиденциальность",
            modal_privacy_confidential_desc: "Мы не собираем и не обрабатываем ваши персональные данные.",
            modal_privacy_pdf_title: "📄 Генерация PDF",
            modal_privacy_pdf_desc: "PDF файлы создаются локально и сразу сохраняются на ваше устройство.",
            modal_contact_title: "Связаться",
            modal_contact_question: "Есть вопросы?",
            modal_contact_description: "Свяжитесь удобным способом",
            modal_contact_developer: "Контакты разработчика",
            developer_name: "Исмаил",
            developer_role: "Frontend разработчик",
            modal_support_title: "Поддержать проект",
            modal_support_subtitle: "Поддержите развитие проекта",
            modal_support_description: "Ваша поддержка помогает улучшать трекер и добавлять новые функции",
            modal_support_methods: "Способы поддержки",
            support_bank_card: "Банковская карта",
            support_note: "Любая сумма помогает развитию проекта",
            modal_delete_title: "Удалить трекер",
            modal_delete_confirm: "Вы уверены?",
            modal_delete_description: "Это действие нельзя отменить. Все данные трекера будут удалены.",
            modal_share_title: "Поделиться трекером",
            modal_share_subtitle: "Ссылка на трекер",
            modal_share_description: "Сохраните эту ссылку, чтобы всегда иметь доступ к своему трекеру:",
            modal_share_copy: "Копировать",
            modal_share_open: "Открыть",
            notification_tracker_created: "Трекер успешно создан!",
            notification_progress_updated: "Прогресс обновлен!",
            notification_changes_saved: "Изменения сохранены!",
            notification_tracker_deleted: "Трекер удален",
            notification_link_copied: "Ссылка скопирована в буфер обмена!",
            notification_pdf_downloaded: "PDF успешно скачан!",
            notification_card_copied: "Номер карты скопирован",
            notification_dark_theme: "Темная тема включена",
            notification_light_theme: "Светлая тема включена",
            error_fill_fields: "Пожалуйста, заполните все поля корректно",
            error_create_first: "Сначала создайте трекер",
            error_tracker_not_found: "Трекер не найден",
            error_pdf_generation: "Не удалось создать PDF. Попробуйте сделать скриншот превью.",
            error_deleting_tracker: "Ошибка при удалении трекера",
            error_name_min: "Минимум 3 символа",
            error_category_required: "Выберите категорию",
            error_goal_min: "Минимум 10 символов",
            day: "День",
            progress: "Прогресс",
            goal_title: "Моя цель на 30 дней:",
            mark_each_day: "Отмечай каждый день, когда выполнил свою цель!",
            created: "Создан",
            updated: "Обновлен",
            share: "Поделиться",
            delete: "Удалить",
            of: "из",
            days: "дней",
            theme: "Тема",
            stat_streak_days: "Дней подряд",
            chart_progress_by_day: "Прогресс по дням",
            chart_by_category: "Трекеры по категориям",
            chart_progress_distribution: "Распределение прогресса",
            completed_days: "Выполнено дней",
            number_of_trackers: "Количество трекеров",
            chart_activity: "Активность",
            chart_heatmap_title: "Активность по дням недели",
            chart_heatmap_subtitle: "Чем темнее цвет, тем больше трекеров вы отмечали",
            chart_avg_trackers: "Среднее количество",
            chart_category_title: "Распределение по категориям",
            chart_timeline_title: "Динамика завершения трекеров",
            chart_completed: "Завершено",
            chart_active: "Активные",
            chart_trackers: "трек.",
            chart_no_categories: "Создайте трекеры в разных категориях",
            chart_no_completions: "Отмечайте прогресс, чтобы увидеть динамику",
            weekday_monday: "Понедельник",
            weekday_tuesday: "Вторник",
            weekday_wednesday: "Среда",
            weekday_thursday: "Четверг",
            weekday_friday: "Пятница",
            weekday_saturday: "Суббота",
            weekday_sunday: "Воскресенье",
            weekday_short_mon: "Пн",
            weekday_short_tue: "Вт",
            weekday_short_wed: "Ср",
            weekday_short_thu: "Чт",
            weekday_short_fri: "Пт",
            weekday_short_sat: "Сб",
            weekday_short_sun: "Вс",
            
            tooltip_one_tracker: "1 трекер",
            tooltip_trackers: "трекеров в среднем",
            tooltip_trackers_few: "трекера в среднем", 
            on_average: "в среднем",
            day_capitalized: "День",
            stat_completion_rate: "Общий прогресс",
            stat_best_day: "Лучший день",
            stat_favorite_category: "Любимая категория",
            day_one: "день",
            day_few: "дня",
            day_many: "дней",
            tracker_one: "трекер",
            tracker_few: "трекера",
            tracker_many: "трекеров"
        },
        en: {
            app_name: "30-Day Tracker",
            language: "Language",
            nav_create_tracker: "Create Tracker",
            nav_my_trackers: "My Trackers",
            nav_preview: "Preview",
            hero_title: "Create Your 30-Day Challenge",
            hero_subtitle: "Create trackers, save progress, and achieve goals",
            quick_action_create: "Create New Tracker",
            my_trackers_title: "My Trackers",
            empty_state_title: "You don't have any trackers yet",
            empty_state_description: "Create your first tracker and start tracking progress",
            empty_state_action: "Create First Tracker",
            statistics_title: "Statistics",
            stat_total_trackers: "Total Trackers",
            stat_active_trackers: "Active Trackers",
            stat_average_progress: "Average Progress",
            stat_completed_days: "Completed Days",
            form_title: "Create New Tracker",
            form_name_label: "Your Challenge Name",
            form_category_label: "Category",
            form_category_placeholder: "Choose a category",
            form_goal_label: "My 30-Day Goal",
            form_color_label: "Tracker Color",
            form_submit: "Create My Tracker!",
            form_loading: "Creating...",
            category_health: "Health & Sports",
            category_learning: "Learning & Growth",
            category_productivity: "Productivity",
            category_mindfulness: "Mindfulness & Psychology",
            category_other: "Other",
            preview_title: "Tracker Preview",
            preview_empty: "Your tracker will appear here after creation",
            preview_download_pdf: "Download PDF",
            preview_copy_link: "Copy Link",
            preview_save_changes: "Save Changes",
            footer_title: "30-Day Challenge Tracker",
            footer_description: "Tool for building useful habits and achieving goals",
            footer_about: "About Project",
            footer_privacy: "Privacy Policy",
            footer_contact: "Contact",
            footer_support: "Support Project",
            footer_copyright: "© 2025 30-Day Challenge Tracker. All rights reserved.",
            footer_disclaimer: "Tool for personal use. All data is stored locally.",
            modal_ok: "Got it",
            modal_accept: "Accept Terms",
            modal_close: "Close",
            modal_cancel: "Cancel",
            modal_delete: "Delete",
            modal_about_title: "About Project",
            modal_about_app_name: "30-Day Challenge Tracker",
            modal_about_description: "Simple and effective tool for building useful habits",
            modal_about_focus: "Focus on Goal",
            modal_about_focus_desc: "Helps focus on one important goal for 30 days",
            modal_about_visual: "Visual Progress",
            modal_about_visual_desc: "Beautiful tracker motivates to continue every day",
            modal_about_science: "Based on Science",
            modal_about_science_desc: "21-30 days is enough to form a new habit",
            modal_about_privacy: "Privacy",
            modal_about_privacy_desc: "All data is stored locally in your browser",
            modal_privacy_title: "Privacy Policy",
            modal_privacy_storage_title: "📁 Local Storage",
            modal_privacy_storage_desc: "All data is stored in your browser. No information is sent to servers.",
            modal_privacy_confidential_title: "🔒 Confidentiality",
            modal_privacy_confidential_desc: "We do not collect or process your personal data.",
            modal_privacy_pdf_title: "📄 PDF Generation",
            modal_privacy_pdf_desc: "PDF files are created locally and immediately saved to your device.",
            modal_contact_title: "Contact",
            modal_contact_question: "Have questions?",
            modal_contact_description: "Contact us in a convenient way",
            modal_contact_developer: "Developer Contacts",
            developer_name: "Ismail",
            developer_role: "Frontend Developer",
            modal_support_title: "Support Project",
            modal_support_subtitle: "Support Project Development",
            modal_support_description: "Your support helps improve the tracker and add new features",
            modal_support_methods: "Support Methods",
            support_bank_card: "Bank Card",
            support_note: "Any amount helps project development",
            modal_delete_title: "Delete Tracker",
            modal_delete_confirm: "Are you sure?",
            modal_delete_description: "This action cannot be undone. All tracker data will be deleted.",
            modal_share_title: "Share Tracker",
            modal_share_subtitle: "Tracker Link",
            modal_share_description: "Save this link to always have access to your tracker:",
            modal_share_copy: "Copy",
            modal_share_open: "Open",
            notification_tracker_created: "Tracker created successfully!",
            notification_progress_updated: "Progress updated!",
            notification_changes_saved: "Changes saved!",
            notification_tracker_deleted: "Tracker deleted",
            notification_link_copied: "Link copied to clipboard!",
            notification_pdf_downloaded: "PDF downloaded successfully!",
            notification_card_copied: "Card number copied",
            notification_dark_theme: "Dark theme enabled",
            notification_light_theme: "Light theme enabled",
            error_fill_fields: "Please fill in all fields correctly",
            error_create_first: "Create a tracker first",
            error_tracker_not_found: "Tracker not found",
            error_pdf_generation: "Failed to create PDF. Try taking a screenshot of the preview.",
            error_deleting_tracker: "Error deleting tracker",
            error_name_min: "Minimum 3 characters",
            error_category_required: "Select a category",
            error_goal_min: "Minimum 10 characters",
            day: "Day",
            progress: "Progress",
            goal_title: "My 30-Day Goal:",
            mark_each_day: "Mark each day when you complete your goal!",
            created: "Created",
            updated: "Updated",
            share: "Share",
            delete: "Delete",
            of: "of",
            days: "days",
            theme: "Theme",
            stat_streak_days: "Day streak",
            chart_progress_by_day: "Progress by Day",
            chart_by_category: "Trackers by Category",
            chart_progress_distribution: "Progress Distribution",
            completed_days: "Completed days",
            number_of_trackers: "Number of trackers",
            chart_activity: "Activity",
            chart_heatmap_title: "Activity by Day of Week",
            chart_heatmap_subtitle: "Darker color means more trackers marked",
            chart_avg_trackers: "Average count",
            chart_category_title: "Distribution by Category",
            chart_timeline_title: "Tracker Completion Dynamics",
            chart_completed: "Completed",
            chart_active: "Active",
            chart_trackers: "tr.",
            chart_no_categories: "Create trackers in different categories",
            chart_no_completions: "Mark progress to see dynamics",
            weekday_monday: "Monday",
            weekday_tuesday: "Tuesday",
            weekday_wednesday: "Wednesday",
            weekday_thursday: "Thursday",
            weekday_friday: "Friday",
            weekday_saturday: "Saturday",
            weekday_sunday: "Sunday",
            weekday_short_mon: "Mon",
            weekday_short_tue: "Tue",
            weekday_short_wed: "Wed",
            weekday_short_thu: "Thu",
            weekday_short_fri: "Fri",
            weekday_short_sat: "Sat",
            weekday_short_sun: "Sun",
            tooltip_one_tracker: "1 tracker",
            tooltip_trackers: "trackers on average",
            on_average: "on average",
            day_capitalized: "Day",
            stat_completion_rate: "Overall progress",
            stat_best_day: "Best day",
            stat_favorite_category: "Favorite category",
            day_one: "day",
            day_few: "days",
            day_many: "days",
            tracker_one: "tracker",
            tracker_few: "trackers",
            tracker_many: "trackers",
        }
    },

    init() {
        const savedLang = localStorage.getItem('tracker_language');
        const browserLang = navigator.language.startsWith('en') ? 'en' : 'ru';
        this.currentLang = savedLang || browserLang;
        
        this.setLanguage(this.currentLang);
        this.initLanguageSwitcher();
    },

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        
        this.currentLang = lang;
        localStorage.setItem('tracker_language', lang);
        
        document.documentElement.lang = lang;
        document.querySelector('body').setAttribute('data-lang', lang);
        
        this.translateStaticContent();
        this.updateLanguageSwitcher(lang);
        this.updatePlaceholders();
        this.updateTitles();
        this.updateValidationErrors();
        
        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.updateThemeText();
        }
        
        if (typeof App !== 'undefined') {
            App.updateDynamicContent();
        }
    },

    translateStaticContent() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (this.translations[this.currentLang][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    const placeholderKey = element.getAttribute('data-placeholder-' + this.currentLang);
                    if (placeholderKey) element.placeholder = placeholderKey;
                } else {
                    element.textContent = this.translations[this.currentLang][key];
                }
            }
        });
        
        document.querySelectorAll('[data-title-ru], [data-title-en]').forEach(element => {
            const titleKey = 'data-title-' + this.currentLang;
            if (element.hasAttribute(titleKey)) {
                element.title = element.getAttribute(titleKey);
            }
        });
    },

    updatePlaceholders() {
        const nameInput = document.getElementById('challenge-name');
        const goalInput = document.getElementById('goal');
        
        if (nameInput) {
            const placeholderKey = 'data-placeholder-' + this.currentLang;
            nameInput.placeholder = nameInput.getAttribute(placeholderKey) || '';
        }
        
        if (goalInput) {
            const placeholderKey = 'data-placeholder-' + this.currentLang;
            goalInput.placeholder = goalInput.getAttribute(placeholderKey) || '';
        }
    },

    updateTitles() {
        const titleMap = {
            ru: "30-Дневный Челлендж Трекер — Создай и Отслеживай Свои Привычки",
            en: "30-Day Challenge Tracker — Create and Track Your Habits"
        };
        document.title = titleMap[this.currentLang] || titleMap.ru;
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            const descriptionMap = {
                ru: "Создавайте и отслеживайте свои 30-дневные челленджи. Сохраняйте прогресс, получайте статистику и достигайте целей.",
                en: "Create and track your 30-day challenges. Save progress, get statistics, and achieve goals."
            };
            metaDescription.content = descriptionMap[this.currentLang] || descriptionMap.ru;
        }
    },

    updateValidationErrors() {
        const fieldValidations = {
            'challenge-name': (value) => value && value.length >= 3 ? null : this.t('error_name_min'),
            'category': (value) => value ? null : this.t('error_category_required'),
            'goal': (value) => value && value.length >= 10 ? null : this.t('error_goal_min')
        };
        
        Object.keys(fieldValidations).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorEl = document.getElementById(`${fieldId}-error`);
            
            if (field && errorEl && !errorEl.classList.contains('hidden')) {
                const error = fieldValidations[fieldId](field.value.trim());
                if (error) {
                    errorEl.textContent = error;
                } else {
                    errorEl.classList.add('hidden');
                    field.classList.remove('border-red-500');
                }
            }
        });
    },

    initLanguageSwitcher() {
        const toggle = document.getElementById('language-toggle');
        const dropdown = document.getElementById('language-dropdown');
        
        if (toggle && dropdown) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
                toggle.classList.toggle('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
                    dropdown.classList.remove('active');
                    toggle.classList.remove('active');
                }
            });
            
            dropdown.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', () => {
                    dropdown.classList.remove('active');
                    toggle.classList.remove('active');
                });
            });
        }
        
        this.updateLanguageSwitcher(this.currentLang);
    },

    updateLanguageSwitcher(lang) {
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-lang') === lang);
        });
        
        const toggle = document.getElementById('language-toggle');
        if (toggle) {
            const langText = toggle.querySelector('#current-lang-text');
            if (langText) langText.textContent = lang === 'ru' ? 'RU' : 'US';
        }
        
        document.querySelectorAll('[data-lang]').forEach(btn => {
            const isActive = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('bg-blue-50', isActive);
            btn.classList.toggle('text-blue-600', isActive);
            btn.classList.toggle('text-gray-600', !isActive);
        });
    },

    t(key, defaultText = '') {
        return this.translations[this.currentLang][key] || defaultText || key;
    },

    formatDate(date) {
        const locales = { ru: 'ru-RU', en: 'en-US' };
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(date).toLocaleDateString(locales[this.currentLang] || 'ru-RU', options);
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
    getTrackers() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },
    
    saveTrackers(trackers) {
        try {
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
        const existingIndex = trackers.findIndex(t => t.id === tracker.id);
        
        if (existingIndex >= 0) {
            trackers[existingIndex] = tracker;
        } else {
            tracker.createdAt = tracker.createdAt || new Date().toISOString();
            tracker.updatedAt = new Date().toISOString();
            trackers.unshift(tracker);
        }
        
        return this.saveTrackers(trackers);
    },
    
    deleteTracker(trackerId) {
        const trackers = this.getTrackers();
        const filteredTrackers = trackers.filter(t => t.id !== trackerId);
        return this.saveTrackers(filteredTrackers);
    },
    
    getTracker(trackerId) {
        const trackers = this.getTrackers();
        return trackers.find(t => t.id === trackerId) || null;
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
        let daysGrid = '';
        for (let day = 1; day <= 30; day++) {
            const isChecked = checkedDays.includes(day);
            const cellBorderColor = isChecked ? color.hex : '#e5e7eb';
            const checkBoxBorderColor = isChecked ? color.hex : '#d1d5db';
            const checkBoxBgColor = isChecked ? color.hex : 'transparent';
            
            daysGrid += `
                <div class="pdf-day-cell" style="border-color: ${cellBorderColor} !important;">
                    <div style="font-size: 11px !important; font-weight: 600 !important; color: #6b7280 !important; margin-bottom: 4px !important;">
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
                
                <div class="pdf-calendar-grid">
                    ${daysGrid}
                </div>
                
                <div style="text-align: center !important; color: #6b7280 !important; font-size: 12px !important; margin-top: 24px !important; padding-top: 16px !important; border-top: 1px solid #e5e7eb !important;">
                    <p style="margin-bottom: 4px !important;">
                        ${I18n.t('mark_each_day')}
                    </p>
                    <p>
                        ${I18n.t('created')}: ${Utils.formatDate(data.createdAt)} • ${I18n.t('updated')}: ${Utils.formatDate(data.updatedAt)}
                    </p>
                </div>
            </div>
        `;
    },

    generateSiteHTML(data, color, checkedDays, progress) {
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
                <div class="header mb-4 sm:mb-6 text-center" style="border-bottom: 3px solid ${color.hex}; padding-bottom: 0.75rem sm:1rem;">
                    <div class="flex justify-between items-center mb-2">
                        <h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-left flex-1 break-all overflow-hidden" 
                            style="color: ${color.hex}; word-break: break-word !important;">
                            ${Utils.sanitizeHtml(data.name)}
                        </h1>
                        <div class="flex gap-2">
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
                
                <div class="calendar-grid">
                    ${daysGrid}
                </div>
                
                <div class="footer mt-4 sm:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 text-xs sm:text-sm dark:text-gray-400">
                    <p class="mb-2">${I18n.t('mark_each_day')}</p>
                    <div class="flex justify-between">
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
            learning: I18n.t('category_learning'),
            productivity: I18n.t('category_productivity'),
            mindfulness: I18n.t('category_mindfulness'),
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
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style="background-color: ${color.hex}20;">
                            <i class="fas fa-chart-line" style="color: ${color.hex};"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 text-sm md:text-base truncate max-w-[200px] dark:text-white">${Utils.sanitizeHtml(tracker.name)}</h3>
                            <p class="text-gray-500 text-xs dark:text-gray-400">${this.getCategoryName(tracker.category)}</p>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); App.deleteTrackerPrompt('${tracker.id}')" 
                            class="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-400" title="${I18n.t('delete')}">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
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

                const headerProgress = preview.querySelector('.header .text-gray-500 .font-bold');
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
                Utils.showNotification(I18n.t('notification_progress_updated'));
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
    
    init() {
        I18n.init();
        ThemeManager.init();
        this.initMobileMenu();
        this.initForm();
        this.initColorPicker();
        this.initEventListeners();
        this.loadTrackers();
        this.checkUrlHash();
        this.initModals();

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
                    downloadBtn.disabled = true;
                    downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${I18n.t('generating', 'Генерация...')}`;
                    
                    await TrackerGenerator.generatePDF(trackerData);
                    
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = `<i class="fas fa-download mr-2"></i>${I18n.t('preview_download_pdf')}`;
                } catch {
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = `<i class="fas fa-download mr-2"></i>${I18n.t('preview_download_pdf')}`;
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
            color: document.querySelector('input[name="color"]:checked')?.value || 'blue'
        };
        
        let hasError = false;
        ['challenge-name', 'category', 'goal'].forEach(fieldId => {
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
        
        const newTracker = {
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
            
            Utils.showNotification(I18n.t('notification_tracker_created'));
        }
        
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        
        if (saved) {
            document.getElementById('tracker-form').reset();
            const defaultColor = document.querySelector('input[name="color"][value="blue"]');
            if (defaultColor) {
                defaultColor.checked = true;
                this.updateColorSelection(defaultColor);
            }
        }
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
        let totalProgress = 0;
        let totalPossibleDays = 0; // Для расчета общего процента
        
        // Новые показатели
        const categoryCount = {
            health: 0,
            learning: 0,
            productivity: 0,
            mindfulness: 0,
            other: 0
        };
        
        const dayActivity = Array(30).fill(0); // Активность по дням месяца
        
        trackers.forEach(tracker => {
            const days = tracker.checkedDays || [];
            const progress = tracker.progress || 0;
            
            // Существующие расчеты
            completedDays += days.length;
            totalProgress += progress;
            if (days.length > 0) activeTrackers++;
            totalPossibleDays += 30; // Каждый трекер может иметь до 30 дней
            
            // Подсчет по категориям
            if (categoryCount.hasOwnProperty(tracker.category)) {
                categoryCount[tracker.category]++;
            } else {
                categoryCount.other++;
            }
            
            // Активность по дням месяца
            days.forEach(day => {
                dayActivity[day - 1]++;
            });
        });
        
        // Средний прогресс
        const averageProgress = trackers.length > 0 ? Math.round(totalProgress / trackers.length) : 0;
        
        // Общий процент завершения (от всех возможных дней)
        const totalCompletedDays = completedDays;
        const completionRate = totalPossibleDays > 0 
            ? Math.round((totalCompletedDays / totalPossibleDays) * 100) 
            : 0;
        
        // Самый продуктивный день месяца
        const maxDayActivity = Math.max(...dayActivity);
        const bestDayIndex = dayActivity.indexOf(maxDayActivity) + 1;
        
        // Любимая категория
        let favoriteCategory = 'other';
        let maxCategoryCount = 0;
        for (const [category, count] of Object.entries(categoryCount)) {
            if (count > maxCategoryCount) {
                maxCategoryCount = count;
                favoriteCategory = category;
            }
        }
        
        // Название любимой категории
        const categoryNames = {
            health: I18n.t('category_health'),
            learning: I18n.t('category_learning'),
            productivity: I18n.t('category_productivity'),
            mindfulness: I18n.t('category_mindfulness'),
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
        
        // Обновляем новые элементы (только 3)
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
                
                const dayOfWeekIndex = (bestDayIndex - 1) % 7;
                const dayOfWeek = weekdaysFull[dayOfWeekIndex];
                const dayOfWeekShort = weekdaysShort[dayOfWeekIndex];
                
                bestDayEl.innerHTML = `<span class="hidden sm:inline">${dayOfWeek}</span>
                                    <span class="sm:hidden">${dayOfWeekShort}</span>`;
            } else {
                bestDayEl.textContent = '—';
            }
        }
        
        if (favoriteCategoryEl) {
            favoriteCategoryEl.textContent = maxCategoryCount > 0 
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
    
    // Закрытие модальных окон при клике на фон (оверлей)
    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.addEventListener('click', function(e) {
            // Важно! Проверяем, что кликнули именно на сам модальный контейнер (оверлей)
            // А не на его дочерние элементы
            if (e.target === this) {
                closeModal(this.id);
            }
        });
        
        // Находим контейнер с содержимым модального окна
        const modalContent = modal.querySelector('.modal-responsive, .bg-white');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation(); // Останавливаем всплытие события
            });
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('[id$="-modal"]').forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    closeModal(modal.id);
                }
            });
        }
    });
    
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