// Firebase configuration
const firebaseConfig = {
  apiKey: "<KEY>",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = firebase.firestore();

// Initialize Firebase Storage
const storage = firebase.storage();
const storageRef = storage.ref();

// Function to generate a unique product ID
function generateProductId() {
  // Generate a random 6-character string
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let productId = "";

  for (let i = 0; i < 6; i++) {
    productId += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return productId;
}

// Function to render products in the productContainer
function renderProducts(products) {
  const productContainer = document.querySelector(".productContainer");
  productContainer.innerHTML = "";

  // Sort products based on the first letter of productName
  products.sort((a, b) => {
    const productNameA = a.data().productName.toLowerCase();
    const productNameB = b.data().productName.toLowerCase();

    if (productNameA < productNameB) {
      return -1;
    } else if (productNameA > productNameB) {
      return 1;
    } else {
      return 0;
    }
  });

  products.forEach((product) => {
    const { id, productName, productPrice, productImage } = product.data();

    const productBox = document.createElement("div");
    productBox.className = "productBox";
    productBox.dataset.productId = product.id; // Set the dataset attribute to product.id
    productBox.innerHTML = `
      <div class="productImage">
        <img src="${productImage}" alt="">
      </div>
      <div class="productContent">
        <h1>${productName}</h1>
        <p>${productPrice}</p>
        <div class="buttonProduct">
          <button class="editButton" data-product-id="${product.id}">Edit Product</button>
          <button class="deleteProduct">Delete Product</button>
        </div>
      </div>
    `;

    productContainer.appendChild(productBox);
  });
}

// Add an event listener for the Add Product form submission
document
  .getElementById("addProductForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    const productName = document.getElementById("productName").value;
    const productPrice = document.getElementById("productPrice").value;
    const productImage = document.getElementById("productImage").files[0];

    console.log("Add Product Name:", productName);
    console.log("Add Product Price:", productPrice);

    if (productName && productPrice) {
      const productData = {
        productName,
        productPrice,
      };

      if (productImage) {
        const reader = new FileReader();

        reader.onload = () => {
          const productContainer = document.querySelector(".productContainer");

          const productBox = document.createElement("div");
          productBox.className = "productBox";

          const productId = generateProductId(); // Generate a unique product ID
          productBox.dataset.productId = productId;

          productBox.innerHTML = `
          <div class="productImage">
            <img src="${reader.result}" alt="">
          </div>
          <div class="productContent">
            <h1>${productName}</h1>
            <p>${productPrice}</p>
            <div class="buttonProduct">
              <button class="editButton" data-product-id="${productId}">Edit Product</button>
              <button class="deleteProduct">Delete Product</button>
            </div>
          </div>
        `;

          productContainer.appendChild(productBox);

          // Upload the product image to Firebase Storage
          const uploadTask = storageRef
            .child(`product_images/${productId}`)
            .put(productImage);

          uploadTask.on(
            "state_changed",
            null,
            (error) => {
              console.error("Error uploading product image:", error);
            },
            () => {
              uploadTask.snapshot.ref
                .getDownloadURL()
                .then((downloadURL) => {
                  productData.productImage = downloadURL;

                  // Add the product data to Firestore
                  db.collection("products")
                    .doc(productId)
                    .set(productData)
                    .then(() => {
                      console.log("Product added to Firestore");
                      document.getElementById("addProductForm").reset();
                    })
                    .catch((error) => {
                      console.error(
                        "Error adding product to Firestore:",
                        error
                      );
                    });
                })
                .catch((error) => {
                  console.error(
                    "Error retrieving product image download URL:",
                    error
                  );
                });
            }
          );
        };

        reader.onerror = (error) => {
          console.error("Error reading product image:", error);
        };

        reader.readAsDataURL(productImage);
      } else {
        console.error("No product image selected");
      }
    } else {
      console.error("Please fill in all required fields");
    }
  });

// Function to scroll to the "Edit Product" section
function scrollToEditSection() {
  const editSection = document.getElementById("editSection");
  editSection.scrollIntoView({ behavior: "smooth" });
}

// Add an event listener for Edit button
document.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("editButton")) {
    const productBox = target.closest(".productBox");
    const productId = productBox.dataset.productId;
    const productName = productBox.querySelector("h1").textContent;
    const productPrice = productBox.querySelector("p").textContent;
    const productImage = productBox.querySelector("img").src;

    const editContainer = document.getElementById("editSection");
    const editProductName = editContainer.querySelector("#editProductName");
    const editProductPrice = editContainer.querySelector("#editProductPrice");
    const editProductImage = editContainer.querySelector("#editProductImage");
    const editProductPreview = editContainer.querySelector(
      "#editProductPreview"
    );

    editProductName.value = productName;
    editProductPrice.value = productPrice;
    editProductImage.value = "";
    editProductPreview.src = productImage;

    const editProductButton = editContainer.querySelector("#editProduct");
    editProductButton.dataset.productId = productId;

    // Scroll to the "Edit Product" section
    scrollToEditSection();
    editContainer.classList.add("show");
  } else if (target.classList.contains("deleteProduct")) {
    const productBox = target.closest(".productBox");
    const productId = productBox.dataset.productId;

    // Delete the product from Firestore
    db.collection("products")
      .doc(productId)
      .delete()
      .then(() => {
        console.log("Product deleted from Firestore");
        productBox.remove();
      })
      .catch((error) => {
        console.error("Error deleting product from Firestore:", error);
      });
  }
});

// Function to scroll to the product with the specified productId
function scrollToProduct(productId) {
  const productContainer = document.querySelector(".productContainer");
  const productBox = productContainer.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (productBox) {
    productBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Add an event listener for Update Product button
document.getElementById("editProduct").addEventListener("click", () => {
  const editProductButton = document.getElementById("editProduct");
  const productId = editProductButton.dataset.productId;
  const editProductName = document.querySelector("#editProductName").value;
  const editProductPrice = document.querySelector("#editProductPrice").value;
  const editProductImage = document.querySelector("#editProductImage").files[0];

  console.log("Product ID:", productId);
  console.log("Edit Product Name:", editProductName);
  console.log("Edit Product Price:", editProductPrice);

  if (productId) {
    const productData = {
      productName: editProductName,
      productPrice: editProductPrice,
    };

    if (editProductImage) {
      const reader = new FileReader();

      reader.onload = () => {
        const productContainer = document.querySelector(".productContainer");
        const productBox = productContainer.querySelector(
          `[data-product-id="${productId}"]`
        );
        const productNameElement = productBox.querySelector("h1");
        const productPriceElement = productBox.querySelector("p");
        const productImageElement = productBox.querySelector("img");

        productNameElement.textContent = editProductName;
        productPriceElement.textContent = editProductPrice;
        productImageElement.src = reader.result;

        const uploadTask = storageRef
          .child(`product_images/${productId}`)
          .put(editProductImage);

        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Error uploading product image:", error);
          },
          () => {
            uploadTask.snapshot.ref
              .getDownloadURL()
              .then((downloadURL) => {
                productData.productImage = downloadURL;

                // Update the product data in Firestore
                db.collection("products")
                  .doc(productId)
                  .update(productData)
                  .then(() => {
                    console.log("Product updated in Firestore");
                    const editContainer =
                      document.getElementById("editSection");
                    editContainer.classList.remove("show");

                    // Scroll to the updated product
                    scrollToProduct(productId);
                  })
                  .catch((error) => {
                    console.error(
                      "Error updating product in Firestore:",
                      error
                    );
                  });
              })
              .catch((error) => {
                console.error(
                  "Error retrieving product image download URL:",
                  error
                );
              });
          }
        );
      };

      reader.onerror = (error) => {
        console.error("Error reading product image:", error);
      };

      reader.readAsDataURL(editProductImage);
    } else {
      // Update the product data in Firestore
      db.collection("products")
        .doc(productId)
        .update(productData)
        .then(() => {
          console.log("Product updated in Firestore");
          const productContainer = document.querySelector(".productContainer");
          const productBox = productContainer.querySelector(
            `[data-product-id="${productId}"]`
          );
          const productNameElement = productBox.querySelector("h1");
          const productPriceElement = productBox.querySelector("p");

          productNameElement.textContent = editProductName;
          productPriceElement.textContent = editProductPrice;

          const editContainer = document.getElementById("editSection");
          editContainer.classList.remove("show");

          // Scroll to the updated product
          scrollToProduct(productId);
        })
        .catch((error) => {
          console.error("Error updating product in Firestore:", error);
        });
    }
  } else {
    console.error("Invalid product ID");
  }
});

// Listen for changes in the Firestore collection
db.collection("products").onSnapshot((snapshot) => {
  const products = snapshot.docs;
  renderProducts(products);
});

// Add an event listener for Back To Dashboard button
document.getElementById("toDashboard").addEventListener("click", () => {
  // Redirect to the dashboard page
  window.location.href = "dashboard.html";
});
