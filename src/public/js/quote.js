// public/js/quotes-tips.js

document.addEventListener('DOMContentLoaded', function() {

    // === Get References to Both Quote Card Elements (Modify) ===
    // Use querySelectorAll to get all quote cards
    const quoteCards = document.querySelectorAll('.quotes-container .quote-card');

    // Optional: If you only want to display the first two, you can limit it
    // const quoteCards = document.querySelectorAll('.quotes-container .quote-card:nth-child(n+2)'); // Get the 2nd card onwards

    const newQuoteBtn = document.getElementById('newQuoteBtn');


    // Helper function to update a single quote card element
    function updateQuoteCard(quoteCardElement, quote) {
        const contentElement = quoteCardElement.querySelector('.quote-content');
        const authorElement = quoteCardElement.querySelector('.quote-author');
        const sentimentElement = quoteCardElement.querySelector('.quote-sentiment');

        if (quote) {
             if (contentElement) contentElement.textContent = `"${quote.content}"`;
             if (authorElement) authorElement.textContent = `— ${quote.author || 'Unknown'}`;
             if (sentimentElement) {
                 sentimentElement.textContent = quote.sentiment.charAt(0).toUpperCase() + quote.sentiment.slice(1);
                 sentimentElement.classList.remove('positive', 'neutral', 'negative');
                 sentimentElement.classList.add(quote.sentiment);
             }
        } else {
            // Handle no quote found for this card
             if (contentElement) contentElement.textContent = "No quote available.";
             if (authorElement) authorElement.textContent = "";
             if (sentimentElement) {
                  sentimentElement.textContent = "";
                  sentimentElement.classList.remove('positive', 'neutral', 'negative');
             }
        }
    }


    // === Function to fetch and display MULTIPLE random quotes (Modify) ===
    async function fetchAndDisplayQuotes() {
        // Ensure there are at least two quote card elements in the HTML
        if (quoteCards.length < 2) {
            console.error("Need at least two .quote-card elements in HTML to display two quotes.");
            // Optionally display an error message on the page
            return;
        }

        try {
            // Fetch the first random quote
            const response1 = await fetch('/api/quotes/random');
            const quote1 = response1.ok ? await response1.json() : null;

            // Fetch the second random quote
            const response2 = await fetch('/api/quotes/random');
            const quote2 = response2.ok ? await response2.json() : null;

            // Update the first quote card
            updateQuoteCard(quoteCards[0], quote1);

            // Update the second quote card
            updateQuoteCard(quoteCards[1], quote2);


        } catch (error) {
            // Handle network errors for either fetch call
            console.error('Network error fetching quotes:', error);
            // Display error message in both cards or a general message
            if (quoteCards.length > 0) updateQuoteCard(quoteCards[0], null); // Pass null to clear/show error
            if (quoteCards.length > 1) updateQuoteCard(quoteCards[1], null); // Pass null to clear/show error
             // You could add a specific error message text instead of just clearing
        }
    }
    // === End of fetchAndDisplayQuotes function ===


    // === Add Event Listeners (Modify) ===

    // Fetch and display quotes when the page loads
    fetchAndDisplayQuotes();

    // Fetch and display new quotes when the button is clicked
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener('click', fetchAndDisplayQuotes);
    }


}); // End of DOMContentLoaded