// data-manager.js
const DataManager = {
    // Экспорт данных - без подтверждения, только уведомление
    exportData() {
        try {
            const trackers = TrackerStorage.getTrackers();

            // Проверяем, есть ли данные для экспорта
            if (!trackers || trackers.length === 0) {
                Utils.showNotification(
                    I18n.t('notification_no_data_to_export') || 'Нет данных для экспорта', 
                    'warning'
                );
                return false;
            }
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                appName: '30-Day Tracker',
                trackersCount: trackers.length,
                trackers: trackers
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const date = new Date();
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `30daytrack_backup_${dateStr}_${timeStr}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            Utils.showNotification(I18n.t('notification_export_success'), 'success');
            return true;
        } catch (error) {
            console.error('Export error:', error);
            Utils.showNotification(I18n.t('notification_export_error'), 'error');
            return false;
        }
    },
    
    // Импорт данных из файла
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    let trackers = [];
                    if (jsonData.trackers && Array.isArray(jsonData.trackers)) {
                        trackers = jsonData.trackers;
                    } else if (Array.isArray(jsonData)) {
                        trackers = jsonData;
                    } else {
                        throw new Error('Invalid format');
                    }
                    
                    const validTrackers = trackers
                        .filter(t => t.id && t.name && t.category && t.goal && Array.isArray(t.checkedDays))
                        .map(t => ({
                            ...t,
                            note: typeof t.note === 'string' ? t.note : ''
                        }));
                    
                    if (validTrackers.length === 0) {
                        throw new Error('No valid trackers');
                    }
                    
                    resolve(validTrackers);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    },
    
    // Проверяем, есть ли существующие данные и нужно ли подтверждение
    async handleImport(file) {
        try {
            const importedTrackers = await this.importData(file);
            const currentTrackers = TrackerStorage.getTrackers();
            
            // Подтверждение нужно ТОЛЬКО если есть существующие трекеры
            if (currentTrackers.length > 0) {
                const confirmed = await this.showSimpleConfirm(
                    importedTrackers.length,
                    currentTrackers.length
                );
                
                if (!confirmed) return false;
            }
            
            // Сохраняем данные
            const success = TrackerStorage.saveTrackers(importedTrackers);
            
            if (success) {
                Utils.showNotification(
                    `${I18n.t('notification_import_success')} (${importedTrackers.length})`, 
                    'success'
                );
                
                // Обновляем интерфейс
                if (typeof App !== 'undefined') {
                    App.loadTrackers();
                    App.updateStatistics();
                    
                    const preview = document.getElementById('pdf-preview');
                    if (preview) {
                        preview.innerHTML = `
                            <p class="text-gray-400 text-center text-lg sm:text-xl px-4 dark:text-gray-500">
                                <i class="fas fa-magic text-gray-300 text-2xl mb-2 block dark:text-gray-600"></i>
                                <span>${I18n.t('preview_empty')}</span>
                            </p>
                        `;
                        preview.dataset.trackerData = '';
                        preview.dataset.trackerId = '';
                        document.getElementById('preview-actions')?.classList.add('hidden');
                    }
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Import error:', error);
            Utils.showNotification(I18n.t('notification_import_error'), 'error');
            return false;
        }
    },
    
    // Простое подтверждение
    showSimpleConfirm(newCount, currentCount) {
        return new Promise((resolve) => {
            // Функция для правильного склонения слова "трекер" в русском языке
            const getTrackerWord = (count) => {
                if (I18n.currentLang === 'ru') {
                    const lastDigit = count % 10;
                    const lastTwoDigits = count % 100;
                    
                    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
                        return 'трекеров';
                    }
                    if (lastDigit === 1) {
                        return 'трекер';
                    }
                    if (lastDigit >= 2 && lastDigit <= 4) {
                        return 'трекера';
                    }
                    return 'трекеров';
                } else {
                    // В английском просто добавляем 's' для множественного числа
                    return count === 1 ? 'tracker' : 'trackers';
                }
            };
            
            const currentWord = getTrackerWord(currentCount);
            const newWord = getTrackerWord(newCount);
            
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4';
            dialog.innerHTML = `
                <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-gray-800">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900/30">
                            <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            ${I18n.t('confirm_import_title')}
                        </h3>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4 mb-4 dark:bg-gray-700">
                        <p class="text-gray-700 mb-2 dark:text-gray-300">
                            <i class="fas fa-database mr-2 text-gray-500"></i>
                            <span class="font-medium">${currentCount} ${currentWord}</span> 
                            ${I18n.currentLang === 'ru' ? 'будут заменены на' : 'will be replaced by'}
                        </p>
                        <p class="text-gray-700 dark:text-gray-300">
                            <i class="fas fa-file-import mr-2 text-blue-500"></i>
                            <span class="font-medium">${newCount} ${newWord}</span> 
                            ${I18n.currentLang === 'ru' ? 'из импортируемого файла' : 'from imported file'}
                        </p>
                    </div>
                    
                    <p class="text-sm text-gray-500 mb-4 dark:text-gray-400">
                        <i class="fas fa-info-circle mr-1"></i>
                        ${I18n.currentLang === 'ru' 
                            ? 'Это действие нельзя отменить. Рекомендуется сделать экспорт текущих данных.' 
                            : 'This action cannot be undone. It is recommended to export current data first.'}
                    </p>
                    
                    <div class="flex gap-3">
                        <button class="cancel-btn flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                            ${I18n.t('modal_cancel')}
                        </button>
                        <button class="confirm-btn flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                            ${I18n.t('modal_import')}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            const closeDialog = (result) => {
                dialog.remove();
                resolve(result);
            };
            
            dialog.querySelector('.cancel-btn').onclick = () => closeDialog(false);
            dialog.querySelector('.confirm-btn').onclick = () => closeDialog(true);
            dialog.onclick = (e) => e.target === dialog && closeDialog(false);
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeDialog(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    },
    
    // Инициализация обработчиков
    init() {
        const exportBtn = document.getElementById('export-data-btn');
        const importBtn = document.getElementById('import-data-btn');
        const importFromEmptyBtn = document.getElementById('import-from-empty-btn');
        const fileInput = document.getElementById('import-file-input');
        
        // Экспорт
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Общий обработчик для fileInput (сработает для любой кнопки)
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleImport(file);
                }
                fileInput.value = ''; // Очищаем для возможности повторного выбора
            });
        }
        
        // Кнопка импорта в футере
        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => fileInput.click());
        }
        
        // Кнопка импорта в пустом состоянии
        if (importFromEmptyBtn && fileInput) {
            importFromEmptyBtn.addEventListener('click', () => fileInput.click());
        }
    }
};