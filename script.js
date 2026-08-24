// State Management
let currentView = 'landing-view';
let userProfile = {};
let currentQuestionIndex = 0;
let isExistingCustomer = false;
let leadData = null;

// DOM Elements
const chatHistory = document.getElementById('chat-history');
const chatInputArea = document.getElementById('chat-input-area');
const liveProfileDetails = document.getElementById('live-profile-details');

// AI Conversation Flow Definition
const conversationFlow = [
    {
        question: "What are you planning to finance?",
        key: "purpose",
        type: "options",
        options: ["Home", "Car / Vehicle", "Education", "Personal expenses"]
    },
    {
        question: "Approximately how much would you need?",
        key: "amount",
        type: "options",
        options: ["₹5L", "₹10L", "₹20L", "₹50L+", "Custom amount"]
    },
    {
        question: "What matters most to you in a loan?",
        key: "priority",
        type: "options",
        options: ["Lower EMI", "Lower interest rate", "Flexible repayment", "Faster repayment"]
    },
    {
        question: "What's your approximate monthly income?",
        key: "income",
        type: "input",
        placeholder: "E.g. 85000",
        inputType: "number"
    },
    {
        question: "Is there anything else you'd like us to consider?",
        key: "additional",
        type: "input",
        placeholder: "Type any specific requirements..."
    }
];

// Dummy Products Data
const productsData = [
    {
        id: "home-adv",
        name: "Nova Home Advantage Loan",
        category: "Home",
        rate: "8.5%",
        amount: "Up to ₹5 Cr",
        tenure: "Up to 30 years",
        emi: "₹768 per lakh",
        bestFor: "Lower EMI",
        benefits: ["Zero processing fee", "No prepayment penalty", "Doorstep service"],
        reason: "Recommended because you prioritized lower EMI and your requested amount falls within this product's range."
    },
    {
        id: "home-flex",
        name: "Nova Home Flex",
        category: "Home",
        rate: "8.9%",
        amount: "Up to ₹2 Cr",
        tenure: "Up to 20 years",
        emi: "₹890 per lakh",
        bestFor: "Flexible repayment",
        benefits: ["Step-up EMI option", "Overdraft facility", "Quick approval"],
        reason: "A great secondary option offering flexible repayment structures based on your income profile."
    },
    {
        id: "home-smart",
        name: "Nova Home Smart",
        category: "Home",
        rate: "8.2%",
        amount: "Up to ₹1 Cr",
        tenure: "Up to 15 years",
        emi: "₹960 per lakh",
        bestFor: "Faster repayment",
        benefits: ["Lowest interest rate", "Digital sanction", "Dedicated RM"],
        reason: "Offers the lowest interest rate if you prefer to close the loan faster with slightly higher EMIs."
    },
    {
        id: "auto-prime",
        name: "Nova Auto Prime",
        category: "Car / Vehicle",
        rate: "9.2%",
        amount: "Up to 100% On-road",
        tenure: "Up to 7 years",
        emi: "₹1,615 per lakh",
        bestFor: "Lower interest rate",
        benefits: ["Instant approval for existing customers", "100% financing", "No income docs up to 10L"],
        reason: "Perfect match for your vehicle needs with competitive interest rates."
    },
    {
        id: "personal-plus",
        name: "Nova Personal Plus",
        category: "Personal expenses",
        rate: "10.99%",
        amount: "Up to ₹25 Lakhs",
        tenure: "Up to 5 years",
        emi: "₹2,174 per lakh",
        bestFor: "Faster repayment",
        benefits: ["Disbursal in 4 hours", "No collateral required", "Minimal documentation"],
        reason: "Fast access to funds for your personal needs with flexible repayment."
    }
];

// Navigation
function navigateTo(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    currentView = viewId;
    window.scrollTo(0, 0);
}

// Reset App
function resetApp() {
    userProfile = {};
    isExistingCustomer = false;
    leadData = null;
    navigateTo('landing-view');
}

// Auth Flow (Mock)
function handleLogin(e) {
    e.preventDefault();
    isExistingCustomer = true;
    navigateTo('customer-dashboard-view');
}

// Start Discovery Flow
function startDiscovery(prefilledCategory = null, fromDashboard = false) {
    userProfile = {};
    document.getElementById('discovery-form').reset();
    
    if (prefilledCategory) {
        document.getElementById('loanPurpose').value = prefilledCategory;
    }
    
    navigateTo('discovery-view');
}

// Slider Syncing
function syncSlider(sourceId, targetId) {
    const val = document.getElementById(sourceId).value;
    document.getElementById(targetId).value = val;
}

// Discovery Form Submission
function submitDiscoveryForm(e) {
    e.preventDefault();
    
    const purpose = document.getElementById('loanPurpose').value;
    const amount = document.getElementById('loanAmountInput').value;
    const tenure = document.getElementById('loanTenureInput').value;
    const priority = document.querySelector('input[name="loanPriority"]:checked').value;
    const income = document.getElementById('monthlyIncome').value;

    userProfile = {
        purpose: purpose,
        amount: `₹${parseInt(amount).toLocaleString('en-IN')}`,
        tenure: `${tenure} Years`,
        priority: priority,
        income: `₹${parseInt(income).toLocaleString('en-IN')}`,
        additional: "Standard application"
    };
    
    // Jump straight to recommendations or show profile summary first. Let's go to recommendations.
    showRecommendations();
}

function populateProfileView() {
    const container = document.getElementById('final-profile-content');
    const labels = {
        purpose: "Purpose",
        amount: "Estimated Loan Amount",
        priority: "Preferred Priority",
        income: "Monthly Income",
        additional: "Additional Notes"
    };
    
    let html = '';
    for (const [key, val] of Object.entries(userProfile)) {
        html += `
            <div class="profile-item">
                <div class="profile-label">${labels[key]}</div>
                <div class="profile-val">${val}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// Recommendations Logic
function showRecommendations() {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '';
    
    // Simple filter logic for demo based on purpose
    let recommendedProducts = productsData.filter(p => 
        p.category === userProfile.purpose || 
        (userProfile.purpose === "Home" && p.category === "Home")
    );
    
    if (recommendedProducts.length === 0) {
        // Fallback to personal loan if no exact match
        recommendedProducts = [productsData.find(p => p.id === 'personal-plus')];
    }
    
    // Just ensure we have at most 3
    recommendedProducts = recommendedProducts.slice(0, 3);
    
    recommendedProducts.forEach((prod, index) => {
        const isBestMatch = index === 0;
        
        const card = document.createElement('div');
        card.className = 'loan-card';
        card.innerHTML = `
            ${isBestMatch ? '<div class="best-match-badge">Best Match</div>' : ''}
            <h3>${prod.name}</h3>
            <div class="rate-highlight">${prod.rate} <span>interest p.a.</span></div>
            
            <div class="loan-specs">
                <div class="spec-row">
                    <span>Eligible Amount</span>
                    <strong>${prod.amount}</strong>
                </div>
                <div class="spec-row">
                    <span>Max Tenure</span>
                    <strong>${prod.tenure}</strong>
                </div>
                <div class="spec-row">
                    <span>Est. EMI</span>
                    <strong>${prod.emi}</strong>
                </div>
            </div>
            
            <div class="why-match">
                ${prod.reason}
            </div>
            
            <div class="card-actions">
                <button class="btn btn-outline btn-full" onclick="showProductDetails('${prod.id}')">View Details</button>
                <button class="btn btn-primary btn-full" onclick="initiateLeadCapture('${prod.id}')">Interested</button>
            </div>
        `;
        container.appendChild(card);
    });
    
    navigateTo('recommendations-view');
}

// Product Details
function showProductDetails(productId) {
    const prod = productsData.find(p => p.id === productId);
    const container = document.getElementById('product-detail-content');
    
    let benefitsHtml = prod.benefits.map(b => `<li>${b}</li>`).join('');
    
    container.innerHTML = `
        <div class="detail-header">
            <h2>${prod.name}</h2>
            <p class="text-muted">Explore detailed terms and benefits</p>
        </div>
        
        <div class="detail-grid">
            <div>
                <div class="loan-specs">
                    <div class="spec-row">
                        <span>Interest Rate</span>
                        <strong class="text-primary">${prod.rate} p.a.</strong>
                    </div>
                    <div class="spec-row">
                        <span>Maximum Amount</span>
                        <strong>${prod.amount}</strong>
                    </div>
                    <div class="spec-row">
                        <span>Maximum Tenure</span>
                        <strong>${prod.tenure}</strong>
                    </div>
                    <div class="spec-row">
                        <span>Estimated EMI</span>
                        <strong>${prod.emi}</strong>
                    </div>
                </div>
                
                <div class="ai-reasoning">
                    <h4>Why we recommended this for you</h4>
                    <p>${prod.reason}</p>
                    <p class="mt-20 text-muted" style="font-size:0.85rem">Based on your stated priority of <strong>${userProfile.priority || 'standard features'}</strong>.</p>
                </div>
            </div>
            
            <div>
                <h3>Key Benefits</h3>
                <ul class="benefits-list mt-20">
                    ${benefitsHtml}
                    <li>Simple digital process</li>
                    <li>Fast approval workflow</li>
                </ul>
            </div>
        </div>
    `;
    
    // Update the continue button to point to the correct product
    document.querySelector('.interest-cta-box .btn-primary').onclick = () => initiateLeadCapture(prod.id);
    
    navigateTo('product-details-view');
}

// Lead Capture
function initiateLeadCapture(productId) {
    const prod = productsData.find(p => p.id === productId);
    leadData = {
        productName: prod.name,
        amount: userProfile.amount || 'N/A',
        purpose: userProfile.purpose || 'N/A',
        priority: userProfile.priority || 'N/A'
    };
    navigateTo('lead-capture-view');
}

function submitLead(e) {
    e.preventDefault();
    
    const name = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    
    leadData.name = name;
    leadData.phone = phone;
    leadData.status = 'New';
    leadData.intent = 'High';
    
    // Add to Admin Dashboard mock table
    addLeadToDashboard(leadData);
    
    // Show Success
    const refId = Math.floor(10000 + Math.random() * 90000);
    document.getElementById('success-ref').innerText = refId;
    document.getElementById('success-product').innerText = leadData.productName;
    
    navigateTo('success-view');
}

// Admin Dashboard Update
function addLeadToDashboard(lead) {
    const tbody = document.getElementById('leads-table-body');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${lead.name} <span class="badge badge-best" style="font-size:0.6rem; margin-left:5px">NEW</span></td>
        <td>${lead.purpose}</td>
        <td>${lead.amount}</td>
        <td>${lead.productName}</td>
        <td><span class="badge badge-high">${lead.intent}</span></td>
        <td><span class="status new">${lead.status}</span></td>
        <td><button class="btn-small">View</button></td>
    `;
    
    // Insert at top
    tbody.insertBefore(newRow, tbody.firstChild);
    
    // Update stats
    const statsEl = document.getElementById('stat-new-leads');
    statsEl.innerText = parseInt(statsEl.innerText) + 1;
}

// Init
window.onload = () => {
    // We are on landing page initially.
};

// RAG Chatbot Logic
function toggleRagChat() {
    const chatWindow = document.getElementById('rag-chatbot-window');
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
}

function handleRagInput(e) {
    if (e.key === 'Enter') {
        sendRagMessage();
    }
}

function sendRagMessage() {
    const input = document.getElementById('rag-chat-input');
    const text = input.value.trim();
    if (!text) return;

    const chatBody = document.getElementById('rag-chat-body');
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.innerText = text;
    chatBody.appendChild(userMsg);
    
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate RAG response after short delay
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'msg msg-ai';
        aiMsg.innerHTML = `<span style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 5px;">[Retrieved from knowledge_base/loan_policies_2026.pdf]</span>Based on our internal documents, the required CIBIL score for this product tier is 720 or above. Would you like to know more about the income documentation required?`;
        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
}

function mockUploadPDF() {
    const chatBody = document.getElementById('rag-chat-body');
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.innerHTML = `📎 <em>income_statement_2026.pdf uploaded</em>`;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'msg msg-ai';
        aiMsg.innerHTML = `I've analyzed your uploaded document. Your stated income looks sufficient for the top-tier loans. Is there anything specific you want me to check in this document?`;
        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1500);
}
