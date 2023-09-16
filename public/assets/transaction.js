// Firebase configuration
const firebaseConfig = {
  apiKey: "<KEY>",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = firebase.firestore();

// Get references to the HTML elements
const selectDateButton = document.getElementById("selectDate");
const dateRangeDiv = document.getElementById("dateRange");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const applyDateRangeButton = document.getElementById("applyDateRange");
const customerTransactionBody = document.getElementById(
  "customerTransactionBody"
);
const transactionListBody = document.getElementById("transactionListBody");
const tableEvaluationBody = document.getElementById("tableEvaluationBody");
const totalPriceElement = document.getElementById("totalPrice");

// Add event listener to the selectDateButton
selectDateButton.addEventListener("click", function () {
  dateRangeDiv.style.display = "block";
});

// Add event listener to the applyDateRangeButton
applyDateRangeButton.addEventListener("click", function () {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!startDate || !endDate) {
    console.error("Please select both start and end dates");
    return;
  }

  displayTransactionReports(startDate, endDate);
});

// Function to display transaction reports
function displayTransactionReports(startDate, endDate) {
  // Clear previous data
  clearTable(customerTransactionBody);
  clearTable(transactionListBody);
  clearTable(tableEvaluationBody);

  // Fetch transaction data from Firebase
  db.collection("metadata")
    .where(firebase.firestore.FieldPath.documentId(), ">=", startDate)
    .where(firebase.firestore.FieldPath.documentId(), "<=", endDate)
    .get()
    .then((querySnapshot) => {
      let allTransactions = {}; // Store all transactions

      const promises = []; // Array to store promises

      querySnapshot.forEach((doc) => {
        const date = doc.id;

        const promise = db
          .collection("metadata")
          .doc(date)
          .collection("customers")
          .get()
          .then((customersSnapshot) => {
            customersSnapshot.forEach((customerDoc) => {
              const customerName = customerDoc.id;
              const transaction = customerDoc.data().transaction;

              // Create table row for each customer
              const row = document.createElement("tr");
              row.innerHTML = `
                <td>${date}</td>
                <td class="customerName">${customerName}</td>
                <td>${countTotalProducts(transaction)}</td>
                <td>Rp ${calculateTotalPrice(transaction).toLocaleString()}</td>
              `;
              customerTransactionBody.appendChild(row);

              // Add event listener to customer name link
              const customerNameLink = row.querySelector(".customerName");
              customerNameLink.addEventListener("click", function () {
                showTransactionList(customerName, transaction);
              });

              // Merge transaction data for all transactions
              for (const productName in transaction) {
                if (!allTransactions[productName]) {
                  allTransactions[productName] = {
                    price: transaction[productName].price,
                    quantity: transaction[productName].quantity,
                  };
                } else {
                  allTransactions[productName].quantity +=
                    transaction[productName].quantity;
                }
              }
            });
          });

        promises.push(promise);
      });

      // Wait for all promises to resolve
      Promise.all(promises)
        .then(() => {
          // Calculate the total price of all products
          const totalProductPrices =
            calculateTotalProductPrices(allTransactions);

          // Display the total price of all products
          displayTotalProductPrices(totalProductPrices);

          // Sort products by sales count
          const sortedProducts = Object.entries(allTransactions).sort(
            (a, b) => b[1].quantity - a[1].quantity
          );

          // Display highest sales products
          displayHighestSalesProducts(sortedProducts);

          // Display lowest sales products
          displayLowestSalesProducts(sortedProducts);

          // Evaluation section
          evaluateAdminSection(sortedProducts);
        })
        .catch((error) => {
          console.error("Error fetching transaction data:", error);
        });
    });
}

// Function to clear table rows
function clearTable(tableBody) {
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

// Function to calculate total price in transaction data
function calculateTotalPrice(transactionData) {
  let totalPrice = 0;
  for (const productName in transactionData) {
    const { price, quantity } = transactionData[productName];
    totalPrice += price * quantity;
  }
  return totalPrice;
}

// Function to count total products in a transaction
function countTotalProducts(transaction) {
  let totalProducts = 0;

  for (const productName in transaction) {
    const { quantity } = transaction[productName];
    totalProducts += quantity;
  }

  return totalProducts;
}

// Function to calculate total product prices
function calculateTotalProductPrices(allTransactions) {
  let totalProductPrices = 0;
  for (const productName in allTransactions) {
    const product = allTransactions[productName];
    if (product && product.price && product.quantity) {
      const { price, quantity } = product;
      totalProductPrices += price * quantity;
    }
  }
  return totalProductPrices;
}

// Function to display the total product prices
function displayTotalProductPrices(totalProductPrices) {
  const totalProductPricesRow = document.createElement("tr");
  totalProductPricesRow.innerHTML = `
    <td colspan="3">All Product Prices</td>
    <td>Rp ${totalProductPrices.toLocaleString()}</td>
  `;
  customerTransactionBody.appendChild(totalProductPricesRow);
}

// Function to evaluate reports section
function evaluateAdminSection(sortedProducts) {
  const evaluationBody = document.getElementById("tableEvaluationBody");

  const evaluationTitleRow = document.createElement("tr");
  const evaluationTitleCell = document.createElement("th");
  evaluationTitleCell.colSpan = 3;
  evaluationTitleCell.textContent = "Top Product";
  evaluationTitleRow.appendChild(evaluationTitleCell);
  evaluationBody.appendChild(evaluationTitleRow);

  const highestSalesRow = document.createElement("tr");
  highestSalesRow.innerHTML = `
    <td>With Highest Sales</td>
    <td>${sortedProducts[0][1].quantity}</td>
    <td>${sortedProducts[0][0]}</td>
  `;
  evaluationBody.appendChild(highestSalesRow);

  const lowestSalesRow = document.createElement("tr");
  lowestSalesRow.innerHTML = `
    <td>With Lowest Sales</td>
    <td>${sortedProducts[sortedProducts.length - 1][1].quantity}</td>
    <td>${sortedProducts[sortedProducts.length - 1][0]}</td>
  `;
  evaluationBody.appendChild(lowestSalesRow);
}

// Function to display the highest sales products
function displayHighestSalesProducts(sortedProducts) {
  const highestSalesBody = document.getElementById("tableEvaluationBody");
  clearTable(highestSalesBody);

  const highestSalesTitleRow = document.createElement("tr");
  const highestSalesTitleCell = document.createElement("th");
  highestSalesTitleCell.colSpan = 3;
  highestSalesTitleCell.textContent = "Highest Sales";
  highestSalesTitleRow.appendChild(highestSalesTitleCell);
  highestSalesBody.appendChild(highestSalesTitleRow);

  for (let i = 0; i < sortedProducts.length && i < 5; i++) {
    const [productName, productData] = sortedProducts[i];
    const { price, quantity } = productData;
    const totalSales = price * quantity;

    const productRow = document.createElement("tr");
    productRow.innerHTML = `
      <td>${productName}</td>
      <td>${quantity}</td>
      <td>Rp ${totalSales.toLocaleString()}</td>
    `;
    highestSalesBody.appendChild(productRow);
  }
}

// Function to display the lowest sales products
function displayLowestSalesProducts(sortedProducts) {
  const lowestSalesBody = document.getElementById("tableEvaluationBody");

  const lowestSalesTitleRow = document.createElement("tr");
  const lowestSalesTitleCell = document.createElement("th");
  lowestSalesTitleCell.colSpan = 3;
  lowestSalesTitleCell.textContent = "Lowest Sales";
  lowestSalesTitleRow.appendChild(lowestSalesTitleCell);
  lowestSalesBody.appendChild(lowestSalesTitleRow);

  for (
    let i = sortedProducts.length - 1;
    i >= sortedProducts.length - 5 && i >= 0;
    i--
  ) {
    const [productName, productData] = sortedProducts[i];
    const { price, quantity } = productData;
    const totalSales = price * quantity;

    const productRow = document.createElement("tr");
    productRow.innerHTML = `
      <td>${productName}</td>
      <td>${quantity}</td>
      <td>Rp ${totalSales.toLocaleString()}</td>
    `;
    lowestSalesBody.appendChild(productRow);
  }
}

// Function to show transaction list for a customer
function showTransactionList(customerName, transactionData) {
  // Clear previous data
  clearTable(transactionListBody);

  let totalProducts = 0; // Variable to store total products

  // Iterate over transaction data for the selected customer
  for (const productName in transactionData) {
    const { price, quantity } = transactionData[productName];
    const totalPrice = price * quantity;

    totalProducts += quantity; // Calculate total products

    // Create table row for each transaction
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${customerName}</td>
      <td>${productName}</td>
      <td>${quantity}</td>
      <td>Rp ${price.toLocaleString()}</td>
      <td>Rp ${totalPrice.toLocaleString()}</td>
    `;
    transactionListBody.appendChild(row);
  }

  // Show the transactionList section
  const transactionListSection = document.querySelector(".transactionList");
  transactionListSection.style.display = "block";
}

// Add event listener to the Back to Dashboard button
const toDashboardButton = document.getElementById("toDashboard");
toDashboardButton.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});
