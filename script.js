function addEventListeners() {
    function handleCategoryClick(event) {
        // Alle Buttons deaktivieren
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        // Angeklickten Button aktivieren
        event.target.classList.add('active');
        // Daten aktualisieren
        updateData();
    }

    // Einfache Listener
    document.getElementById('searchInput').addEventListener('input', updateData);
    document.getElementById('sortFilter').addEventListener('change', updateData);
    document.getElementById('ratingFilter').addEventListener('input', updateData);

    // Kategorie-Buttons
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(button => button.addEventListener('click', handleCategoryClick));
}

// Function to get data from CSV file
async function getCardData() {
    try {
        const response = await fetch('cards.csv');
        const csvText = await response.text();
        return Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    } catch (error) {
        console.error('Error loading cards:', error);
        return [];
    }
}

async function getColorsData() {
    try {
        const response = await fetch('colors.csv');
        const csvText = await response.text();
        return Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    } catch (error) {
        console.error('Error loading colors:', error);
        return [];
    }
}

// Function to create and display all cards
function displayCards(cardsData, colorsData) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = ''; // Clear first
    i=0;
    cardsData.forEach(card => {
        const colorInfo = colorsData.find(c => c.category.toLowerCase() === card.category.toLowerCase());
        const cardStyle = `style="--card-color: ${colorInfo ? colorInfo.color : '#1890ff'}; --card-bg-image: var(--gradient-${colorInfo.gradient})"`;
        const cardHTML = `
            <div class="card" ${cardStyle}>
                <a href="${card.website}" class="card-title">${card.name}</a>
                <div class="card-subtitle">${card.description}</div>
                <div class="card-rating">Rating: ${card.rating}/10</div>
                <div class="card-ratingbar"></div>
                <div class="card-ratingbarcolor" style="--card-ratingbar-width:${card.rating * 10}%"></div>
                <div class="card-pricestructure">Price structure: ${card.price}</div>
                <div class="card-category">${card.category}</div>
            </div>`;
        container.innerHTML += cardHTML;
    });
}

function filterCardData(cardData) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    // Neue Methode zum Erfassen der aktiven Kategorie
    const activeCategory = document.querySelector('.category-btn.active').textContent.toLowerCase();
    const ratingFilter = parseFloat(document.getElementById('ratingFilter').value) || 0;

    return cardData.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm) ||
            card.description.toLowerCase().includes(searchTerm);
        // Kategorie-Filter angepasst
        const matchesCategory = activeCategory === 'all' || card.category === activeCategory;
        const matchesRating = parseFloat(card.rating) >= ratingFilter;
        return matchesSearch && matchesCategory && matchesRating;
    });
}
function sortCards(cards, sortType) {
    // Sortierfunktionen
    const sortByRatingDesc = (a, b) => parseFloat(b.rating) - parseFloat(a.rating);
    const sortByRatingAsc = (a, b) => parseFloat(a.rating) - parseFloat(b.rating);
    const sortByNameAsc = (a, b) => a.name.localeCompare(b.name);
    const sortByNameDesc = (a, b) => b.name.localeCompare(a.name);

    if (!sortType) return cards;
    const sortedCards = [...cards];
    switch (sortType) {
        case 'rating-desc':
            return sortedCards.sort(sortByRatingDesc);
        case 'rating-asc':
            return sortedCards.sort(sortByRatingAsc);
        case 'name-asc':
            return sortedCards.sort(sortByNameAsc);
        case 'name-desc':
            return sortedCards.sort(sortByNameDesc);
        default:
            return cards;
    }
}

let cardData, colorsData;
async function initDataAndList() {
    cardData = await getCardData();
    colorsData = await getColorsData();
    // Farben für Kategorie-Buttons setzen
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(button => {
        const category = button.textContent.toLowerCase();
        if (category !== 'all') {
            const color = colorsData.find(c => c.category === category)?.color;
            if (color) {
                button.style.background = color + '33';
            }
        }
    });
    checkCategories(cardData, colorsData);
    displayCards(cardData, colorsData);
}

function updateStats(filteredData) {
    document.getElementById('toolCount').textContent = filteredData.length;    
    const avgRating = filteredData.reduce((sum, card) => sum + parseFloat(card.rating), 0) / filteredData.length;
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
}

function updateData() {
    const sortType = document.getElementById('sortFilter').value;
    let filteredData = filterCardData(cardData);
    filteredData = sortCards(filteredData, sortType);
    displayCards(filteredData, colorsData);
    updateStats(filteredData);  
}

function checkCategories(cardData, colorsData) {
    // Sammle alle einzigartigen Kategorien aus den Karten
    const usedCategories = new Set(cardData.map(card => card.category));    
    // Sammle alle verfügbaren Kategorien aus colors.csv
    const availableCategories = new Set(colorsData.map(color => color.category));    
    // Finde Kategorien, die verwendet werden aber nicht in colors.csv definiert sind
    const missingCategories = [...usedCategories].filter(category => !availableCategories.has(category));    
    // Wenn fehlende Kategorien gefunden wurden, zeige Alert
    if (missingCategories.length > 0) {
        alert(`Warning: Following categories are not defined in colors.csv:\n${missingCategories.join(', ')}`);
    }
}

// Start the application
async function startApp() {
    await initDataAndList();  // Warten bis Daten geladen sind
    addEventListeners();      // Dann Event Listener hinzufügen
    updateStats(cardData);    // Jetzt sind die Daten verfügbar
}

// Anwendung starten
startApp();

