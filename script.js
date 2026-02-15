const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// БЛОКУВАННЯ ДО ЗАВЕРШЕННЯ ОНБОРДИНГУ
let isOnboardingComplete = false;

let userData = {
    age: null,
    height: null,
    weight: null,
    goal: null,
    activity: null,
    bmr: 0,
    tdee: 0,
    targetCalories: 0
};

let currentData = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
    },
    goals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 65
    },
    history: []
};

function nextStep(stepId) {
    if (stepId === 'step-goal') {
        const age = document.getElementById('userAge').value;
        const height = document.getElementById('userHeight').value;
        const weight = document.getElementById('userWeight').value;
        
        if (!age || !height || !weight) {
            alert('Будь ласка, заповни всі поля!');
            return;
        }
        
        userData.age = parseInt(age);
        userData.height = parseInt(height);
        userData.weight = parseInt(weight);
    }
    
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    document.getElementById(stepId).classList.add('active');
}

function selectGoal(goal) {
    userData.goal = goal;
    
    document.querySelectorAll('.goal-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.goal-card').classList.add('selected');
    
    setTimeout(() => {
        nextStep('step-activity');
    }, 300);
}

function selectActivity(activityLevel) {
    userData.activity = activityLevel;
    
    document.querySelectorAll('.activity-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.activity-card').classList.add('selected');
    
    setTimeout(() => {
        calculateCalories();
        finishOnboarding();
    }, 300);
}

function calculateCalories() {
    const bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
    userData.bmr = Math.round(bmr);
    
    const tdee = bmr * userData.activity;
    userData.tdee = Math.round(tdee);
    
    let targetCalories = tdee;
    
    if (userData.goal === 'loss') {
        targetCalories -= 500;
    } else if (userData.goal === 'gain') {
        targetCalories += 500;
    }
    
    userData.targetCalories = Math.round(targetCalories);
    
    const proteinGrams = Math.round(userData.weight * 2);
    const fatsGrams = Math.round((targetCalories * 0.25) / 9);
    const carbsGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4);
    
    currentData.goals = {
        calories: userData.targetCalories,
        protein: proteinGrams,
        carbs: carbsGrams,
        fats: fatsGrams
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('calorieTrackerData', JSON.stringify(currentData));
}

function finishOnboarding() {
    isOnboardingComplete = true;
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'block';
    document.body.style.background = 'var(--bg-secondary)';
    
    loadData();
    updateUI();
}

function checkOnboarding() {
    const saved = localStorage.getItem('userData');
    
    if (saved) {
        userData = JSON.parse(saved);
        isOnboardingComplete = true;
        document.getElementById('onboarding').style.display = 'none';
        document.getElementById('navbar').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'block';
        document.body.style.background = 'var(--bg-secondary)';
        return true;
    }
    
    isOnboardingComplete = false;
    return false;
}

function checkAccess() {
    if (!isOnboardingComplete) {
        alert('❌ Спочатку завершіть налаштування профілю!');
        return false;
    }
    return true;
}

function loadData() {
    const saved = localStorage.getItem('calorieTrackerData');
    if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        const savedDate = data.lastUpdate ? new Date(data.lastUpdate).toDateString() : null;
        
        if (savedDate === today) {
            currentData = data;
        } else {
            if (data.calories > 0) {
                if (!currentData.history) currentData.history = [];
                currentData.history.push({
                    date: data.lastUpdate,
                    calories: data.calories,
                    protein: data.protein,
                    carbs: data.carbs,
                    fats: data.fats,
                    meals: JSON.parse(JSON.stringify(data.meals))
                });
            }
            currentData.goals = data.goals;
            currentData.history = data.history || [];
            resetDailyData();
        }
    }
}

function saveData() {
    currentData.lastUpdate = new Date().toISOString();
    localStorage.setItem('calorieTrackerData', JSON.stringify(currentData));
}

function resetDailyData() {
    currentData.calories = 0;
    currentData.protein = 0;
    currentData.carbs = 0;
    currentData.fats = 0;
    currentData.meals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
    };
}

function updateUI() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('caloriesConsumed').textContent = Math.round(currentData.calories);
    document.getElementById('caloriesGoal').textContent = currentData.goals.calories;
    
    const calorieProgress = (currentData.calories / currentData.goals.calories) * 100;
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (Math.min(calorieProgress, 100) / 100) * circumference;
    document.getElementById('calorieRing').style.strokeDashoffset = offset;
    
    document.getElementById('proteinValue').textContent = Math.round(currentData.protein);
    document.getElementById('proteinGoal').textContent = currentData.goals.protein;
    document.getElementById('carbsValue').textContent = Math.round(currentData.carbs);
    document.getElementById('carbsGoal').textContent = currentData.goals.carbs;
    document.getElementById('fatsValue').textContent = Math.round(currentData.fats);
    document.getElementById('fatsGoal').textContent = currentData.goals.fats;
    
    document.getElementById('proteinBar').style.width = 
        Math.min((currentData.protein / currentData.goals.protein) * 100, 100) + '%';
    document.getElementById('carbsBar').style.width = 
        Math.min((currentData.carbs / currentData.goals.carbs) * 100, 100) + '%';
    document.getElementById('fatsBar').style.width = 
        Math.min((currentData.fats / currentData.goals.fats) * 100, 100) + '%';
    
    updateMealDisplay('breakfast');
    updateMealDisplay('lunch');
    updateMealDisplay('dinner');
    updateMealDisplay('snacks');
    
    saveData();
}

function updateMealDisplay(mealType) {
    const container = document.getElementById(`${mealType}Items`);
    const meals = currentData.meals[mealType];
    
    if (meals.length === 0) {
        container.innerHTML = '<div class="empty-meal">Додайте страву</div>';
        document.getElementById(`${mealType}Calories`).textContent = '0 ккал';
        return;
    }
    
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    document.getElementById(`${mealType}Calories`).textContent = Math.round(totalCalories) + ' ккал';
    
    container.innerHTML = meals.map((meal, index) => `
        <div class="food-item">
            <div class="food-emoji">${meal.emoji || '🍽️'}</div>
            <div class="food-info">
                <div class="food-name">${meal.name}</div>
                <div class="food-macros">
                    Б: ${Math.round(meal.protein)}г | В: ${Math.round(meal.carbs)}г | Ж: ${Math.round(meal.fats)}г
                </div>
            </div>
            <div class="food-calories">${Math.round(meal.calories)} ккал</div>
            <button class="food-delete" onclick="deleteFoodItem('${mealType}', ${index})">×</button>
        </div>
    `).join('');
}

function deleteFoodItem(mealType, index) {
    const meal = currentData.meals[mealType][index];
    currentData.calories -= meal.calories;
    currentData.protein -= meal.protein;
    currentData.carbs -= meal.carbs;
    currentData.fats -= meal.fats;
    
    currentData.meals[mealType].splice(index, 1);
    updateUI();
}

function addFoodItem(mealType, foodData) {
    currentData.meals[mealType].push(foodData);
    currentData.calories += foodData.calories;
    currentData.protein += foodData.protein;
    currentData.carbs += foodData.carbs;
    currentData.fats += foodData.fats;
    
    updateUI();
}

const foodEmojis = {
    'курка': '🍗', 'куряче': '🍗', 'chicken': '🍗',
    'риба': '🐟', 'рыба': '🐟', 'fish': '🐟',
    'яловичина': '🥩', 'говядина': '🥩', 'beef': '🥩',
    'свинина': '🥓', 'pork': '🥓',
    'яйце': '🥚', 'яйцо': '🥚', 'egg': '🥚',
    'салат': '🥗', 'salad': '🥗',
    'рис': '🍚', 'rice': '🍚',
    'макарони': '🍝', 'паста': '🍝', 'pasta': '🍝',
    'хліб': '🍞', 'хлеб': '🍞', 'bread': '🍞',
    'сир': '🧀', 'сыр': '🧀', 'cheese': '🧀',
    'молоко': '🥛', 'milk': '🥛',
    'йогурт': '🥛', 'yogurt': '🥛',
    'фрукти': '🍎', 'фрукты': '🍎', 'fruit': '🍎',
    'овочі': '🥦', 'овощи': '🥦', 'vegetables': '🥦',
    'горіхи': '🥜', 'орехи': '🥜', 'nuts': '🥜',
    'бургер': '🍔', 'burger': '🍔',
    'піца': '🍕', 'пицца': '🍕', 'pizza': '🍕',
    'суп': '🍲', 'soup': '🍲',
    'каша': '🥣', 'porridge': '🥣',
    'сендвіч': '🥪', 'бутерброд': '🥪', 'sandwich': '🥪',
    'десерт': '🍰', 'торт': '🍰', 'cake': '🍰',
    'морозиво': '🍦', 'мороженое': '🍦', 'ice cream': '🍦',
    'кава': '☕', 'coffee': '☕',
    'чай': '🍵', 'tea': '🍵'
};

function getFoodEmoji(foodName) {
    const lower = foodName.toLowerCase();
    for (const [key, emoji] of Object.entries(foodEmojis)) {
        if (lower.includes(key)) {
            return emoji;
        }
    }
    return '🍽️';
}

async function analyzePhoto(imageBase64) {
    const prompt = `Ти експерт з харчування. Проаналізуй це фото страви та дай точну оцінку поживної цінності.

Опиши:
- Назву страви українською мовою
- Приблизну вагу порції в грамах
- Калорії (ккал)
- Білки (г)
- Вуглеводи (г)  
- Жири (г)
- Короткий опис складу страви

Відповідай ТОЧНО у такому форматі JSON БЕЗ додаткового тексту:
{"name":"назва","calories":500,"protein":30,"carbs":50,"fats":15,"weight":300,"description":"опис"}`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            },
                            {
                                type: 'text',
                                text: prompt
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API помилка: ${response.status} - ${errorData.error?.message || 'Невідома помилка'}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        const jsonMatch = content.match(/\{[^{}]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            result.emoji = getFoodEmoji(result.name);
            return result;
        }
        
        const manualParse = {
            name: content.match(/name["']?\s*:\s*["']([^"']+)["']/i)?.[1] || 'Страва',
            calories: parseInt(content.match(/calories["']?\s*:\s*(\d+)/i)?.[1]) || 400,
            protein: parseInt(content.match(/protein["']?\s*:\s*(\d+)/i)?.[1]) || 20,
            carbs: parseInt(content.match(/carbs["']?\s*:\s*(\d+)/i)?.[1]) || 40,
            fats: parseInt(content.match(/fats["']?\s*:\s*(\d+)/i)?.[1]) || 15,
            weight: parseInt(content.match(/weight["']?\s*:\s*(\d+)/i)?.[1]) || 250,
            description: content.match(/description["']?\s*:\s*["']([^"']+)["']/i)?.[1] || 'Смачна страва'
        };
        manualParse.emoji = getFoodEmoji(manualParse.name);
        return manualParse;
        
    } catch (error) {
        console.error('Помилка аналізу:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkOnboarding()) {
        loadData();
        updateUI();
    }
    
    const svg = document.querySelector('.ring-svg');
    svg.innerHTML += `
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
            </linearGradient>
        </defs>
    `;
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const page = btn.dataset.page;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');
            
            if (page === 'stats') {
                updateStats();
            } else if (page === 'goals') {
                loadGoalsForm();
            } else if (page === 'history') {
                loadHistory();
            }
        });
    });
    
    document.getElementById('photoBtn').addEventListener('click', () => {
        if (!checkAccess()) return;
        document.getElementById('photoModal').classList.add('active');
    });
    
    document.getElementById('closePhotoModal').addEventListener('click', () => {
        document.getElementById('photoModal').classList.remove('active');
        resetPhotoModal();
    });
    
    document.getElementById('manualBtn').addEventListener('click', () => {
        if (!checkAccess()) return;
        document.getElementById('manualModal').classList.add('active');
    });
    
    document.getElementById('closeManualModal').addEventListener('click', () => {
        document.getElementById('manualModal').classList.remove('active');
        resetManualModal();
    });
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    document.getElementById('analyzeBtn').addEventListener('click', async () => {
        const btn = document.getElementById('analyzeBtn');
        const result = document.getElementById('analysisResult');
        
        btn.disabled = true;
        btn.textContent = '⏳ Аналізую...';
        result.classList.add('hidden');
        
        try {
            const imageBase64 = document.getElementById('imagePreview').src.split(',')[1];
            const optionalName = document.getElementById('optionalFoodName').value.trim();
            const optionalWeight = document.getElementById('optionalWeight').value.trim();
            
            const foodData = await analyzePhoto(imageBase64, optionalName, optionalWeight);
            
            result.innerHTML = `
                <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">
                    ${foodData.emoji} ${foodData.name}
                </h4>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">
                    ${foodData.description || ''}
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <div style="padding: 12px; background: white; border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary);">Калорії</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${Math.round(foodData.calories)}</div>
                    </div>
                    <div style="padding: 12px; background: white; border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary);">Вага</div>
                        <div style="font-size: 24px; font-weight: 700;">${foodData.weight}г</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Білки</div>
                        <div style="font-size: 16px; font-weight: 600;">${Math.round(foodData.protein)}г</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Вуглеводи</div>
                        <div style="font-size: 16px; font-weight: 600;">${Math.round(foodData.carbs)}г</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Жири</div>
                        <div style="font-size: 16px; font-weight: 600;">${Math.round(foodData.fats)}г</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <select id="mealTypeSelect" style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px;">
                        <option value="breakfast">Сніданок</option>
                        <option value="lunch">Обід</option>
                        <option value="dinner">Вечеря</option>
                        <option value="snacks">Перекус</option>
                    </select>
                    <button onclick="addAnalyzedFood()" style="padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Додати
                    </button>
                </div>
            `;
            
            result.classList.remove('hidden');
            result.dataset.foodData = JSON.stringify(foodData);
            
        } catch (error) {
            result.innerHTML = `
                <div style="color: var(--danger); text-align: center;">
                    ❌ Помилка аналізу: ${error.message}
                </div>
            `;
            result.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Проаналізувати';
        }
    });
    
    document.getElementById('addFoodBtn').addEventListener('click', () => {
        const name = document.getElementById('foodName').value;
        const calories = parseFloat(document.getElementById('foodCalories').value) || 0;
        const protein = parseFloat(document.getElementById('foodProtein').value) || 0;
        const carbs = parseFloat(document.getElementById('foodCarbs').value) || 0;
        const fats = parseFloat(document.getElementById('foodFats').value) || 0;
        const mealType = document.getElementById('mealType').value;
        
        if (!name || calories === 0) {
            alert('Заповніть назву та калорії!');
            return;
        }
        
        addFoodItem(mealType, {
            name,
            calories,
            protein,
            carbs,
            fats,
            emoji: getFoodEmoji(name)
        });
        
        document.getElementById('manualModal').classList.remove('active');
        resetManualModal();
    });
    
    document.getElementById('saveGoalsBtn').addEventListener('click', () => {
        currentData.goals.calories = parseInt(document.getElementById('goalCaloriesInput').value);
        currentData.goals.protein = parseInt(document.getElementById('goalProteinInput').value);
        currentData.goals.carbs = parseInt(document.getElementById('goalCarbsInput').value);
        currentData.goals.fats = parseInt(document.getElementById('goalFatsInput').value);
        
        updateUI();
        alert('✅ Цілі збережено!');
    });
    
    document.getElementById('generateMenuBtn').addEventListener('click', () => {
        if (!checkAccess()) return;
        generateAIMenu();
    });
});

async function generateAIMenu() {
    const btn = document.getElementById('generateMenuBtn');
    const content = document.getElementById('aiMenuContent');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>Генерую...</span>';
    
    content.innerHTML = `
        <div class="ai-menu-loading">
            <div class="loading-spinner"></div>
            <p>AI складає персональне меню...</p>
        </div>
    `;
    
    try {
        const goalTexts = {
            'loss': 'схуднення (дефіцит калорій)',
            'maintain': 'підтримку ваги',
            'gain': 'набір маси (профіцит калорій)'
        };
        
        const prompt = `Ти - професійний дієтолог. Склади денне меню для користувача.

Параметри користувача:
- Вік: ${userData.age} років
- Зріст: ${userData.height} см
- Вага: ${userData.weight} кг
- Ціль: ${goalTexts[userData.goal]}
- Денна норма: ${currentData.goals.calories} ккал
- Білки: ${currentData.goals.protein}г
- Вуглеводи: ${currentData.goals.carbs}г
- Жири: ${currentData.goals.fats}г

Склади меню з 3 прийомів їжі:
1. Сніданок (30% від денної норми)
2. Обід (40% від денної норми)
3. Вечеря (30% від денної норми)

Для кожного прийому вкажи:
- Назву страви українською
- Детальний опис (інгредієнти)
- Калорії
- Білки, вуглеводи, жири в грамах
- Вага порції

Відповідай ТІЛЬКИ у форматі JSON:
{
    "breakfast": {
        "name": "назва",
        "description": "опис інгредієнтів",
        "calories": число,
        "protein": число,
        "carbs": число,
        "fats": число,
        "weight": число
    },
    "lunch": {...},
    "dinner": {...}
}`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error('Помилка API');
        }
        
        const data = await response.json();
        const content_text = data.choices[0].message.content;
        
        const jsonMatch = content_text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Не вдалося розпарсити відповідь');
        }
        
        const menu = JSON.parse(jsonMatch[0]);
        
        displayAIMenu(menu);
        
    } catch (error) {
        console.error('Помилка генерації меню:', error);
        content.innerHTML = `
            <div class="ai-menu-placeholder">
                <div class="placeholder-icon">❌</div>
                <p>Помилка генерації меню. Спробуй ще раз!</p>
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">✨</span><span>Згенерувати</span>';
    }
}

function displayAIMenu(menu) {
    const mealIcons = {
        breakfast: '🌅',
        lunch: '☀️',
        dinner: '🌙'
    };
    
    const mealNames = {
        breakfast: 'Сніданок',
        lunch: 'Обід',
        dinner: 'Вечеря'
    };
    
    let html = '<div class="ai-menu-result">';
    
    for (const [mealType, mealData] of Object.entries(menu)) {
        html += `
            <div class="ai-meal-card">
                <div class="ai-meal-header">
                    <span class="ai-meal-icon">${mealIcons[mealType]}</span>
                    <span class="ai-meal-name">${mealNames[mealType]}</span>
                    <button class="ai-meal-add" onclick='addAIMeal("${mealType}", ${JSON.stringify(mealData).replace(/'/g, "\\'")})'> 
                        + Додати
                    </button>
                </div>
                <div class="ai-meal-details">
                    <strong>${mealData.name}</strong><br>
                    <small>${mealData.description}</small>
                </div>
                <div class="ai-meal-macros">
                    <div class="ai-meal-macro">🔥 ${Math.round(mealData.calories)} ккал</div>
                    <div class="ai-meal-macro">🍗 ${Math.round(mealData.protein)}г</div>
                    <div class="ai-meal-macro">🍚 ${Math.round(mealData.carbs)}г</div>
                    <div class="ai-meal-macro">🥑 ${Math.round(mealData.fats)}г</div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    
    document.getElementById('aiMenuContent').innerHTML = html;
}

function addAIMeal(mealType, mealData) {
    const foodData = {
        name: mealData.name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fats: mealData.fats,
        emoji: getFoodEmoji(mealData.name)
    };
    
    addFoodItem(mealType, foodData);
    
    const btn = event.target;
    btn.textContent = '✓ Додано';
    btn.style.background = '#10b981';
    btn.disabled = true;
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Будь ласка, завантажте зображення');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        
        document.querySelector('.upload-placeholder').style.display = 'none';
        document.getElementById('previewContainer').classList.remove('hidden');
        document.getElementById('optionalInputs').style.display = 'block';
        document.getElementById('analyzeBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

function resetPhotoModal() {
    document.getElementById('fileInput').value = '';
    document.getElementById('imagePreview').src = '';
    document.querySelector('.upload-placeholder').style.display = 'block';
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('analysisResult').classList.add('hidden');
    document.getElementById('analyzeBtn').disabled = true;
}

function resetManualModal() {
    document.getElementById('foodName').value = '';
    document.getElementById('foodCalories').value = '';
    document.getElementById('foodProtein').value = '';
    document.getElementById('foodCarbs').value = '';
    document.getElementById('foodFats').value = '';
}

function addAnalyzedFood() {
    const result = document.getElementById('analysisResult');
    const foodData = JSON.parse(result.dataset.foodData);
    const mealType = document.getElementById('mealTypeSelect').value;
    
    addFoodItem(mealType, foodData);
    document.getElementById('photoModal').classList.remove('active');
    resetPhotoModal();
}

function loadGoalsForm() {
    document.getElementById('goalCaloriesInput').value = currentData.goals.calories;
    document.getElementById('goalProteinInput').value = currentData.goals.protein;
    document.getElementById('goalCarbsInput').value = currentData.goals.carbs;
    document.getElementById('goalFatsInput').value = currentData.goals.fats;
}

function updateStats() {
    const history = currentData.history || [];
    const totalCalories = history.reduce((sum, day) => sum + day.calories, 0);
    const avgCalories = history.length > 0 ? totalCalories / history.length : 0;
    const goalsReached = history.filter(day => 
        Math.abs(day.calories - currentData.goals.calories) <= currentData.goals.calories * 0.1
    ).length;
    
    document.getElementById('avgCalories').textContent = Math.round(avgCalories);
    document.getElementById('trackedDays').textContent = history.length;
    document.getElementById('goalsReached').textContent = goalsReached;
    document.getElementById('totalCalories').textContent = Math.round(totalCalories);
    
    displayDetailedChart();
}

function displayDetailedChart() {
    const chartContainer = document.getElementById('weekChart');
    const history = (currentData.history || []).slice(-7);
    
    if (history.length === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Немає даних для відображення</p>';
        return;
    }
    
    let html = '<div class="detailed-chart">';
    
    history.forEach(day => {
        const date = new Date(day.date);
        const dateStr = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
        
        const meals = day.meals || {breakfast:[], lunch:[], dinner:[], snacks:[]};
        const breakfastCal = meals.breakfast ? meals.breakfast.reduce((sum, m) => sum + m.calories, 0) : 0;
        const lunchCal = meals.lunch ? meals.lunch.reduce((sum, m) => sum + m.calories, 0) : 0;
        const dinnerCal = meals.dinner ? meals.dinner.reduce((sum, m) => sum + m.calories, 0) : 0;
        const snacksCal = meals.snacks ? meals.snacks.reduce((sum, m) => sum + m.calories, 0) : 0;
        
        html += `
            <div class="chart-day">
                <div class="chart-day-header">
                    <strong>${dateStr}</strong>
                    <span>${Math.round(day.calories)} ккал</span>
                </div>
                <div class="chart-day-meals">
                    ${breakfastCal > 0 ? `<div class="chart-meal">🌅 ${breakfastCal.toFixed(0)} ккал</div>` : ''}
                    ${lunchCal > 0 ? `<div class="chart-meal">☀️ ${lunchCal.toFixed(0)} ккал</div>` : ''}
                    ${dinnerCal > 0 ? `<div class="chart-meal">🌙 ${dinnerCal.toFixed(0)} ккал</div>` : ''}
                    ${snacksCal > 0 ? `<div class="chart-meal">🍪 ${snacksCal.toFixed(0)} ккал</div>` : ''}
                </div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${Math.min((day.calories / currentData.goals.calories) * 100, 100)}%; background: ${day.calories > currentData.goals.calories ? '#ef4444' : '#10b981'}"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    chartContainer.innerHTML = html;
}

function loadHistory() {
    const timeline = document.getElementById('historyTimeline');
    const history = [...(currentData.history || [])].reverse();
    
    if (history.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>Історія порожня</h3>
                <p>Почніть додавати страви, щоб побачити історію</p>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = history.map(day => {
        const meals = day.meals || {breakfast:[], lunch:[], dinner:[], snacks:[]};
        const mealBreakdown = `
            <div class="history-meals">
                ${meals.breakfast && meals.breakfast.length > 0 ? `
                    <div class="history-meal-section">
                        <h4>🌅 Сніданок</h4>
                        ${meals.breakfast.map(m => `
                            <div class="history-meal-item">${m.emoji || '🍽️'} ${m.name} - ${Math.round(m.calories)} ккал</div>
                        `).join('')}
                    </div>
                ` : ''}
                ${meals.lunch && meals.lunch.length > 0 ? `
                    <div class="history-meal-section">
                        <h4>☀️ Обід</h4>
                        ${meals.lunch.map(m => `
                            <div class="history-meal-item">${m.emoji || '🍽️'} ${m.name} - ${Math.round(m.calories)} ккал</div>
                        `).join('')}
                    </div>
                ` : ''}
                ${meals.dinner && meals.dinner.length > 0 ? `
                    <div class="history-meal-section">
                        <h4>🌙 Вечеря</h4>
                        ${meals.dinner.map(m => `
                            <div class="history-meal-item">${m.emoji || '🍽️'} ${m.name} - ${Math.round(m.calories)} ккал</div>
                        `).join('')}
                    </div>
                ` : ''}
                ${meals.snacks && meals.snacks.length > 0 ? `
                    <div class="history-meal-section">
                        <h4>🍪 Перекуси</h4>
                        ${meals.snacks.map(m => `
                            <div class="history-meal-item">${m.emoji || '🍽️'} ${m.name} - ${Math.round(m.calories)} ккал</div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        return `
            <div class="history-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div style="font-weight: 700; font-size: 18px;">
                        ${new Date(day.date).toLocaleDateString('uk-UA', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary);">
                        ${Math.round(day.calories)} ккал
                    </div>
                </div>
                ${mealBreakdown}
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;">
                    <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary);">Білки</div>
                        <div style="font-size: 18px; font-weight: 600;">${Math.round(day.protein)}г</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary);">Вуглеводи</div>
                        <div style="font-size: 18px; font-weight: 600;">${Math.round(day.carbs)}г</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary);">Жири</div>
                        <div style="font-size: 18px; font-weight: 600;">${Math.round(day.fats)}г</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
