// Global State
let bookshelf = {
  unread: [],
  read: [],
};

// Constants
const STORAGE_KEY = "LOCAL_BOOKSHELF";
const EVENTS = {
  SAVED: "saved-bookshelf",
  RENDER: "render-bookshelf",
};

// DOM Elements
const DOM = {
  form: {
    element: document.getElementById("bookForm"),
    title: document.getElementById("bookFormTitle"),
    author: document.getElementById("bookFormAuthor"),
    year: document.getElementById("bookFormYear"),
    status: document.getElementById("bookFormIsComplete"),
    formTitle: document.getElementById("formTitle"),
    submitButton: document.getElementById("bookFormSubmit"),
    buttonField: document.getElementById("buttonFormField"),
  },
  search: {
    form: document.getElementById("searchBook"),
    input: document.getElementById("searchBookTitle"),
  },
  bookLists: {
    unread: {
      container: document.getElementById("incompleteBookList"),
      count: document.getElementById("unreadBookCount"),
    },
    read: {
      container: document.getElementById("completeBookList"),
      count: document.getElementById("readBookCount"),
    },
  },
};

// State Tracking
let editingBookId = null;

/**
 * Initializes the application
 */
function init() {
  // Set up event listeners
  document.addEventListener(EVENTS.RENDER, renderBooks);
  document.addEventListener(EVENTS.SAVED, loadBooksFromStorage);

  window.addEventListener("load", () =>
    document.dispatchEvent(new Event(EVENTS.SAVED)),
  );

  DOM.form.element.addEventListener("submit", handleFormSubmit);
  DOM.search.form.addEventListener("submit", handleSearch);
}

/**
 * Handles form submission
 * @param {Event} e - The submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();

  if (editingBookId) {
    editBook();
    cancelEdit();
  } else {
    addBook();
  }
}

/**
 * Handles search form submission
 * @param {Event} e - The submit event
 */
function handleSearch(e) {
  e.preventDefault();

  // Load all books from the storage
  loadBooksFromStorage();

  // Get search term
  const searchTerm = DOM.search.input.value.trim().toLowerCase();

  // If search term is empty, show all books
  if (!searchTerm) {
    return;
  }

  // Filter books based on search term
  bookshelf.unread = bookshelf.unread.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm),
  );

  bookshelf.read = bookshelf.read.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm),
  );
  // Update UI
  document.dispatchEvent(new Event(EVENTS.RENDER));

  // Scroll to book
  DOM.bookLists.unread.container.scrollIntoView({ behavior: "smooth" });
}

/**
 * Updates an existing book with form data
 */
function editBook() {
  const bookData = getFormData();
  const book = findBookById(editingBookId);

  if (!book) return;

  // Update book properties
  Object.assign(book, bookData);

  // Update UI and storage
  document.dispatchEvent(new Event(EVENTS.RENDER));
  saveBooks();
}

/**
 * Creates a new book from form data
 */
function addBook() {
  const bookData = getFormData();
  bookData.id = generateId();

  // Add to appropriate array
  if (bookData.isComplete) {
    bookshelf.read.push(bookData);
  } else {
    bookshelf.unread.push(bookData);
  }

  // Clear form
  resetForm();

  // Update UI and storage
  document.dispatchEvent(new Event(EVENTS.RENDER));
  saveBooks();
}

/**
 * Extracts and returns book data from form
 *
 * @returns { Object } - Book data
 */
function getFormData() {
  return {
    title: DOM.form.title.value.trim(),
    author: DOM.form.author.value.trim(),
    year: parseInt(DOM.form.year.value.trim()),
    isComplete: DOM.form.status.checked,
  };
}

/**
 * Enters edit mode for a specific book
 * @param {number} bookId - The ID of the book to edit
 */
function enterEditMode(bookId) {
  const book = findBookById(bookId);
  if (!book) return;

  // set form to edit mode
  editingBookId = bookId;

  // Update form title
  formTitle.innerHTML = "";
  DOM.form.formTitle.innerHTML = "";
  const iconElement = createElementWithText("span", "✏️");
  iconElement.classList.add("book-form_title--icon");

  const titleTextElement = createElementWithText("p", "Edit Existing Book");
  DOM.form.formTitle.append(iconElement, titleTextElement);

  formTitle.append(iconElement, titleTextElement);

  // Update submit button
  updateSubmitButton("📝", "Update Book", "bookFormEdit", "btn-update");

  // Add cancel button
  if (!document.getElementById("cancelEditBtn")) {
    const cancelButton = createElementWithText("button", "");
    const iconCancelElement = createElementWithText("span", "❌");
    iconCancelElement.classList.add("book-form__btn-icon");

    cancelButton.id = "cancelEditBtn";
    cancelButton.type = "button";
    cancelButton.classList.add("book-form__submit", "btn-cancel");

    const textCancelElement = createElementWithText("p", "Cancel Edit");
    cancelButton.append(iconCancelElement, textCancelElement);
    cancelButton.addEventListener("click", cancelEdit);

    DOM.form.buttonField.appendChild(cancelButton);
  }

  // Change Submit form id
  DOM.form.element.id = "bookEditForm";

  // Populate form with book data
  populateForm(book);

  // Scroll to form
  DOM.form.element.scrollIntoView({ behavior: "smooth" });
}

/**
 * Helper function to create element with text
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @returns {HTMLElement} - New element
 */
function createElementWithText(tag, text) {
  const element = document.createElement(tag);
  element.innerText = text;
  return element;
}

/**
 * Updates the submit button appearance
 * @param {string} icon - Icon text
 * @param {string} text - Button text
 * @param {string} id - Button ID
 * @param {string} extraClass - Additional CSS class
 */
function updateSubmitButton(icon, text, id, extraClass) {
  DOM.form.submitButton.innerHTML = "";

  if (extraClass) {
    DOM.form.submitButton.classList.add(extraClass);
  }

  const iconElement = createElementWithText("span", icon);
  iconElement.classList.add("book-form__btn-icon");

  const textElement = createElementWithText("p", text);

  DOM.form.submitButton.id = id;
  DOM.form.submitButton.append(iconElement, textElement);
}

/**
 * Populates form with book data
 * @param {Object} book - Book object
 */
function populateForm(book) {
  DOM.form.title.value = book.title;
  DOM.form.author.value = book.author;
  DOM.form.year.value = book.year;
  DOM.form.status.checked = book.isComplete;
}

/**
 * Exits edit mode
 */
function exitEditMode() {
  editingBookId = null;

  // Restore form title
  DOM.form.formTitle.innerHTML = "";
  const iconElement = createElementWithText("span", "📚");
  iconElement.classList.add("book-form_title--icon");

  const titleTextElement = createElementWithText("p", "Add New Book");
  DOM.form.formTitle.append(iconElement, titleTextElement);

  // Restore submit button
  updateSubmitButton("📝", "Add New Book", "bookFormSubmit");
  DOM.form.submitButton.classList.remove("btn-update");

  // Remove cancel button
  const cancelButton = document.getElementById("cancelEditBtn");
  if (cancelButton) {
    cancelButton.remove();
  }

  // Restore form ID
  DOM.form.element.id = "bookForm";
}

/**
 * Cancels current edit operation
 */
function cancelEdit() {
  resetForm();
  exitEditMode();
}

/**
 * Resets the form fields
 */
function resetForm() {
  DOM.form.title.value = "";
  DOM.form.author.value = "";
  DOM.form.year.value = "";
  DOM.form.status.checked = false;
}

/**
 * Renders all books in both lists
 */
function renderBooks() {
  // Clear existing content
  DOM.bookLists.unread.container.innerHTML = "";
  DOM.bookLists.read.container.innerHTML = "";

  // Render unread books
  bookshelf.unread.forEach((book) => {
    const bookElement = createBookElement(book);
    DOM.bookLists.unread.container.append(bookElement);
  });

  // Render read books
  bookshelf.read.forEach((book) => {
    const bookElement = createBookElement(book);
    DOM.bookLists.read.container.append(bookElement);
  });

  // Update counters
  DOM.bookLists.unread.count.innerText = `${bookshelf.unread.length} Books`;
  DOM.bookLists.read.count.innerText = `${bookshelf.read.length} Books`;
}

/**
 * Loads books from local storage
 */
function loadBooksFromStorage() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      bookshelf = JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Error loading from storage:", error);
    bookshelf = { unread: [], read: [] };
  }

  document.dispatchEvent(new Event(EVENTS.RENDER));
}

/**
 * Saves books to local storage
 */
function saveBooks() {
  if (!isStorageExist()) return;

  try {
    // Ensure books are in the correct arrays based on their status
    reorganizeBooks();

    // Render the book and Save to localStorage
    document.dispatchEvent(new Event(EVENTS.RENDER));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookshelf));
  } catch (error) {
    console.error("Error saving to storage:", error);
  }
}

/**
 * Reorganizes books into the correct arrays based on their status
 */
function reorganizeBooks() {
  const allBooks = [...bookshelf.unread, ...bookshelf.read];

  // Reset arrays
  bookshelf.unread = [];
  bookshelf.read = [];

  // Sort into correct arrays
  allBooks.forEach((book) => {
    if (book.isComplete) {
      bookshelf.read.push(book);
    } else {
      bookshelf.unread.push(book);
    }
  });
}

/**
 * Checks if browser supports local storage
 * @returns {boolean} - True if storage is supported
 */
function isStorageExist() {
  if (typeof localStorage === "undefined") {
    alert("Browser doesn't support local storage");
    return false;
  }
  return true;
}

/**
 * Creates a DOM element representing a book
 * @param {Object} bookObject - The book data
 * @returns {HTMLElement} - The book element
 */
function createBookElement(book) {
  // Create container
  const container = document.createElement("div");
  container.classList.add("book-item");
  container.setAttribute("data-bookid", book.id);
  container.setAttribute("data-testid", "bookItem");

  // Create book cover with random emoji
  const bookCover = createElementWithText("div", getRandomBookEmoji());
  bookCover.classList.add("book-cover");

  // Create book content container
  const bookContainer = document.createElement("div");
  bookContainer.classList.add("book-item__wrapper");

  // Create book details elements
  const titleElement = createElementWithAttributes("h3", {
    class: "book-item__title",
    "data-testid": "bookItemTitle",
    textContent: book.title,
  });

  const authorElement = createElementWithAttributes("p", {
    class: "book-item__author",
    "data-testid": "bookItemAuthor",
    textContent: `Writer: ${book.author}`,
  });

  const yearElement = createElementWithAttributes("p", {
    class: "book-item__year",
    "data-testid": "bookItemYear",
    textContent: `Year: ${book.year}`,
  });

  // Create action buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("book-item__action");

  // Create and set up buttons
  const buttons = [
    {
      text: book.isComplete ? "Unfinish Book" : "Finish Book",
      classes: ["book-item__button", "book-item__button--complete"],
      testId: "bookItemIsCompleteButton",
      action: () => toggleBookStatus(book.id),
    },
    {
      text: "Delete Book",
      classes: ["book-item__button", "book-item__button--delete"],
      testId: "bookItemDeleteButton",
      action: () => deleteBook(book.id),
    },
    {
      text: "Edit Book",
      classes: ["book-item__button", "book-item__button--edit"],
      testId: "bookItemEditButton",
      action: () => enterEditMode(book.id),
    },
  ];

  // Add all buttons
  buttons.forEach((buttonInfo) => {
    const button = createElementWithText("button", buttonInfo.text);
    button.classList.add(...buttonInfo.classes);
    button.setAttribute("data-testid", buttonInfo.testId);
    button.addEventListener("click", buttonInfo.action);
    buttonContainer.appendChild(button);
  });

  // Assemble the book element
  bookContainer.append(
    titleElement,
    authorElement,
    yearElement,
    buttonContainer,
  );
  container.append(bookCover, bookContainer);

  return container;
}

/**
 * Helper to create element with multiple attributes
 * @param {string} tag - Element tag
 * @param {Object} attributes - Key-value pairs of attributes
 * @returns {HTMLElement} - New element with attributes
 */
function createElementWithAttributes(tag, attributes) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === "textContent") {
      element.textContent = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  return element;
}

/**
 * Returns a random book emoji
 * @returns {string} - Random book emoji
 */
function getRandomBookEmoji() {
  const bookEmojis = ["📓", "📗", "📕", "📙", "📘", "📔"];
  const randomIndex = Math.floor(Math.random() * bookEmojis.length);
  return bookEmojis[randomIndex];
}

/**
 * Generates a unique ID
 * @returns {number} - Timestamp-based ID
 */
function generateId() {
  return +new Date();
}

/**
 * Deletes a book by ID
 * @param {number} bookId - The ID of the book to delete
 */
function deleteBook(bookId) {
  // Remove from appropriate array
  bookshelf.unread = bookshelf.unread.filter((book) => book.id !== bookId);
  bookshelf.read = bookshelf.read.filter((book) => book.id !== bookId);

  document.dispatchEvent(new Event(EVENTS.RENDER));
  saveBooks();
}

/**
 * Toggles the status of a book between read and unread
 * @param {number} bookId - The ID of the book to toggle
 */
function toggleBookStatus(bookId) {
  // Find the book in either array
  let book = findBookById(bookId);

  if (book) {
    // Toggle the status
    book.isComplete = !book.isComplete;
    document.dispatchEvent(new Event(EVENTS.RENDER));
    saveBooks();
  }
}

/**
 * Finds a book by ID in either the read or unread arrays
 * @param {number} bookId - The ID of the book to find
 * @returns {Object|null} - The book object or null if not found
 */
function findBookById(bookId) {
  // Check unreadbook first
  let book = bookshelf.unread.find((book) => book.id === bookId);

  // If not found in unread, check read books
  if (!book) {
    book = bookshelf.read.find((book) => book.id === bookId);
  }

  return book || null;
}

// Initialize the application
init();
