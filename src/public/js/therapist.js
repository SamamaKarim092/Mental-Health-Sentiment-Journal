// Therapist Page JavaScript

// Sample therapist data (will be replaced with backend data)
const therapistsData = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        credentials: "PhD, Licensed Psychologist",
        avatar: "SJ",
        rating: 4.9,
        reviewCount: 127,
        specialties: ["Anxiety", "Depression", "Cognitive Behavioral Therapy"],
        description: "Specializing in evidence-based treatments for anxiety and depression. I provide a safe, supportive environment to help you develop coping strategies and achieve your mental health goals.",
        location: "New York, NY",
        sessionTypes: ["online", "in-person"],
        availability: ["evening", "weekend"],
        insurance: true,
        price: "$120-150/session"
    },
    {
        id: 2,
        name: "Dr. Michael Chen",
        credentials: "MD, Psychiatrist",
        avatar: "MC",
        rating: 4.8,
        reviewCount: 89,
        specialties: ["Trauma & PTSD", "Anxiety", "Medication Management"],
        description: "Board-certified psychiatrist with expertise in trauma therapy and medication management. I take a holistic approach to mental health care.",
        location: "Los Angeles, CA",
        sessionTypes: ["online", "in-person"],
        availability: ["evening"],
        insurance: true,
        price: "$200-250/session"
    },
    {
        id: 3,
        name: "Lisa Rodriguez",
        credentials: "LCSW, Clinical Social Worker",
        avatar: "LR",
        rating: 4.7,
        reviewCount: 156,
        specialties: ["Family Therapy", "Relationship Issues", "Adolescent Therapy"],
        description: "Experienced family therapist helping individuals, couples, and families navigate relationship challenges and improve communication.",
        location: "Chicago, IL",
        sessionTypes: ["online", "in-person"],
        availability: ["weekend"],
        insurance: false,
        price: "$90-120/session"
    },
    {
        id: 4,
        name: "Dr. James Wilson",
        credentials: "PsyD, Clinical Psychologist",
        avatar: "JW",
        rating: 4.9,
        reviewCount: 203,
        specialties: ["Addiction", "Depression", "Mindfulness-Based Therapy"],
        description: "Specializing in addiction recovery and depression treatment using mindfulness-based approaches and cognitive behavioral therapy.",
        location: "Austin, TX",
        sessionTypes: ["online"],
        availability: ["evening", "weekend"],
        insurance: true,
        price: "$110-140/session"
    },
    {
        id: 5,
        name: "Dr. Emily Davis",
        credentials: "PhD, Eating Disorder Specialist",
        avatar: "ED",
        rating: 4.8,
        reviewCount: 94,
        specialties: ["Eating Disorders", "Body Image", "Adolescent Therapy"],
        description: "Specialized treatment for eating disorders and body image issues. I provide compassionate care for individuals of all ages.",
        location: "Seattle, WA",
        sessionTypes: ["online", "in-person"],
        availability: ["evening"],
        insurance: true,
        price: "$130-160/session"
    },
    {
        id: 6,
        name: "Dr. Robert Martinez",
        credentials: "LMFT, Marriage & Family Therapist",
        avatar: "RM",
        rating: 4.6,
        reviewCount: 78,
        specialties: ["Couples Therapy", "Family Therapy", "Communication Skills"],
        description: "Helping couples and families strengthen their relationships through improved communication and conflict resolution skills.",
        location: "Miami, FL",
        sessionTypes: ["online", "in-person"],
        availability: ["weekend"],
        insurance: false,
        price: "$100-130/session"
    }
];

// DOM elements
const therapistsGrid = document.getElementById('therapistsGrid');
const searchForm = document.getElementById('therapistSearchForm');
const filterTags = document.querySelectorAll('.filter-tag');

// Current filters
let currentFilters = {
    location: '',
    specialty: '',
    sessionType: 'all',
    availability: 'all',
    insurance: 'all'
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    renderTherapists(therapistsData);
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search form
    searchForm.addEventListener('submit', handleSearch);

    // Filter tags
    filterTags.forEach(tag => {
        tag.addEventListener('click', handleFilterClick);
    });
}

// Handle search form submission
function handleSearch(e) {
    e.preventDefault();
    const location = document.getElementById('location').value;
    const specialty = document.getElementById('specialty').value;
    
    currentFilters.location = location;
    currentFilters.specialty = specialty;
    
    filterAndRenderTherapists();
}

// Handle filter tag clicks
function handleFilterClick(e) {
    const tag = e.target;
    const filter = tag.getAttribute('data-filter');
    
    // Update active state
    filterTags.forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    
    // Update current filter
    if (filter === 'all') {
        currentFilters.sessionType = 'all';
        currentFilters.availability = 'all';
        currentFilters.insurance = 'all';
    } else if (filter === 'online' || filter === 'in-person') {
        currentFilters.sessionType = filter;
    } else if (filter === 'evening' || filter === 'weekend') {
        currentFilters.availability = filter;
    } else if (filter === 'insurance') {
        currentFilters.insurance = filter;
    }
    
    filterAndRenderTherapists();
}

// Filter and render therapists
function filterAndRenderTherapists() {
    let filteredTherapists = therapistsData;
    
    // Filter by location
    if (currentFilters.location) {
        filteredTherapists = filteredTherapists.filter(therapist =>
            therapist.location.toLowerCase().includes(currentFilters.location.toLowerCase())
        );
    }
    
    // Filter by specialty
    if (currentFilters.specialty) {
        filteredTherapists = filteredTherapists.filter(therapist =>
            therapist.specialties.some(specialty =>
                specialty.toLowerCase().includes(currentFilters.specialty.toLowerCase())
            )
        );
    }
    
    // Filter by session type
    if (currentFilters.sessionType !== 'all') {
        filteredTherapists = filteredTherapists.filter(therapist =>
            therapist.sessionTypes.includes(currentFilters.sessionType)
        );
    }
    
    // Filter by availability
    if (currentFilters.availability !== 'all') {
        filteredTherapists = filteredTherapists.filter(therapist =>
            therapist.availability.includes(currentFilters.availability)
        );
    }
    
    // Filter by insurance
    if (currentFilters.insurance === 'insurance') {
        filteredTherapists = filteredTherapists.filter(therapist =>
            therapist.insurance === true
        );
    }
    
    renderTherapists(filteredTherapists);
}

// Render therapists
function renderTherapists(therapists) {
    if (therapists.length === 0) {
        therapistsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No therapists found</h3>
                <p>Try adjusting your search criteria or filters.</p>
            </div>
        `;
        return;
    }

    therapistsGrid.innerHTML = therapists.map(therapist => `
        <div class="therapist-card" data-therapist-id="${therapist.id}">
            <div class="therapist-header">
                <div class="therapist-avatar">
                    ${therapist.avatar}
                </div>
                <div class="therapist-info">
                    <h3>${therapist.name}</h3>
                    <div class="credentials">${therapist.credentials}</div>
                    <div class="rating">
                        ${generateStars(therapist.rating)}
                        <span>${therapist.rating} (${therapist.reviewCount} reviews)</span>
                    </div>
                </div>
            </div>
            
            <div class="specialties">
                <h4>Specialties:</h4>
                <div class="specialty-tags">
                    ${therapist.specialties.map(specialty => 
                        `<span class="specialty-tag">${specialty}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="therapist-details">
                <p>${therapist.description}</p>
                <p><strong>Location:</strong> ${therapist.location}</p>
                <p><strong>Session Types:</strong> ${therapist.sessionTypes.join(', ')}</p>
                <p><strong>Price:</strong> ${therapist.price}</p>
                ${therapist.insurance ? '<p><strong>Insurance accepted</strong></p>' : ''}
            </div>
            
            <div class="therapist-actions">
                <button class="btn btn-primary" onclick="bookAppointment(${therapist.id})">
                    <i class="fas fa-calendar-plus"></i> Book Appointment
                </button>
                <button class="btn btn-secondary" onclick="viewProfile(${therapist.id})">
                    <i class="fas fa-user"></i> View Profile
                </button>
            </div>
        </div>
    `).join('');
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    return starsHTML;
}

// Book appointment function (to be implemented with backend)
function bookAppointment(therapistId) {
    const therapist = therapistsData.find(t => t.id === therapistId);
    alert(`Booking appointment with ${therapist.name}. This feature will be connected to the backend soon!`);
    // TODO: Implement booking logic with backend API
    // Example: 
    // fetch('/api/appointments', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ therapistId, userId: getCurrentUserId() })
    // });
}

// View profile function (to be implemented)
function viewProfile(therapistId) {
    const therapist = therapistsData.find(t => t.id === therapistId);
    alert(`Viewing profile for ${therapist.name}. This feature will be connected to the backend soon!`);
    // TODO: Implement profile view - could open a modal or navigate to profile page
    // Example: window.location.href = `/therapist-profile/${therapistId}`;
}

// Utility function for future backend integration
function getCurrentUserId() {
    // TODO: Implement user authentication and return current user ID
    return null;
}

// Auto-resize textarea (if needed for contact forms later)
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}