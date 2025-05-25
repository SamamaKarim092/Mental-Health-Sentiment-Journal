document.addEventListener('DOMContentLoaded', function () {
    // === Sentiment Selection ===
    const sentimentOptions = document.querySelectorAll('.sentiment-option');
    sentimentOptions.forEach(option => {
        option.addEventListener('click', function () {
            sentimentOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    const form = document.getElementById('newEntryForm');
    const entriesListContainer = document.querySelector('.entries-list .entry-cards-container');
    const emptyState = document.querySelector('.entries-list .empty-state');

    // === Filter Controls (New) ===
    const sentimentFilter = document.getElementById('sentimentFilter');
    const startDateFilter = document.getElementById('startDateFilter');
    const endDateFilter = document.getElementById('endDateFilter');

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    function renderEntryCard(entry) {
        const entryCard = document.createElement('div');
        entryCard.classList.add('entry-card');
        entryCard.dataset.id = entry._id;

        const entryDate = formatDate(entry.date);

        entryCard.innerHTML = `
            <div class="entry-header">
                <h4>${entry.title}</h4>
                <span class="entry-sentiment ${entry.sentiment}">
                    ${entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1)}
                </span>
            </div>
            <div class="entry-date">${entryDate}</div>
            <p class="entry-content">${entry.content}</p>
            <div class="entry-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;

        return entryCard;
    }

    function renderEditForm(entry) {
        const editFormHtml = `
            <form class="edit-entry-form" data-id="${entry._id}">
                <div class="form-group">
                    <label for="editTitle-${entry._id}">Title</label>
                    <input type="text" id="editTitle-${entry._id}" value="${entry.title}" required>
                </div>
                <div class="form-group">
                    <label for="editContent-${entry._id}">How were you feeling?</label>
                    <textarea id="editContent-${entry._id}" required>${entry.content}</textarea>
                </div>
                <div class="form-group">
                    <label>Mood</label>
                    <div class="sentiment-selector">
                        <div class="sentiment-option positive ${entry.sentiment === 'positive' ? 'selected' : ''}" data-sentiment="positive">
                            <i class="fas fa-smile"></i>
                            <div>Positive</div>
                        </div>
                        <div class="sentiment-option neutral ${entry.sentiment === 'neutral' ? 'selected' : ''}" data-sentiment="neutral">
                            <i class="fas fa-meh"></i>
                            <div>Neutral</div>
                        </div>
                        <div class="sentiment-option negative ${entry.sentiment === 'negative' ? 'selected' : ''}" data-sentiment="negative">
                            <i class="fas fa-frown"></i>
                            <div>Negative</div>
                        </div>
                    </div>
                </div>
                <div class="entry-actions" style="justify-content: flex-start;">
                    <button type="submit" class="btn small">Save Changes</button>
                    <button type="button" class="btn small btn-secondary cancel-edit">Cancel</button>
                </div>
            </form>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editFormHtml;
        return tempDiv.firstElementChild;
    }

    function addEntryActionListeners() {
        const deleteButtons = entriesListContainer.querySelectorAll('.delete-btn');
        const editButtons = entriesListContainer.querySelectorAll('.edit-btn');

        deleteButtons.forEach(button => {
            button.addEventListener('click', async function () {
                const entryCard = button.closest('.entry-card');
                const entryId = entryCard.dataset.id;

                if (confirm('Are you sure you want to delete this entry?')) {
                    try {
                        const response = await fetch(`/api/entries/${entryId}`, { method: 'DELETE' });

                        if (response.ok) {
                            console.log('Entry deleted successfully:', entryId);
                            entryCard.remove();

                            if (entriesListContainer.children.length === 0) {
                                emptyState.style.display = 'block';
                                entriesListContainer.style.display = 'none';
                            }
                        } else {
                            const errorData = await response.json();
                            alert(`Error deleting entry: ${errorData.message || response.statusText}`);
                        }
                    } catch (error) {
                        alert('Network error: Could not delete entry.');
                    }
                }
            });
        });

        editButtons.forEach(button => {
            button.addEventListener('click', async function () {
                const entryCard = button.closest('.entry-card');
                const entryId = entryCard.dataset.id;

                try {
                    const response = await fetch(`/api/entries/${entryId}`);
                    const entry = await response.json();

                    const editForm = renderEditForm(entry);
                    entryCard.replaceWith(editForm);

                    const formSentiments = editForm.querySelectorAll('.sentiment-option');
                    formSentiments.forEach(opt => {
                        opt.addEventListener('click', function () {
                            formSentiments.forEach(o => o.classList.remove('selected'));
                            this.classList.add('selected');
                        });
                    });

                    editForm.querySelector('.cancel-edit').addEventListener('click', () => {
                        const originalCard = renderEntryCard(entry);
                        editForm.replaceWith(originalCard);
                        addEntryActionListeners();
                    });

                    editForm.addEventListener('submit', async function (e) {
                        e.preventDefault();

                        const updatedTitle = editForm.querySelector(`#editTitle-${entryId}`).value;
                        const updatedContent = editForm.querySelector(`#editContent-${entryId}`).value;
                        const selectedMood = editForm.querySelector('.sentiment-option.selected')?.dataset.sentiment;

                        if (!updatedTitle || !updatedContent || !selectedMood) {
                            alert('Please fill in all fields and select a mood.');
                            return;
                        }

                        try {
                            const updateResponse = await fetch(`/api/entries/${entryId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: updatedTitle,
                                    content: updatedContent,
                                    sentiment: selectedMood
                                })
                            });

                            if (updateResponse.ok) {
                                const updatedEntry = await updateResponse.json();
                                const updatedCard = renderEntryCard(updatedEntry);
                                editForm.replaceWith(updatedCard);
                                addEntryActionListeners();
                            } else {
                                const err = await updateResponse.json();
                                alert(`Failed to update: ${err.message || updateResponse.statusText}`);
                            }

                        } catch (err) {
                            alert('Network error: Could not update entry.');
                        }
                    });

                } catch (err) {
                    alert('Could not load entry for editing.');
                }
            });
        });
    }

    async function fetchAndDisplayEntries() {
        try {
            const selectedSentiment = sentimentFilter?.value;
            const startDate = startDateFilter?.value;
            const endDate = endDateFilter?.value;

            const queryParams = new URLSearchParams();

            if (selectedSentiment) queryParams.append('sentiment', selectedSentiment);
            if (startDate) queryParams.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                queryParams.append('endDate', end.toISOString());
            }

            const url = `/api/entries?${queryParams.toString()}`;
            const response = await fetch(url);

            if (response.ok) {
                const entries = await response.json();
                entriesListContainer.innerHTML = '';

                if (entries.length === 0) {
                    emptyState.style.display = 'block';
                    entriesListContainer.style.display = 'none';
                    emptyState.innerHTML = (selectedSentiment || startDate || endDate)
                        ? `<i class="fas fa-box-open"></i><h4>No entries match your filters.</h4><p>Try adjusting your filter options.</p>`
                        : `<i class="fas fa-journal-whills"></i><h4>No entries yet!</h4><p>Start by writing your first journal entry above.</p>`;
                } else {
                    emptyState.style.display = 'none';
                    entriesListContainer.style.display = 'block';

                    entries.forEach(entry => {
                        const card = renderEntryCard(entry);
                        entriesListContainer.appendChild(card);
                    });

                    addEntryActionListeners();
                }
            } else {
                const err = await response.json();
                emptyState.innerHTML = `<i class="fas fa-exclamation-circle"></i><h4>Error loading entries</h4><p>${err.message}</p>`;
                emptyState.style.display = 'block';
                entriesListContainer.style.display = 'none';
            }
        } catch (err) {
            emptyState.innerHTML = `<i class="fas fa-exclamation-circle"></i><h4>Network Error</h4><p>Could not load entries.</p>`;
            emptyState.style.display = 'block';
            entriesListContainer.style.display = 'none';
        }
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const titleInput = document.getElementById('entryTitle');
        const contentInput = document.getElementById('entryContent');
        const selectedSentimentOption = document.querySelector('.sentiment-option.selected');

        const title = titleInput.value;
        const content = contentInput.value;
        const sentiment = selectedSentimentOption ? selectedSentimentOption.dataset.sentiment : null;

        if (!title || !content || !sentiment) {
            alert('Please fill in all fields and select a mood.');
            return;
        }

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, sentiment })
            });

            if (response.ok) {
                titleInput.value = '';
                contentInput.value = '';
                sentimentOptions.forEach(opt => opt.classList.remove('selected'));
                fetchAndDisplayEntries();
            } else {
                const err = await response.json();
                alert(`Error saving entry: ${err.message || response.statusText}`);
            }
        } catch (err) {
            alert('Network error: Could not connect to the server.');
        }
    });

    // === Attach event listeners to filters ===
    if (sentimentFilter && startDateFilter && endDateFilter) {
        sentimentFilter.addEventListener('change', fetchAndDisplayEntries);
        startDateFilter.addEventListener('change', fetchAndDisplayEntries);
        endDateFilter.addEventListener('change', fetchAndDisplayEntries);
    }

    fetchAndDisplayEntries();
});
