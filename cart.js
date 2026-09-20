// ==========================================================
// NextSprout - Shared Cart System
// ==========================================================
// This file controls the cart across ALL NextSprout pages.
//
// IMPORTANT:
// Every page should:
// 1. Load this file:
//    <script src="cart.js"></script>
//
// 2. Use:
//    onclick="addToCart('product-id')"
//
// 3. Use either:
//    <span data-cart-count>0</span>
//    OR
//    <span id="cartCount">0</span>
//
// 4. If the page has a cart drawer, it should contain:
//    cartOverlay
//    cartDrawer
//    cartItems
//    cartTotal
//    checkoutButton
// ==========================================================


// ==========================================================
// STORAGE KEY
// ==========================================================

const CART_STORAGE_KEY = "nextsprout_cart";


// ==========================================================
// NEXTSPROUT PRODUCTS
// ==========================================================

const NEXTSPROUT_PRODUCTS = {

    // ------------------------------------------------------
    // E-BOOKS
    // ------------------------------------------------------

    "ebook-reading-7day": {
        id: "ebook-reading-7day",
        name: "7-Day Reading Challenge",
        price: 129,
        type: "ebook",
        billing: "one-time"
    },

    "ebook-learning-activities": {
        id: "ebook-learning-activities",
        name: "25 Activities to Make Learning Fun",
        price: 149,
        type: "ebook",
        billing: "one-time"
    },

    "ebook-speak-confidence": {
        id: "ebook-speak-confidence",
        name: "Speak English With Confidence",
        price: 199,
        type: "ebook",
        billing: "one-time"
    },

    "ebook-everyday-english-work": {
        id: "ebook-everyday-english-work",
        name: "Everyday English at Work",
        price: 29,
        type: "ebook",
        billing: "one-time"
    },

    "ebook-screen-free-activities": {
        id: "ebook-screen-free-activities",
        name: "50 Screen-Free Activities for Kids",
        price: 29,
        type: "ebook",
        billing: "one-time"
    },


    // ------------------------------------------------------
    // ENGLISH SPEAKING PROGRAMS
    // ------------------------------------------------------

    "program-english-kids": {
        id: "program-english-kids",
        name: "Everyday English For Kids",
        price: 99,
        type: "program",
        billing: "monthly"
    },

    "program-english-adults": {
        id: "program-english-adults",
        name: "Everyday English For Adults",
        price: 99,
        type: "program",
        billing: "monthly"
    },


    // ------------------------------------------------------
    // HOMEWORK SUPPORT
    // ------------------------------------------------------

    "program-homework-chat": {
        id: "program-homework-chat",
        name: "Homework Chat Support",
        price: 49,
        type: "service",
        billing: "one-time"
    },

    "program-homework-video": {
        id: "program-homework-video",
        name: "Homework Video Call Support",
        price: 149,
        type: "service",
        billing: "one-time"
    },


    // ------------------------------------------------------
    // READING PROGRAMS
    // ------------------------------------------------------

    "basics-reading": {
        id: "basics-reading",
        name: "Basics Reading Program",
        price: 199,
        type: "program",
        billing: "monthly"
    },

    "confident-reading": {
        id: "confident-reading",
        name: "Confident in Reading Program",
        price: 249,
        type: "program",
        billing: "monthly"
    },


    // ------------------------------------------------------
    // MATHS / LEARNING PROGRAMS
    // ------------------------------------------------------

    "learning-grade-3": {
        id: "learning-grade-3",
        name: "Grade 3 Maths Program",
        price: 199,
        type: "program",
        billing: "monthly"
    },


    // ------------------------------------------------------
    // COMPUTER SKILLS PROGRAMS
    // ------------------------------------------------------

    "computer-kids-school-support": {
        id: "computer-kids-school-support",
        name: "Kids - School Syllabus Support (Computer)",
        price: 199,
        type: "program",
        billing: "monthly"
    },

    "computer-kids-basics": {
        id: "computer-kids-basics",
        name: "Kids - Basics Computer Knowledge",
        price: 999,
        type: "program",
        billing: "one-time"
    },

    "computer-adults-basics": {
        id: "computer-adults-basics",
        name: "Adults - Basics Computer Knowledge",
        price: 299,
        type: "program",
        billing: "one-time"
    }

};


// ==========================================================
// GET CART
// ==========================================================

function getCart() {

    try {

        const savedCart =
            localStorage.getItem(CART_STORAGE_KEY);

        if (!savedCart) {
            return [];
        }

        const cart = JSON.parse(savedCart);

        if (!Array.isArray(cart)) {
            return [];
        }

        return cart;

    } catch (error) {

        console.error(
            "Unable to load cart:",
            error
        );

        return [];

    }

}


// ==========================================================
// SAVE CART
// ==========================================================

function saveCart(cart) {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Unable to save cart:",
            error
        );

    }

}


// ==========================================================
// ADD TO CART
// ==========================================================

function addToCart(productId) {

    const product =
        NEXTSPROUT_PRODUCTS[productId];


    // Product doesn't exist
    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        return;

    }


    const cart = getCart();


    // Check whether product already exists
    const alreadyExists =
        cart.some(
            item => item.id === product.id
        );


    // Don't add duplicate product
    if (alreadyExists) {

        updateCart();

        openCart();

        return;

    }


    // Add product
    cart.push({

        id: product.id,

        name: product.name,

        price: product.price,

        type: product.type,

        billing: product.billing

    });


    // Save to localStorage
    saveCart(cart);


    // Update cart count
    updateCart();


    // Open cart
    openCart();

}


// ==========================================================
// REMOVE FROM CART
// ==========================================================

function removeFromCart(productId) {

    let cart = getCart();


    cart = cart.filter(
        item => item.id !== productId
    );


    saveCart(cart);


    updateCart();

}


// ==========================================================
// CLEAR CART
// ==========================================================

function clearCart() {

    localStorage.removeItem(
        CART_STORAGE_KEY
    );


    updateCart();

}


// ==========================================================
// GET CART COUNT
// ==========================================================

function getCartCount() {

    const cart = getCart();

    return cart.length;

}


// ==========================================================
// UPDATE CART COUNT
// ==========================================================

function updateCart() {

    const cart = getCart();

    const count = cart.length;


    // ------------------------------------------------------
    // New recommended selector
    // ------------------------------------------------------

    document
        .querySelectorAll("[data-cart-count]")
        .forEach(element => {

            element.textContent = count;

        });


    // ------------------------------------------------------
    // Backward-compatible selector
    // ------------------------------------------------------
    // This allows older pages using:
    // id="cartCount"
    // to continue working.

    const oldCartCount =
        document.getElementById("cartCount");


    if (oldCartCount) {

        oldCartCount.textContent = count;

    }


    // ------------------------------------------------------
    // If cart drawer exists, refresh it
    // ------------------------------------------------------

    const cartItems =
        document.getElementById("cartItems");


    if (cartItems) {

        renderCart();

    }

}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================================
// RENDER CART
// ==========================================================

function renderCart() {

    const cart =
        getCart();


    const cartItemsContainer =
        document.getElementById(
            "cartItems"
        );


    const cartTotal =
        document.getElementById(
            "cartTotal"
        );


    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    // If this page doesn't have a cart drawer,
    // there is nothing to render.

    if (!cartItemsContainer) {

        return;

    }


    // ------------------------------------------------------
    // EMPTY CART
    // ------------------------------------------------------

    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `

            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h3>Your cart is empty</h3>

                <p>
                    Add a program or e-book to
                    get started.
                </p>

            </div>

        `;


        if (cartTotal) {

            cartTotal.innerHTML = "";

        }


        if (checkoutButton) {

            checkoutButton.disabled = true;

        }


        return;

    }


    // ------------------------------------------------------
    // CART ITEMS
    // ------------------------------------------------------

    let html = "";


    cart.forEach(item => {

        const billingText =
            item.billing === "monthly"
                ? "Monthly"
                : "One-time";


        html += `

            <div class="cart-item">

                <div class="cart-item-info">

                    <div class="cart-item-name">
                        ${escapeHtml(item.name)}
                    </div>

                    <div class="cart-item-meta">
                        ${billingText}
                    </div>

                </div>


                <div class="cart-item-right">

                    <strong>
                        ₹${Number(item.price)}
                    </strong>

                    <button
                        type="button"
                        class="cart-remove"
                        data-remove-product="${escapeHtml(item.id)}"
                    >
                        Remove
                    </button>

                </div>

            </div>

        `;

    });


    cartItemsContainer.innerHTML =
        html;


    // ------------------------------------------------------
    // REMOVE BUTTONS
    // ------------------------------------------------------

    document
        .querySelectorAll(
            "[data-remove-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const productId =
                        this.getAttribute(
                            "data-remove-product"
                        );


                    removeFromCart(
                        productId
                    );

                }
            );

        });


    // ------------------------------------------------------
    // ONE-TIME TOTAL
    // ------------------------------------------------------

    const oneTimeTotal =
        cart

            .filter(
                item =>
                    item.billing ===
                    "one-time"
            )

            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(item.price),

                0
            );


    // ------------------------------------------------------
    // MONTHLY TOTAL
    // ------------------------------------------------------

    const monthlyTotal =
        cart

            .filter(
                item =>
                    item.billing ===
                    "monthly"
            )

            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(item.price),

                0
            );


    // ------------------------------------------------------
    // TOTAL DISPLAY
    // ------------------------------------------------------

    let totalHtml = "";


    if (oneTimeTotal > 0) {

        totalHtml += `

            <div class="cart-total-row">

                <span>
                    Pay today
                </span>

                <strong>
                    ₹${oneTimeTotal}
                </strong>

            </div>

        `;

    }


    if (monthlyTotal > 0) {

        totalHtml += `

            <div class="cart-total-row">

                <span>
                    Monthly
                </span>

                <strong>
                    ₹${monthlyTotal}/month
                </strong>

            </div>

        `;

    }


    if (cartTotal) {

        cartTotal.innerHTML =
            totalHtml;

    }


    if (checkoutButton) {

        checkoutButton.disabled =
            false;

    }

}


// ==========================================================
// OPEN CART
// ==========================================================

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    const drawer =
        document.getElementById(
            "cartDrawer"
        );


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    if (drawer) {

        drawer.classList.add(
            "active"
        );

    }


    renderCart();

}


// ==========================================================
// CLOSE CART
// ==========================================================

function closeCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    const drawer =
        document.getElementById(
            "cartDrawer"
        );


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    if (drawer) {

        drawer.classList.remove(
            "active"
        );

    }

}


// ==========================================================
// CHECKOUT
// ==========================================================

function proceedToCheckout() {

    const cart = getCart();

    // Cart empty
    if (cart.length === 0) {
        return;
    }

    // ------------------------------------------------------
    // Calculate totals
    // ------------------------------------------------------

    const oneTimeTotal = cart
        .filter(item => item.billing === "one-time")
        .reduce(
            (total, item) =>
                total + Number(item.price),
            0
        );

    const monthlyTotal = cart
        .filter(item => item.billing === "monthly")
        .reduce(
            (total, item) =>
                total + Number(item.price),
            0
        );


    // ------------------------------------------------------
    // Create checkout overlay
    // ------------------------------------------------------

    let existingCheckout =
        document.getElementById("nextsproutCheckout");

    if (existingCheckout) {
        existingCheckout.remove();
    }


    // ------------------------------------------------------
    // Order summary
    // ------------------------------------------------------

    let orderItemsHtml = "";

    cart.forEach(item => {

        const billingText =
            item.billing === "monthly"
                ? "Monthly"
                : "One-time";

        orderItemsHtml += `
            <div style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                padding:12px 0;
                border-bottom:1px solid #EAE4F0;
            ">

                <div>
                    <strong>
                        ${escapeHtml(item.name)}
                    </strong>

                    <div style="
                        color:#756B80;
                        font-size:12px;
                        margin-top:3px;
                    ">
                        ${billingText}
                    </div>
                </div>

                <strong>
                    ₹${Number(item.price)}
                </strong>

            </div>
        `;

    });


    // ------------------------------------------------------
    // Total
    // ------------------------------------------------------

    let totalHtml = "";

    if (oneTimeTotal > 0) {

        totalHtml += `
            <div style="
                display:flex;
                justify-content:space-between;
                margin-top:15px;
            ">
                <span>Pay today</span>

                <strong>
                    ₹${oneTimeTotal}
                </strong>
            </div>
        `;

    }

    if (monthlyTotal > 0) {

        totalHtml += `
            <div style="
                display:flex;
                justify-content:space-between;
                margin-top:8px;
                color:#756B80;
            ">
                <span>Monthly</span>

                <strong>
                    ₹${monthlyTotal}/month
                </strong>
            </div>
        `;

    }


    // ------------------------------------------------------
    // Checkout HTML
    // ------------------------------------------------------

    const checkoutOverlay = document.createElement("div");

    checkoutOverlay.id = "nextsproutCheckout";

    checkoutOverlay.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            background:rgba(32,20,50,.45);
            z-index:1000;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        ">

            <div style="
                width:min(520px,100%);
                max-height:90vh;
                overflow-y:auto;
                background:white;
                border-radius:24px;
                padding:28px;
                box-shadow:0 25px 70px rgba(0,0,0,.2);
                font-family:Poppins,sans-serif;
            ">

                <!-- HEADER -->

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                ">

                    <div>

                        <div style="
                            color:#5425A8;
                            font-size:12px;
                            font-weight:800;
                            letter-spacing:1px;
                        ">
                            NEXTSPROUT
                        </div>

                        <h2 style="
                            margin:4px 0 0;
                            color:#33204F;
                            font-size:26px;
                        ">
                            Checkout
                        </h2>

                    </div>


                    <button
                        type="button"
                        id="closeNextSproutCheckout"
                        style="
                            border:none;
                            background:#F1EAFF;
                            color:#5425A8;
                            width:38px;
                            height:38px;
                            border-radius:50%;
                            font-size:20px;
                            cursor:pointer;
                        "
                    >
                        ×
                    </button>

                </div>


                <!-- ORDER SUMMARY -->

                <div style="
                    background:#FFFDF7;
                    border:1px solid #EAE4F0;
                    border-radius:16px;
                    padding:16px;
                    margin-bottom:22px;
                ">

                    <h3 style="
                        margin:0 0 8px;
                        color:#33204F;
                        font-size:15px;
                    ">
                        Your Order
                    </h3>

                    ${orderItemsHtml}

                    ${totalHtml}

                </div>


                <!-- CUSTOMER DETAILS -->

                <form id="nextsproutCheckoutForm">

                    <h3 style="
                        margin:0 0 15px;
                        color:#33204F;
                        font-size:18px;
                    ">
                        Your Details
                    </h3>


                    <!-- NAME -->

                    <label style="
                        display:block;
                        margin-bottom:6px;
                        font-size:13px;
                        font-weight:700;
                        color:#443A50;
                    ">
                        Full Name *
                    </label>

                    <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        placeholder="Enter your full name"
                        required
                        style="
                            width:100%;
                            padding:13px 14px;
                            border:1px solid #EAE4F0;
                            border-radius:12px;
                            font-family:inherit;
                            font-size:14px;
                            margin-bottom:15px;
                            outline:none;
                        "
                    >


                    <!-- MOBILE -->

                    <label style="
                        display:block;
                        margin-bottom:6px;
                        font-size:13px;
                        font-weight:700;
                        color:#443A50;
                    ">
                        WhatsApp / Mobile Number *
                    </label>

                    <input
                        type="tel"
                        id="customerPhone"
                        name="customerPhone"
                        placeholder="Enter your WhatsApp number"
                        required
                        pattern="[0-9]{10}"
                        maxlength="10"
                        inputmode="numeric"
                        style="
                            width:100%;
                            padding:13px 14px;
                            border:1px solid #EAE4F0;
                            border-radius:12px;
                            font-family:inherit;
                            font-size:14px;
                            margin-bottom:15px;
                            outline:none;
                        "
                    >


                    <!-- EMAIL -->

                    <label style="
                        display:block;
                        margin-bottom:6px;
                        font-size:13px;
                        font-weight:700;
                        color:#443A50;
                    ">
                        Email Address *
                    </label>

                    <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        placeholder="Enter your email address"
                        required
                        style="
                            width:100%;
                            padding:13px 14px;
                            border:1px solid #EAE4F0;
                            border-radius:12px;
                            font-family:inherit;
                            font-size:14px;
                            margin-bottom:15px;
                            outline:none;
                        "
                    >


                    <!-- MARKETING CONSENT -->

                    <label style="
                        display:flex;
                        align-items:flex-start;
                        gap:10px;
                        margin:5px 0 20px;
                        color:#756B80;
                        font-size:12px;
                        line-height:1.5;
                        cursor:pointer;
                    ">

                        <input
                            type="checkbox"
                            id="marketingConsent"
                            name="marketingConsent"
                            style="
                                margin-top:3px;
                                accent-color:#5425A8;
                            "
                        >

                        <span>
                            I'd like to receive updates, new products
                            and special offers from NextSprout.
                        </span>

                    </label>


                    <!-- CONTINUE -->

                    <button
                        type="submit"
                        style="
                            width:100%;
                            border:none;
                            background:#5425A8;
                            color:white;
                            padding:15px;
                            border-radius:999px;
                            font-family:inherit;
                            font-size:15px;
                            font-weight:800;
                            cursor:pointer;
                        "
                    >
                        Continue to Payment
                    </button>


                    <p style="
                        margin:12px 0 0;
                        text-align:center;
                        color:#756B80;
                        font-size:11px;
                    ">
                        Your details will be used to process your order.
                    </p>

                </form>

            </div>

        </div>

    `;


    document.body.appendChild(checkoutOverlay);


    // ------------------------------------------------------
    // CLOSE CHECKOUT
    // ------------------------------------------------------

    document
        .getElementById("closeNextSproutCheckout")
        .addEventListener(
            "click",
            function () {

                checkoutOverlay.remove();

            }
        );


    // ------------------------------------------------------
    // CHECKOUT FORM SUBMIT
    // ------------------------------------------------------

    document
        .getElementById("nextsproutCheckoutForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const customerName =
                    document
                        .getElementById("customerName")
                        .value
                        .trim();

                const customerPhone =
                    document
                        .getElementById("customerPhone")
                        .value
                        .trim();

                const customerEmail =
                    document
                        .getElementById("customerEmail")
                        .value
                        .trim();

                const marketingConsent =
                    document
                        .getElementById("marketingConsent")
                        .checked;


                // --------------------------------------------------
                // Basic validation
                // --------------------------------------------------

                if (!customerName) {

                    alert("Please enter your full name.");

                    return;

                }


                if (!/^[0-9]{10}$/.test(customerPhone)) {

                    alert(
                        "Please enter a valid 10-digit mobile number."
                    );

                    return;

                }


                if (!customerEmail) {

                    alert("Please enter your email address.");

                    return;

                }


                // --------------------------------------------------
                // CUSTOMER / ORDER DATA
                // --------------------------------------------------

                const customerOrder = {

                    customer: {

                        name: customerName,

                        phone: customerPhone,

                        email: customerEmail,

                        marketingConsent:
                            marketingConsent

                    },

                    order: {

                        items: cart,

                        oneTimeTotal:
                            oneTimeTotal,

                        monthlyTotal:
                            monthlyTotal,

                        createdAt:
                            new Date().toISOString()

                    }

                };


                // --------------------------------------------------
                // TEMPORARY STORAGE
                // --------------------------------------------------
                // This is only for testing.
                // Later this data will be sent to
                // your real database/backend.

                sessionStorage.setItem(
                    "nextsprout_customer_order",
                    JSON.stringify(
                        customerOrder
                    )
                );


                console.log(
                    "NextSprout Customer Order:",
                    customerOrder
                );


                // --------------------------------------------------
                // TEMPORARY MESSAGE
                // --------------------------------------------------

                alert(
                    "Customer details captured successfully.\\n\\n" +
                    "Name: " +
                    customerName +
                    "\\n" +
                    "Mobile: " +
                    customerPhone +
                    "\\n" +
                    "Email: " +
                    customerEmail +
                    "\\n\\n" +
                    "Payment gateway will be connected in the next step."
                );


                checkoutOverlay.remove();

            }
        );

}


// ==========================================================
// STORAGE EVENT
// ==========================================================
// If another browser tab changes the cart,
// update this page automatically.

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            CART_STORAGE_KEY
        ) {

            updateCart();

        }

    }
);


// ==========================================================
// ESC KEY
// ==========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeCart();

        }

    }
);


// ==========================================================
// OVERLAY CLICK
// ==========================================================

document.addEventListener(
    "click",
    function (event) {

        const overlay =
            document.getElementById(
                "cartOverlay"
            );


        if (
            overlay &&
            event.target === overlay
        ) {

            closeCart();

        }

    }
);


// ==========================================================
// INITIALIZE CART
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCart();

    }
);