const I18n = {
    currentLang: 'ru',
    translations: {
        ru: {
            app_name: "30-Дневный Трекер",
            language: "Язык",

            nav_create_tracker: "Создать трекер",
            nav_my_trackers: "Мои трекеры",
            nav_preview: "Превью",
            install_button: "Установить",

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
            form_note_label: "Заметка к трекеру",
            form_color_label: "Цвет трекера",
            form_submit: "Создать мой трекер!",
            form_submit_update: "Сохранить изменения",
            form_cancel_edit: "Отменить редактирование",
            form_loading: "Создание...",

            category_health: "❤️Здоровье",
            category_sport: "💪Спорт",
            category_learning: "📚Обучение",
            category_growth: "📈Рост",
            category_productivity: "⚡Продуктивность",
            category_mindfulness: "🧘Осознанность",
            category_psychology: "🧠Психология",
            category_other: "✨Другое",

            preview_title: "Предпросмотр трекера",
            preview_empty: "Твой трекер появится здесь после создания",
            preview_download_pdf: "Скачать PDF",
            preview_generate_pdf: "Генерация...",
            preview_copy_link: "Копировать ссылку",
            preview_save_changes: "Сохранить изменения",

            footer_title: "30-Дневный Челлендж Трекер",
            footer_description: "Инструмент для формирования полезных привычек и достижения целей",
            footer_about: "О проекте",
            footer_privacy: "Политика конфиденциальности",
            footer_contact: "Связаться",
            footer_support: "Поддержать проект",
            footer_copyright: "© 2026 30-Дневный Челлендж Трекер. Все права защищены.",
            footer_disclaimer: "Инструмент для личного использования. Все данные хранятся локально.",

            footer_export: "Экспорт",
            footer_import: "Импорт",
            notification_export_success: "Данные экспортированы",
            notification_export_error: "Ошибка экспорта",
            notification_import_success: "Данные импортированы",
            notification_import_error: "Ошибка импорта",
            confirm_import_title: "Подтверждение импорта",
            current_trackers_will_be_replaced: "текущих трекеров будут заменены",
            new_trackers_will_be_imported: "новых трекеров будут импортированы",
            modal_import: "Импортировать",

            empty_state_import: "Импортировать данные",
            empty_state_hint: "Поддерживается формат JSON",
            import_data_title: "Импорт данных",
            drag_drop_text: "Перетащите файл сюда или кликните для выбора",
            supported_format: "Поддерживается формат JSON",

            invalid_file_format: "Неверный формат файла. Ожидается JSON.",
            file_too_large: "Файл слишком большой",
            import_cancelled: "Импорт отменен",

            notification_no_data_to_export: "Нет данных для экспорта. Сначала создайте трекеры.",
            notification_export_success: "Данные экспортированы",

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
            notification_tracker_updated: "Трекер обновлен!",
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
            error_note_max: "Максимум 1000 символов",

            day: "День",
            progress: "Прогресс",
            goal_title: "Моя цель на 30 дней:",
            note_title: "Заметка",
            mark_each_day: "Отмечай каждый день, когда выполнил свою цель!",
            created: "Создан",
            updated: "Обновлен",
            share: "Поделиться",
            delete: "Удалить",
            edit: "Редактировать",
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
            install_button: "Install",

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
            form_note_label: "Tracker Note",
            form_color_label: "Tracker Color",
            form_submit: "Create My Tracker!",
            form_submit_update: "Save Changes",
            form_cancel_edit: "Cancel Editing",
            form_loading: "Creating...",

            category_health: "❤️Health",
            category_sport: "💪Sport",
            category_learning: "📚Learning",
            category_growth: "📈Growth",
            category_productivity: "⚡Productivity",
            category_mindfulness: "🧘Mindfulness",
            category_psychology: "🧠Psychology",
            category_other: "✨Other",

            preview_title: "Tracker Preview",
            preview_empty: "Your tracker will appear here after creation",
            preview_download_pdf: "Download PDF",
            preview_generate_pdf: "Generating...",
            preview_copy_link: "Copy Link",
            preview_save_changes: "Save Changes",

            footer_title: "30-Day Challenge Tracker",
            footer_description: "Tool for building useful habits and achieving goals",
            footer_about: "About Project",
            footer_privacy: "Privacy Policy",
            footer_contact: "Contact",
            footer_support: "Support Project",
            footer_copyright: "© 2026 30-Day Challenge Tracker. All rights reserved.",
            footer_disclaimer: "Tool for personal use. All data is stored locally.",
            
            footer_export: "Export",
            footer_import: "Import",
            notification_export_success: "Data exported",
            notification_export_error: "Export error",
            notification_import_success: "Data imported",
            notification_import_error: "Import error",
            confirm_import_title: "Confirm Import",
            current_trackers_will_be_replaced: "current trackers will be replaced",
            new_trackers_will_be_imported: "new trackers will be imported",
            modal_import: "Import",

            empty_state_import: "Import Data",
            empty_state_hint: "JSON format supported",
            import_data_title: "Import Data",
            drag_drop_text: "Drag & drop file here or click to select",
            supported_format: "JSON format supported",

            invalid_file_format: "Invalid file format. JSON expected.",
            file_too_large: "File too large",
            import_cancelled: "Import cancelled",

            notification_no_data_to_export: "No data to export. Create trackers first.",
            notification_export_success: "Data exported",

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
            notification_tracker_updated: "Tracker updated!",
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
            error_note_max: "Maximum 1000 characters",

            day: "Day",
            progress: "Progress",
            goal_title: "My 30-Day Goal:",
            note_title: "Note",
            mark_each_day: "Mark each day when you complete your goal!",
            created: "Created",
            updated: "Updated",
            share: "Share",
            delete: "Delete",
            edit: "Edit",
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
        
        // Обновить manifest при смене языка
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            const newManifest = lang === 'ru' ? '/manifest/manifest-ru.json' : '/manifest/manifest-en.json';
            if (!manifestLink.href.endsWith(newManifest)) {
                manifestLink.href = newManifest;
            }
        }
        
        document.documentElement.lang = lang;
        document.querySelector('body').setAttribute('data-lang', lang);
        
        this.translateStaticContent();
        this.updateLanguageSwitcher(lang);
        this.updatePlaceholders();
        this.updateTitles();
        this.updateValidationErrors();
        this.updateButtonText('download-pdf-btn', 'preview_download_pdf');
        
        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.updateThemeText();
        }
        
        if (typeof App !== 'undefined') {
            App.updateDynamicContent();
        }
    },

    updateButtonText(buttonId, translationKey) {
        const button = document.getElementById(buttonId);
        if (button) {
            const textSpan = button.querySelector('span[data-translate]');
            if (textSpan) {
                textSpan.textContent = this.t(translationKey);
            }
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
        const noteInput = document.getElementById('note');
        
        if (nameInput) {
            const placeholderKey = 'data-placeholder-' + this.currentLang;
            nameInput.placeholder = nameInput.getAttribute(placeholderKey) || '';
        }
        
        if (goalInput) {
            const placeholderKey = 'data-placeholder-' + this.currentLang;
            goalInput.placeholder = goalInput.getAttribute(placeholderKey) || '';
        }

        if (noteInput) {
            const placeholderKey = 'data-placeholder-' + this.currentLang;
            noteInput.placeholder = noteInput.getAttribute(placeholderKey) || '';
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
            'goal': (value) => value && value.length >= 10 ? null : this.t('error_goal_min'),
            'note': (value) => value.length <= 1000 ? null : this.t('error_note_max')
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