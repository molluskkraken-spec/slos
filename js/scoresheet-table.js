/**
 * Scoresheet Table Initialization & Event Handlers
 * Handles table population, row editing, and user confirmations
 */

// Populate table rows with 10 entries
(function initializeScoreTable() {
    const tbody = document.querySelector('#scoresTable tbody');
    if (!tbody) return; // Exit if table doesn't exist

    for (let i = 1; i <= 10; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="num-cell">#${i}</td>
            <td><input type="text" class="editable" data-row="${i}" placeholder="Title ${i}"></td>
            <td><input type="number" class="editable score-input" data-row="${i}" min="0" max="100" value="0"></td>
            <td><input type="date" class="editable" data-row="${i}"></td>
            <td><input type="date" class="editable" data-row="${i}"></td>
            <td><div class="status-box ${i % 2 === 0 ? 'status-green' : 'status-red'}"></div></td>
        `;
        tbody.appendChild(tr);
    }
})();

// Handle edit confirmation before allowing input field modifications
(function setupEditConfirmation() {
    let previousValue = null;

    document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (target.matches && target.matches('.editable')) {
            previousValue = target.value;
            const confirmed = window.confirm(
                'Are you sure you want to edit this field? Click Cancel to keep the current value.'
            );

            if (!confirmed) {
                // Prevent editing by blurring and restoring value
                setTimeout(() => {
                    target.blur();
                    target.value = previousValue;
                }, 0);
            }
        }
    }, true);

    // Validate number inputs
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.matches && target.matches('input[type="number"]')) {
            const value = Number(target.value);
            if (isNaN(value) || value < 0) {
                target.value = 0;
            }
        }
    });
})();
