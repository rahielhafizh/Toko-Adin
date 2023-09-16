// Firebase configuration
const firebaseConfig = {
  apiKey: "<KEY>",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = firebase.firestore();

// Cart functionality
const cartButtons = document.querySelectorAll(".cart-btn");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");

let selectedDate = null; // Initialize selectedDate variable
let customerName = ""; // Initialize customerName variable

// Add event listeners to cart buttons
cartButtons.forEach((button) => {
  button.addEventListener("click", toggleCartAction);
});

// Add event listener to remove buttons
const removeButtons = document.querySelectorAll(
  ".cart-items .remove-from-cart"
);

removeButtons.forEach((button) => {
  button.addEventListener("click", function (e) {
    decreaseQuantity(e);
  });
});

// Remove initial product from cart
document.addEventListener("DOMContentLoaded", function () {
  const initialCartItem = cartItems.querySelector(".cart-items");
  if (initialCartItem) {
    initialCartItem.remove();
  }
});

// Add a click event listener to the "Select Date" button
const selectTodayButton = document.getElementById("selectToday");
selectTodayButton.addEventListener("click", function () {
  const startDateInput = document.getElementById("startDate");
  selectedDate = startDateInput.value.trim();

  if (!selectedDate) {
    console.error("No date selected");
    return; // Skip updating the date if no date is selected
  }

  // Update the Firebase database with the selected date and initialize transaction data
  const dateDocRef = db.collection("metadata").doc(selectedDate);
  dateDocRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        // Create a new document in the "metadata" collection with the selected date as the document ID
        return dateDocRef.set({ transaction: {} });
      }
    })
    .then(() => {
      console.log("Selected date stored in Firestore:", selectedDate);
    })
    .catch((error) => {
      console.error("Error retrieving/storing selected date:", error);
    });
});

// Add a click event listener to the "Apply Name" button in the "inputCustomer" section
const selectCustomerButton = document.getElementById("selectCustomer");
selectCustomerButton.addEventListener("click", function () {
  const customerNameInput = document.getElementById("customerName");
  customerName = customerNameInput.value.trim();

  if (!customerName) {
    console.error("No customer name entered");
    return; // Skip adding the customer if no name is entered
  }

  // Update the Firebase database with the customer name and transaction data
  const customerDocRef = db
    .collection("metadata")
    .doc(selectedDate)
    .collection("customers")
    .doc(customerName);
  customerDocRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        console.log("Customer already exists:", customerName);
      } else {
        const customerData = {}; // Empty object
        return customerDocRef.set(customerData);
      }
    })
    .then(() => {
      console.log(
        "Customer name and transaction added for customer:",
        customerName
      );
      // Clear the customer name input field after successful addition
      customerNameInput.value = "";
    })
    .catch((error) => {
      console.error("Error adding customer name and transaction:", error);
    });
});

// Add event listeners to quantity and remove buttons
function addCartListeners() {
  const decreaseButtons = cartItems.querySelectorAll(".decrease-quantity");
  const increaseButtons = cartItems.querySelectorAll(".increase-quantity");
  const removeButtons = cartItems.querySelectorAll(".remove-from-cart");

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", decreaseQuantity);
  });

  increaseButtons.forEach((button) => {
    button.addEventListener("click", increaseQuantity);
  });

  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      decreaseQuantity(button.dataset.name);
    });
  });
}

// Function to update the cart total
function updateCartTotal() {
  const cartItemContainers = cartItems.querySelectorAll(".cart-item");
  let total = 0;

  cartItemContainers.forEach((cartItem) => {
    const quantity = parseInt(cartItem.querySelector(".quantity").textContent);
    const price = parseFloat(
      cartItem.querySelector(".price").textContent.replace("Rp", "")
    );
    const itemTotal = quantity * price;
    total += itemTotal;
  });

  cartTotal.textContent = `Rp ${total.toFixed(0)}`;
}

// Function to toggle the cart action (add to cart or remove from cart)
function toggleCartAction(e) {
  e.preventDefault();
  const productBox = e.target.closest(".box");
  const productName = productBox.querySelector("h3").textContent;
  const productImage = productBox.querySelector("img").src;
  const productPrice = parseFloat(
    productBox.querySelector(".price").textContent.replace("Rp", "")
  );
  const isRemoveAction = e.target.classList.contains("remove-from-cart");

  if (isRemoveAction) {
    removeFromCart(productName);
  } else {
    if (!selectedDate) {
      console.error("No selected date");
      return; // Skip adding the product to the cart if no date is selected
    }
    addToCart(productName, productPrice, productImage);
  }

  updateCartTotal();
}

// Function to add a product to the cart
function addToCart(productName, productPrice, productImage) {
  // Check if the product is already in the cart
  const existingCartItem = cartItems.querySelector(
    `[data-name="${productName}"]`
  );

  if (existingCartItem) {
    const quantityElement = existingCartItem.querySelector(".quantity");
    const quantity = parseInt(quantityElement.textContent) + 1;
    quantityElement.textContent = quantity;
  } else {
    // Create a new cart item element
    const newCartItem = document.createElement("div");
    newCartItem.classList.add("cart-item");
    newCartItem.setAttribute("data-name", productName);
    newCartItem.innerHTML = `
      <img src="${productImage}" alt="">
      <div class="cart-item-details">
        <h4>${productName}</h4>
        <h4 class="price">Rp ${productPrice.toFixed(0)}</h4>
      </div>
      <div class="cart-item-quantity">
        <span class="decrease-quantity"><i class="fas fa-chevron-left"></i></span>
        <span class="quantity">1</span>
        <span class="increase-quantity"><i class="fas fa-chevron-right"></i></span>
      </div>
      <span class="remove-from-cart"></span>
    `;

    // Append the new cart item to the cart items container
    cartItems.appendChild(newCartItem);
  }

  addCartListeners();
}

// Function to decrease the quantity of a cart item
function decreaseQuantity(e) {
  const productName = e.target.dataset.name;
  const cartItem = cartItems.querySelector(`[data-name="${productName}"]`);
  const quantityElement = cartItem.querySelector(".quantity");
  let quantity = parseInt(quantityElement.textContent);

  if (quantity >= 1) {
    quantity--;
    quantityElement.textContent = quantity;
    updateCartTotal();
  }
}

// Function to increase the quantity of a cart item
function increaseQuantity(e) {
  const productName = e.target.dataset.name;
  const cartItem = cartItems.querySelector(`[data-name="${productName}"]`);
  const quantityElement = cartItem.querySelector(".quantity");
  let quantity = parseInt(quantityElement.textContent);
  quantity++;
  quantityElement.textContent = quantity;
  updateCartTotal();
}

// Function to remove a product from the cart
function removeFromCart(productName) {
  const cartItem = cartItems.querySelector(`[data-name="${productName}"]`);

  if (cartItem) {
    const quantityElement = cartItem.querySelector(".quantity");
    let quantity = parseInt(quantityElement.textContent);

    if (quantity > 1) {
      quantity--;
      quantityElement.textContent = quantity;
    } else {
      cartItem.remove();
    }

    updateCartTotal();
  } else {
    console.error("No cart item found");
  }
}

// Show/hide cart
const cartButton = document.querySelector(".show-cart");
const cartSection = document.getElementById("cart-section");
const closeCartButton = document.querySelector(".close-cart");

cartButton.addEventListener("click", toggleCart);
closeCartButton.addEventListener("click", closeCart);

function toggleCart() {
  cartSection.classList.toggle("show");
}

function closeCart() {
  cartSection.classList.remove("show");
}

// Clear Cart Button
const clearCartButton = document.querySelector(".clear-cart");
clearCartButton.addEventListener("click", clearCart);

// Function to clear the cart
function clearCart() {
  cartItems.innerHTML = "";
  updateCartTotal();
}

// Check Out Button
const checkoutButton = document.querySelector(".checkout");
checkoutButton.addEventListener("click", addCartToDatabase);

// Function to add the cart transaction to the database
function addCartToDatabase() {
  const cartItemsData = [];

  const cartItemElements = document.querySelectorAll(".cart-item");
  cartItemElements.forEach((cartItem) => {
    const productName = cartItem.querySelector("h4").textContent;
    const productPrice = parseFloat(
      cartItem.querySelector(".price").textContent.replace("Rp ", "")
    );
    const productQuantity = parseInt(
      cartItem.querySelector(".quantity").textContent
    );
    const productImage = cartItem.querySelector("img").src;

    cartItemsData.push({
      name: productName,
      price: productPrice,
      quantity: productQuantity,
      image: productImage,
    });
  });

  // Update the Firebase database with the cart transaction data
  const dateDocRef = db.collection("metadata").doc(selectedDate);
  const customerDocRef = dateDocRef.collection("customers").doc(customerName);

  customerDocRef
    .get()
    .then((doc) => {
      let transactionData = {};

      if (doc.exists) {
        transactionData = doc.data().transaction || {};
      }

      cartItemsData.forEach((item) => {
        transactionData[item.name] = {
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        };
      });

      return customerDocRef.set(
        {
          transaction: transactionData,
        },
        { merge: true } // Use merge option to update the document instead of overwriting it
      );
    })
    .then(() => {
      console.log("Cart transaction added for customer:", customerName);
      return dateDocRef.update({
        customers: firebase.firestore.FieldValue.delete(),
      });
    })
    .then(() => {
      console.log("Cart transaction updated in Firestore");
      // Clear the cart and update the total
      clearCart();
    })
    .catch((error) => {
      console.error("Error adding cart transaction:", error);
    });
}

// Get a reference to the button element
const productManagement = document.getElementById("productManagement");
const transactionButton = document.getElementById("transactionButton");

// Add a click event listener to the Product button
productManagement.addEventListener("click", function () {
  // Redirect to the product management page
  window.location.href = "product.html";
});

// Add a click event listener to the Transaction button
transactionButton.addEventListener("click", function () {
  // Redirect to the transaction page
  window.location.href = "transaction.html";
});

// Fetch products from Firestore and display them on the page
db.collection("products")
  .orderBy("productName") // Sort products by name
  .onSnapshot((querySnapshot) => {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = ""; // Clear existing products

    const sortedProducts = []; // Store sorted products with array

    querySnapshot.forEach((doc) => {
      const product = doc.data();
      sortedProducts.push(product);
    });

    // Sort products by the first letter of the product name alphabetically
    sortedProducts.sort((a, b) => {
      const productNameA = a.productName.toUpperCase();
      const productNameB = b.productName.toUpperCase();
      if (productNameA < productNameB) {
        return -1;
      }
      if (productNameA > productNameB) {
        return 1;
      }
      return 0;
    });

    sortedProducts.forEach((product) => {
      const productBox = createProductBox(product);
      productContainer.appendChild(productBox);
    });

    // Add event listeners to cart buttons after products are loaded
    const updatedCartButtons = document.querySelectorAll(".cart-btn");
    updatedCartButtons.forEach((button) => {
      button.addEventListener("click", toggleCartAction);
    });
  });

// Function to create a product box
function createProductBox(product) {
  const productBox = document.createElement("div");
  productBox.classList.add("box");
  const productPrice = parseFloat(product.productPrice || 0);
  const formattedPrice = isNaN(productPrice)
    ? "0"
    : `Rp ${productPrice.toFixed()}`;
  productBox.innerHTML = `
    <img src="${product.productImage}" alt="">
    <h3>${product.productName}</h3>
    <h4 class="price">${formattedPrice}</h4>
    <div class="buttonbox">
      <button class="cart-btn add-to-cart">Add to Cart</button>
      <button class="cart-btn remove-from-cart">Remove from Cart</button>
    </div>
  `;
  return productBox;
}

// Set today's date as the selected date
selectedDate = getCurrentDate();
document.getElementById("startDate").value = selectedDate;

// Update the Firebase database with the selected date and initialize transaction data
const dateDocRef = db.collection("metadata").doc(selectedDate);
dateDocRef
  .get()
  .then((doc) => {
    if (!doc.exists) {
      // Create a new document in the "metadata" collection with the selected date as the document ID
      return dateDocRef.set({ transaction: {} });
    }
  })
  .then(() => {
    console.log("Selected date stored in Firestore:", selectedDate);
  })
  .catch((error) => {
    console.error("Error retrieving/storing selected date:", error);
  });

// Function to get the current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Add a click event listener to the "productSearch" button in the "searchProduct" section
const productSearchButton = document.getElementById("productSearch");
productSearchButton.addEventListener("click", function () {
  const searchProductNameInput = document.getElementById("searchProductName");
  const searchQuery = searchProductNameInput.value.trim().toLowerCase();

  if (!searchQuery) {
    console.error("No search query entered");
    return; // Skip searching if no query is entered
  }

  const productContainers = document.querySelectorAll(".box");
  let productFound = false;

  productContainers.forEach((productContainer) => {
    const productName = productContainer
      .querySelector("h3")
      .textContent.toLowerCase();

    if (productName.includes(searchQuery)) {
      productFound = true;
      productContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  if (!productFound) {
    console.log("Product not found");
  }

  // Clear the product search input field after successful search
  searchProductNameInput.value = "";
});

// Function to scroll to the top of the page
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
