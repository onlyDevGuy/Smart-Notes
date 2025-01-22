// DOM Elements
const addBtn = document.querySelector("#addBtn");
const main = document.querySelector("#main");
const searchInput = document.querySelector("#searchNotes");
const sortSelect = document.querySelector("#sortNotes");
const noteTemplate = document.querySelector("#note-template");

// State
let notes = [];
const colors = ['#ffffff', '#ffeb3b', '#a5d6a7', '#90caf9', '#f48fb1', '#ce93d8'];

// Load notes from localStorage
function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    notes = savedNotes.map(note => ({
        ...note,
        timestamp: new Date(note.timestamp || Date.now())
    }));
    renderNotes();
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
}

// Create a new note
function createNote() {
    const note = {
        id: Date.now(),
        title: '',
        content: '',
        color: '#ffffff',
        pinned: false,
        tags: [],
        timestamp: new Date()
    };
    notes.unshift(note);
    renderNotes();
    saveNotes();
}

// Delete a note
function deleteNote(noteId) {
    const index = notes.findIndex(note => note.id === noteId);
    if (index !== -1) {
        notes.splice(index, 1);
        renderNotes();
        saveNotes();
    }
}

// Update note content
function updateNote(noteId, updates) {
    const note = notes.find(note => note.id === noteId);
    if (note) {
        Object.assign(note, updates);
        saveNotes();
    }
}

// Toggle pin status
function togglePin(noteId) {
    const note = notes.find(note => note.id === noteId);
    if (note) {
        note.pinned = !note.pinned;
        renderNotes();
        saveNotes();
    }
}

// Add or remove tags
function handleTags(noteId, input) {
    if (event.key === 'Enter' && input.value.trim()) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            const tag = input.value.trim();
            if (!note.tags.includes(tag)) {
                note.tags.push(tag);
                renderTags(note, input.parentElement);
                saveNotes();
            }
            input.value = '';
        }
    }
}

// Render tags for a note
function renderTags(note, container) {
    const existingTags = container.querySelectorAll('.tag:not(.tag-input)');
    existingTags.forEach(tag => tag.remove());
    
    note.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.onclick = () => {
            note.tags = note.tags.filter(t => t !== tag);
            tagElement.remove();
            saveNotes();
        };
        container.insertBefore(tagElement, container.lastElementChild);
    });
}

// Show color palette
function showColorPalette(noteId, button) {
    const palette = document.getElementById('colorPalette');
    const note = notes.find(note => note.id === noteId);
    
    if (!note) return;
    
    const buttonRect = button.getBoundingClientRect();
    palette.style.top = buttonRect.bottom + 5 + 'px';
    palette.style.left = buttonRect.left + 'px';
    palette.classList.add('show');
    
    // Mark current color as selected
    palette.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === note.color);
    });
    
    // Handle color selection
    const handleColorClick = (e) => {
        const color = e.target.dataset.color;
        if (color) {
            note.color = color;
            const noteElement = button.closest('.note');
            noteElement.style.backgroundColor = color;
            saveNotes();
        }
        hideColorPalette();
    };
    
    const hideColorPalette = () => {
        palette.classList.remove('show');
        palette.removeEventListener('click', handleColorClick);
        document.removeEventListener('click', handleOutsideClick);
    };
    
    const handleOutsideClick = (e) => {
        if (!palette.contains(e.target) && !button.contains(e.target)) {
            hideColorPalette();
        }
    };
    
    palette.addEventListener('click', handleColorClick);
    document.addEventListener('click', handleOutsideClick);
}

// Format timestamp
function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Filter notes based on search
function filterNotes(searchTerm) {
    const term = searchTerm.toLowerCase();
    return notes.filter(note => 
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.tags.some(tag => tag.toLowerCase().includes(term))
    );
}

// Sort notes
function sortNotes(notes) {
    const sortBy = sortSelect.value;
    return [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        
        switch (sortBy) {
            case 'newest':
                return b.timestamp - a.timestamp;
            case 'oldest':
                return a.timestamp - b.timestamp;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
}

// Render all notes
function renderNotes() {
    main.innerHTML = '';
    const searchTerm = searchInput.value;
    let filteredNotes = searchTerm ? filterNotes(searchTerm) : notes;
    filteredNotes = sortNotes(filteredNotes);
    
    filteredNotes.forEach(note => {
        const noteElement = noteTemplate.content.cloneNode(true).querySelector('.note');
        
        // Set note color
        noteElement.style.backgroundColor = note.color;
        
        // Set note data
        noteElement.dataset.id = note.id;
        
        // Set title
        const titleInput = noteElement.querySelector('.note-title');
        titleInput.value = note.title;
        titleInput.addEventListener('input', e => {
            note.title = e.target.value;
            saveNotes();
        });
        
        // Set content
        const textarea = noteElement.querySelector('textarea');
        textarea.value = note.content;
        textarea.addEventListener('input', e => {
            note.content = e.target.value;
            saveNotes();
        });
        
        // Set timestamp
        const timestamp = noteElement.querySelector('.timestamp');
        timestamp.textContent = formatTimestamp(note.timestamp);
        
        // Setup pin button
        const pinBtn = noteElement.querySelector('.pin-btn');
        pinBtn.classList.toggle('active', note.pinned);
        pinBtn.addEventListener('click', () => togglePin(note.id));
        
        // Setup color button
        const colorBtn = noteElement.querySelector('.color-btn');
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showColorPalette(note.id, colorBtn);
        });
        
        // Setup delete button
        const deleteBtn = noteElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteNote(note.id));
        
        // Setup tags
        const tagInput = noteElement.querySelector('.tag-input');
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleTags(note.id, tagInput);
            }
        });
        
        // Render existing tags
        renderTags(note, noteElement.querySelector('.note-tags'));
        
        main.appendChild(noteElement);
    });
}

// Event Listeners
addBtn.addEventListener("click", createNote);
searchInput.addEventListener("input", renderNotes);
sortSelect.addEventListener("change", renderNotes);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    // Create a welcome note if no notes exist
    if (notes.length === 0) {
        const welcomeNote = {
            id: Date.now(),
            title: 'Welcome to Smart Notes! 📝',
            content: 'Get started by:\n\n1. Click the "New Note" button to create a note\n2. Give your note a title\n3. Write your content\n4. Add tags for better organization\n5. Pin important notes\n6. Change note colors\n\nEnjoy taking notes! 🚀',
            color: '#a5d6a7',
            pinned: true,
            tags: ['welcome', 'tutorial'],
            timestamp: new Date()
        };
        notes.push(welcomeNote);
        saveNotes();
        renderNotes();
    }
});
